'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TradingChart from '@/components/TradingChart';
import { Clock, Calculator, Calendar, Menu, X } from 'lucide-react';

const API_BASE = 'http://localhost:8080/api';

export default function Home() {
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [calculations, setCalculations] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/data?ticker=^SPX&start_date=2023-01-01`);
      setMarketData(res.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setLoading(false);
    }
  };

  const handleAnchorSelect = async (price: number, date: string) => {
    setCalculating(true);
    setSidebarOpen(true);
    try {
      const res = await axios.post(`${API_BASE}/calculate-cycles`, {
        anchor_price: price,
        anchor_date: date
      });
      
      const calcData = res.data;
      setCalculations(calcData);
      
      // Update markers for the chart
      setMarkers([
        { date: calcData.future_reversal_date_string, color: 'rgba(212, 175, 55, 0.6)' }
      ]);
    } catch (err) {
      console.error('Calculation failed:', err);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-200 font-sans overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        <header className="h-16 border-b border-slate-800 flex items-center px-4 md:px-6 justify-between bg-slate-900/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-2 md:gap-3">
            <Clock className="text-amber-500 w-5 h-5 md:w-6 md:h-6" />
            <h1 className="text-base md:text-lg font-medium tracking-wide">
              Gann <span className="text-amber-500 hidden sm:inline">Universal Clock</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest font-semibold">
              S&amp;P 500
            </div>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-slate-400 hover:text-amber-500 p-1">
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>

        <main className="flex-1 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            </div>
          ) : (
            <TradingChart 
              data={marketData} 
              onAnchorSelect={handleAnchorSelect} 
              futureMarkers={markers} 
            />
          )}
          
          <div className="absolute top-4 left-4 z-10 bg-slate-800/80 backdrop-blur border border-slate-700 px-4 py-2 rounded shadow-lg text-sm pointer-events-none">
            <p className="text-slate-300">Click a candle (High/Low approx) to calculate Future Ephemeris Harmonic</p>
          </div>
        </main>
      </div>

      {/* Expandable Sidebar */}
      <div 
        className={`${sidebarOpen ? 'translate-x-0 w-full md:w-96' : 'translate-x-full md:translate-x-0 w-full md:w-0'} fixed top-16 bottom-0 right-0 md:static md:top-0 transition-all duration-300 border-l border-slate-800 bg-slate-900/95 flex flex-col overflow-hidden z-30`}
      >
        <div className="p-4 md:p-6 w-full md:w-96 flex-shrink-0 flex flex-col h-full overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-2 mb-8">
            <Calculator className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-medium">Ephemeris Cycle</h2>
          </div>

          {!calculations && !calculating && (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500">
              <Clock className="w-12 h-12 mb-4 opacity-20" />
              <p>Awaiting anchor selection...</p>
            </div>
          )}

          {calculating && (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="animate-pulse flex space-x-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <div className="w-2 h-2 bg-amber-500 rounded-full animation-delay-200"></div>
                <div className="w-2 h-2 bg-amber-500 rounded-full animation-delay-400"></div>
              </div>
              <p className="mt-4 text-slate-400 text-sm">Running astronomical root-finder...</p>
            </div>
          )}

          {calculations && !calculating && (
            <div className="space-y-6">
              {/* Anchor Details */}
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Anchor Coordinates</div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-400">Date</span>
                  <span className="font-mono">{calculations.anchor_date.split('T')[0]}</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-400">Price</span>
                  <span className="font-mono text-amber-500">{calculations.anchor_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Base Solar RA</span>
                  <span className="font-mono">{calculations.base_ra_hours.toFixed(6)} hr</span>
                </div>
              </div>

              {/* Mathematical breakdown */}
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full -z-10"></div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Time Conversion Matrix</div>
                
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between border-b border-slate-700 pb-2">
                    <span className="text-slate-400">P / 60</span>
                    <span>{calculations.time_increment.raw_hours} Hrs</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700 pb-2">
                    <span className="text-slate-400">Mod 24</span>
                    <span className="text-amber-500 font-bold">{calculations.time_increment.hours} Hrs</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700 pb-2">
                    <span className="text-slate-400">Minutes</span>
                    <span>{calculations.time_increment.minutes} Min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Seconds</span>
                    <span>{calculations.time_increment.seconds} Sec</span>
                  </div>
                </div>
              </div>

              {/* Target */}
              <div className="bg-slate-800 rounded-lg p-4 border border-amber-500/30">
                <div className="text-xs text-amber-500/70 uppercase tracking-wider mb-2">Target Ephemeris Match</div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-slate-400">Target RA</span>
                  <span className="font-mono">{calculations.target_ra_hours.toFixed(6)} hr</span>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <span className="text-slate-300">Reversal Date</span>
                  </div>
                  <div className="text-xl font-medium tracking-wider text-amber-500 font-mono mt-1">
                    {calculations.future_reversal_date_string}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
