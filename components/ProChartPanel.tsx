import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, AreaSeries, IChartApi } from 'lightweight-charts';
import { RefreshCw, Maximize2, Minimize2, TrendingUp, TrendingDown, Target, ShieldAlert, Crosshair, BarChart3, Layers } from 'lucide-react';
import { CryptoData, ChartPoint, TradeSignal } from '../types';
import { SoundService } from '../services/soundService';

interface ProChartPanelProps {
  coinData: CryptoData | null;
  chartData: ChartPoint[];
  openInterest: number;
  signal: TradeSignal | null;
  isProcessing: boolean;
  selectedDays: number;
  onDaysChange: (days: number) => void;
  onReAnalyze: () => void;
}

export const ProChartPanel: React.FC<ProChartPanelProps> = ({
  coinData,
  chartData,
  openInterest,
  signal,
  isProcessing,
  selectedDays,
  onDaysChange,
  onReAnalyze
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!chartContainerRef.current || chartData.length === 0) return;

    // Clean up any existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const isPositive = (coinData?.price_change_percentage_24h || 0) >= 0;
    const primaryColor = isPositive ? '#10b981' : '#f43f5e';
    const topGradient = isPositive ? 'rgba(16, 185, 129, 0.28)' : 'rgba(244, 63, 94, 0.28)';

    const chart = createChart(chartContainerRef.current, {
      layout: { 
        background: { type: ColorType.Solid, color: 'transparent' }, 
        textColor: '#6b7280',
        fontFamily: "'JetBrains Mono', monospace"
      },
      grid: { 
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' }, 
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' } 
      },
      crosshair: {
        vertLine: { color: 'rgba(249, 115, 22, 0.4)', width: 1, style: 3 },
        horzLine: { color: 'rgba(249, 115, 22, 0.4)', width: 1, style: 3 }
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: { 
        timeVisible: true, 
        borderColor: 'rgba(255, 255, 255, 0.06)',
        secondsVisible: false
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.06)',
        scaleMargins: { top: 0.1, bottom: 0.1 }
      }
    });

    const series = chart.addSeries(AreaSeries, { 
      lineColor: primaryColor, 
      topColor: topGradient, 
      bottomColor: 'rgba(0, 0, 0, 0)',
      lineWidth: 2,
    });

    // Format chart points
    series.setData(chartData.map(d => ({ time: Math.floor(d.date / 1000) as any, value: d.price })));
    chart.timeScale().fitContent();
    chartRef.current = chart;

    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || !chartContainerRef.current || !chartRef.current) return;
      const { width, height } = entries[0].contentRect;
      chartRef.current.applyOptions({ width, height });
      chartRef.current.timeScale().fitContent();
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [chartData, coinData]);

  const toggleFullscreen = () => {
    SoundService.playClick();
    setIsFullscreen(!isFullscreen);
  };

  if (!coinData) {
    return (
      <div className="h-full flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#07090e]">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-center text-orange-400 mb-3 animate-pulse">
          <BarChart3 size={32} />
        </div>
        <h2 className="text-base font-bold text-white uppercase tracking-wider mb-1">
          TradingView Pro Chart Canvas
        </h2>
        <p className="text-xs text-gray-500 max-w-sm">
          Select an asset from the sidebar or press <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-gray-300">⌘K</kbd> to load real-time candlestick telemetry.
        </p>
      </div>
    );
  }

  const change = coinData.price_change_percentage_24h || 0;
  const isPositive = change >= 0;

  return (
    <div className={`flex flex-col bg-[#07090e] ${isFullscreen ? 'fixed inset-0 z-50 p-4' : 'h-full flex-1'}`}>
      {/* Top HUD Bar */}
      <div className="p-3 md:p-4 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3 bg-white/[0.01]">
        {/* Asset Identity & Live Price */}
        <div className="flex items-center gap-3">
          {coinData.image ? (
            <img 
              src={coinData.image} 
              alt={coinData.name} 
              className="w-10 h-10 rounded-xl object-contain bg-white/5 border border-white/10 p-1 shadow-md shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center font-bold text-base text-orange-400 font-mono shrink-0">
              {coinData.symbol.slice(0, 3).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">
                {coinData.name}
              </h2>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400">
                {coinData.symbol.toUpperCase()}/USDT
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl md:text-2xl font-mono font-black text-white">
                ${coinData.current_price >= 1 ? coinData.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : coinData.current_price.toFixed(4)}
              </span>
              <span className={`text-xs font-mono font-bold flex items-center gap-0.5 px-2 py-0.5 rounded ${
                isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
              }`}>
                {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {isPositive ? '+' : ''}{change.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Telemetry Chips (24h High/Low, Volume, OI) */}
        <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-gray-400">
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-tight">24h High</div>
            <div className="font-semibold text-white">${coinData.high_24h ? coinData.high_24h.toLocaleString() : 'N/A'}</div>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-tight">24h Low</div>
            <div className="font-semibold text-white">${coinData.low_24h ? coinData.low_24h.toLocaleString() : 'N/A'}</div>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-tight">24h Volume</div>
            <div className="font-semibold text-white">${((coinData.total_volume || 0) / 1000000).toFixed(1)}M</div>
          </div>
          {openInterest > 0 && (
            <>
              <div className="w-px h-6 bg-white/10" />
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-tight">Open Interest</div>
                <div className="font-semibold text-blue-400">${(openInterest / 1000000).toFixed(1)}M</div>
              </div>
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Timeframe switch */}
          <div className="flex items-center bg-white/[0.04] p-1 rounded-lg border border-white/[0.08] text-xs font-mono">
            {[
              { days: 1, label: '1D' },
              { days: 7, label: '7D' },
              { days: 14, label: '14D' },
              { days: 30, label: '30D' }
            ].map(tf => (
              <button
                key={tf.days}
                onClick={() => {
                  SoundService.playClick();
                  onDaysChange(tf.days);
                }}
                className={`px-2 py-1 rounded-md transition-all font-semibold ${
                  selectedDays === tf.days
                    ? 'bg-orange-500 text-black shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              SoundService.playClick();
              onReAnalyze();
            }}
            disabled={isProcessing}
            className="p-2 rounded-lg bg-white/[0.04] hover:bg-orange-500/10 border border-white/[0.08] hover:border-orange-500/30 text-gray-300 hover:text-orange-400 transition-all"
            title="Re-run AI Analysis"
          >
            <RefreshCw size={15} className={isProcessing ? 'animate-spin text-orange-400' : ''} />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-gray-400 hover:text-white transition-all"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* Floating Signal Quick-Banner (Directly above Chart) */}
      {signal && (
        <div className="px-4 py-2 border-b border-white/[0.06] bg-black/40 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
              signal.action === 'LONG' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              signal.action === 'SHORT' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
              'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              AI: {signal.action}
            </span>
            <span className="text-gray-400 hidden sm:inline">
              Entry: <strong className="text-white">{signal.entry}</strong>
            </span>
            <span className="text-gray-400 hidden sm:inline">
              SL: <strong className="text-rose-400">{signal.stopLoss}</strong>
            </span>
            <span className="text-gray-400 hidden md:inline">
              TP1: <strong className="text-emerald-400">{signal.tp1}</strong>
            </span>
            <span className="text-gray-400 hidden lg:inline">
              TP2: <strong className="text-emerald-400">{signal.tp2}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <span>R:R {signal.riskRewardRatio}</span>
            <span>•</span>
            <span>{signal.confidence}% Confidence</span>
          </div>
        </div>
      )}

      {/* The Lightweight Chart Area */}
      <div className="flex-1 w-full min-h-[350px] relative p-2">
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};
