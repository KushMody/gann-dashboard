'use client';
import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { VerticalLinePrimitive } from './VerticalLinePlugin';

interface TradingChartProps {
    data: any[];
    onAnchorSelect: (price: number, date: string) => void;
    futureMarkers: any[];
}

export default function TradingChart({ data, onAnchorSelect, futureMarkers }: TradingChartProps) {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: 'solid', color: '#0f172a' }, // Slate 900
                textColor: '#94a3b8', // Slate 400
            },
            grid: {
                vertLines: { color: '#1e293b' }, // Slate 800
                horzLines: { color: '#1e293b' },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: '#334155',
            },
            crosshair: {
                mode: 0,
            },
            rightPriceScale: {
                borderColor: '#334155',
            }
        });

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#10b981',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#10b981',
            wickDownColor: '#ef4444',
        });

        chartRef.current = chart;
        seriesRef.current = candlestickSeries;

        if (data && data.length > 0) {
            candlestickSeries.setData(data);
        }

        // Handle Click Event to select Anchor
        chart.subscribeClick((param) => {
            if (!param.time || !param.seriesData || param.seriesData.size === 0) {
                return;
            }
            const barData: any = param.seriesData.get(candlestickSeries);
            if (barData) {
                // Usually user selects High or Low. Let's provide High for simplicity, 
                // or just the closing price. A popup might be better, but clicking 
                // we'll just pass the close price for now. 
                const anchorDate = typeof param.time === 'string' ? param.time : new Date((param.time as number) * 1000).toISOString().split('T')[0];
                onAnchorSelect(barData.close, anchorDate);
            }
        });

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, []);

    useEffect(() => {
        if (seriesRef.current && data.length > 0) {
            seriesRef.current.setData(data);
        }
    }, [data]);

    useEffect(() => {
        // Clear all primitive markers first if we need to? 
        // We can't clear easily without storing refs to them. 
        // For now, we'll recreate the chart when markers change if it's too complex,
        // or keep an array of active primitives.
        // Actually, let's keep it simple: we can detach all primitives if we stored them.
        
        if (chartRef.current && seriesRef.current && futureMarkers.length > 0) {
            futureMarkers.forEach(marker => {
                const line = new VerticalLinePrimitive(marker.date as Time, marker.color);
                seriesRef.current?.attachPrimitive(line);
            });
        }
    }, [futureMarkers]);

    return (
        <div ref={chartContainerRef} className="w-full h-full" />
    );
}
