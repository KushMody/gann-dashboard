# Gann Universal Clock Dashboard

A full-stack application implementing W.D. Gann's Universal Clock and Ephemeris cycle calculation.

## Architecture
- **Backend:** Python, FastAPI, Skyfield (Astronomical lookups), Pandas
- **Frontend:** Next.js, Tailwind CSS, Lightweight Charts

## Setup

### Backend
```bash
cd backend
python -m venv venv
# On Windows: .\venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate
pip install fastapi uvicorn pandas skyfield holidays yfinance pydantic
uvicorn main:app --reload --port 8080
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
