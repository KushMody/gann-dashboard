from abc import ABC, abstractmethod
import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta

class BaseDataFetcher(ABC):
    @abstractmethod
    def fetch_data(self, ticker: str, start_date: str, end_date: str) -> list[dict]:
        """
        Fetches historical data and returns a list of dictionaries 
        compatible with TradingView Lightweight Charts:
        [{'time': 'YYYY-MM-DD', 'open': ..., 'high': ..., 'low': ..., 'close': ...}]
        """
        pass

class YFinanceFetcher(BaseDataFetcher):
    def fetch_data(self, ticker: str, start_date: str, end_date: str = None) -> list[dict]:
        if end_date is None:
            end_date = datetime.now().strftime('%Y-%m-%d')
            
        df = yf.download(ticker, start=start_date, end=end_date)
        if df.empty:
            return []
            
        # yfinance returns MultiIndex columns sometimes in newer versions, flatten them
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = [col[0] for col in df.columns]
            
        df.reset_index(inplace=True)
        
        # Rename columns to match lightweight charts format
        df.rename(columns={
            'Date': 'time',
            'Open': 'open',
            'High': 'high',
            'Low': 'low',
            'Close': 'close'
        }, inplace=True)
        
        # Format date as 'YYYY-MM-DD'
        df['time'] = df['time'].dt.strftime('%Y-%m-%d')
        
        # Keep only required columns
        records = df[['time', 'open', 'high', 'low', 'close']].to_dict(orient='records')
        return records
