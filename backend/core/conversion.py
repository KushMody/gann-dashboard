import math

class GannConversionUtility:
    @staticmethod
    def price_to_time_increment(price: float) -> dict:
        """
        Converts an asset price to a time increment based on Gann Universal Clock rules.
        """
        # Calculate Raw Hours
        raw_hours = math.floor(price / 60)
        
        # Extract Remainder Minutes
        total_minutes = price % 60
        int_minutes = math.floor(total_minutes)
        
        # Extract Remainder Seconds
        seconds = (total_minutes - int_minutes) * 60
        
        # Apply Modulo-24 Wrapping
        wrapped_hours = raw_hours % 24
        
        return {
            "hours": wrapped_hours,
            "minutes": int_minutes,
            "seconds": round(seconds, 2),
            "raw_hours": raw_hours,
            "total_raw_minutes": price
        }
        
    @staticmethod
    def add_time_to_ra(current_ra_hours: float, time_increment: dict) -> float:
        """
        Adds the computed time increment to the current RA in hours and wraps around 24.
        """
        added_hours = time_increment["hours"] + (time_increment["minutes"] / 60) + (time_increment["seconds"] / 3600)
        target_ra = (current_ra_hours + added_hours) % 24
        return target_ra
