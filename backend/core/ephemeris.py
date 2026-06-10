from skyfield.api import load
from datetime import datetime, timedelta
import pytz
import holidays

class EphemerisEngine:
    def __init__(self):
        # Load the ephemeris data (de421 is lightweight and sufficient)
        self.eph = load('de421.bsp')
        self.earth = self.eph['earth']
        self.sun = self.eph['sun']
        self.ts = load.timescale()
        # Initialize NYSE holidays for rollover
        self.nyse_holidays = holidays.NYSE()

    def get_sun_ra(self, date: datetime) -> float:
        """Returns Geocentric Right Ascension of the Sun in hours (0-24)"""
        # Ensure UTC
        if date.tzinfo is None:
            date = date.replace(tzinfo=pytz.UTC)
        t = self.ts.from_datetime(date)
        astrometric = self.earth.at(t).observe(self.sun)
        ra, dec, distance = astrometric.radec()
        return ra.hours

    def roll_forward_to_market_open(self, dt: datetime) -> datetime:
        """
        If the calculated datetime falls on a weekend or NYSE holiday, 
        roll it forward to the next valid market open day at 09:30 AM EST.
        """
        # We need to work in EST/EDT to properly check holidays/weekends
        est = pytz.timezone('US/Eastern')
        dt_est = dt.astimezone(est)
        
        while True:
            # Check if weekend (5=Saturday, 6=Sunday)
            if dt_est.weekday() >= 5:
                # Add a day and set to 9:30 AM
                dt_est += timedelta(days=1)
                dt_est = dt_est.replace(hour=9, minute=30, second=0, microsecond=0)
                continue
                
            # Check if NYSE holiday
            if dt_est.date() in self.nyse_holidays:
                dt_est += timedelta(days=1)
                dt_est = dt_est.replace(hour=9, minute=30, second=0, microsecond=0)
                continue
                
            break
            
        return dt_est.astimezone(pytz.UTC)

    def find_future_date_by_ra(self, target_ra_hours: float, start_date: datetime, max_days_forward=15) -> datetime:
        """
        Iterative root finding for future date when sun hits the target_ra_hours.
        Tolerance: +/- 1 second of RA (approx 1/3600 hours).
        Bounds search to max_days_forward.
        """
        if start_date.tzinfo is None:
            start_date = start_date.replace(tzinfo=pytz.UTC)
        else:
            start_date = start_date.astimezone(pytz.UTC)

        left_date = start_date
        # Rough heuristic: sun moves ~1 degree (4 mins RA, or 1/15 hr) per day
        # So we set a safe upper bound.
        right_date = start_date + timedelta(days=max_days_forward)
        
        tolerance_hours = 1.0 / 3600.0
        start_ra = self.get_sun_ra(start_date)
        
        target_continuous_ra = target_ra_hours
        if target_continuous_ra < start_ra:
            target_continuous_ra += 24.0
            
        def get_continuous_ra(dt):
            ra = self.get_sun_ra(dt)
            if ra < start_ra - 12: # rough heuristic to detect wrap
                ra += 24.0
            return ra

        # Binary search
        for _ in range(50):
            mid_date = left_date + (right_date - left_date) / 2
            mid_ra = get_continuous_ra(mid_date)
            
            error = mid_ra - target_continuous_ra
            if abs(error) <= tolerance_hours:
                return self.roll_forward_to_market_open(mid_date)
                
            if mid_ra < target_continuous_ra:
                left_date = mid_date
            else:
                right_date = mid_date
                
        # Fallback to the best approximation if we hit 50 iterations without exactly satisfying tolerance
        best_date = left_date + (right_date - left_date) / 2
        return self.roll_forward_to_market_open(best_date)
