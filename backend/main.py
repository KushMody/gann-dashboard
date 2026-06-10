from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import pytz

from core.data_fetcher import YFinanceFetcher
from core.conversion import GannConversionUtility
from core.ephemeris import EphemerisEngine

app = FastAPI(title="Gann Universal Clock API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize singletons
fetcher = YFinanceFetcher()
ephemeris = EphemerisEngine()

class CycleRequest(BaseModel):
    anchor_price: float
    anchor_date: str # ISO format string 'YYYY-MM-DDTHH:MM:SSZ' or 'YYYY-MM-DD'

@app.get("/api/data")
def get_market_data(ticker: str = "^SPX", start_date: str = "2020-01-01", end_date: Optional[str] = None):
    try:
        data = fetcher.fetch_data(ticker, start_date, end_date)
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/calculate-cycles")
def calculate_cycles(req: CycleRequest):
    try:
        # 1. Parse Anchor Date
        try:
            # Try parsing with time first
            dt = datetime.fromisoformat(req.anchor_date.replace("Z", "+00:00"))
        except ValueError:
            # Fallback to date only, assuming market close or open
            dt = datetime.strptime(req.anchor_date, "%Y-%m-%d").replace(tzinfo=pytz.UTC)

        # 2. Get baseline RA for the anchor date
        base_ra = ephemeris.get_sun_ra(dt)
        
        # 3. Calculate Time Increment from Price
        time_increment = GannConversionUtility.price_to_time_increment(req.anchor_price)
        
        # 4. Calculate Target RA
        target_ra = GannConversionUtility.add_time_to_ra(base_ra, time_increment)
        
        # 5. Find Future Date (Root Finding)
        future_date = ephemeris.find_future_date_by_ra(target_ra, dt)
        
        return {
            "anchor_date": dt.isoformat(),
            "base_ra_hours": base_ra,
            "anchor_price": req.anchor_price,
            "time_increment": time_increment,
            "target_ra_hours": target_ra,
            "future_reversal_date": future_date.isoformat(),
            "future_reversal_date_string": future_date.strftime("%Y-%m-%d")
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
