
import React, { useEffect, useRef } from 'react';
import { CryptoData, ChartPoint, TradeSignal } from '../types';
import { TrendingUp, TrendingDown, Zap, RefreshCw, ExternalLink, Target, Activity, Layers, AlignLeft, Search, ShieldAlert, Crosshair, Info } from 'lucide-react';
import { createChart, ColorType, AreaSeries, IChartApi } from 'lightweight-charts';

interface AnalysisPanelProps {
  coinData: CryptoData | null;
  openInterest: number;
  chartData: ChartPoint[];
  signal: TradeSignal | null;
  isProcessing?: boolean;
  onReAnalyze: () => void;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ 
  coinData, openInterest, chartData, signal, isProcessing = false, onReAnalyze
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || chartData.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#9ca3af' },
      grid: { vertLines: { color: 'rgba(255,255,255,0.05)' }, horzLines: { color: 'rgba(255,255,255,0.05)' } },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: { timeVisible: true, borderColor: 'rgba(255,255,255,0.1)' },
    });

    const series = chart.addSeries(AreaSeries, { 
      lineColor: '#f97316', 
      topColor: 'rgba(249,115,22,0.3)', 
      bottomColor: 'rgba(249,115,22,0)',
      lineWidth: 2,
    });

    series.setData(chartData.map(d => ({ time: (d.date / 1000) as any, value: d.price })));
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
      chart.remove();
    };
  }, [chartData]);

  if (!coinData) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-gray-500 glass-panel rounded-none md:rounded-xl border-x-0 border-t-0 md:border min-h-0 bg-black/40 p-12 text-center">
         <div className="p-4 bg-white/5 rounded-full mb-4 animate-pulse"><Zap size={40} className="text-orange-500" /></div>
         <p className="text-sm font-bold text-white uppercase tracking-widest">Awaiting Selection</p>
         <p className="text-[10px] opacity-40 mt-1 uppercase font-mono">Select a target ticker or use the scanner</p>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex flex-col h-full gap-3 overflow-y-auto custom-scrollbar pb-6 min-h-0">
      
      {/* PRICE HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 p-3 md:p-4 glass-panel rounded-none md:rounded-xl border-x-0 border-t-0 md:border shrink-0 bg-black/30">
        {[
          { label: 'TARGET', value: coinData.symbol.toUpperCase() },
          { label: 'LIVE PRICE', value: `$${coinData.current_price.toLocaleString()}` },
          { label: '24H DELTA', value: `${coinData.price_change_percentage_24h.toFixed(2)}%`, color: coinData.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400' },
          { label: 'OPEN INTEREST', value: `$${(openInterest / 1000000).toFixed(1)}M`, color: 'text-blue-400' }
        ].map((item, i) => (
           <div key={i} className="flex flex-col min-w-0">
              <span className="text-[8px] text-gray-500 font-bold tracking-widest uppercase">{item.label}</span>
              <span className={`text-sm md:text-lg font-bold font-mono ${item.color || 'text-white'} truncate`}>{item.value}</span>
           </div>
        ))}
        <button onClick={onReAnalyze} disabled={isProcessing} className="absolute top-2 right-2 p-1.5 bg-orange-500/10 text-orange-400 rounded-lg border border-orange-500/20 hover:bg-orange-500/20 transition-all z-10">
              {isProcessing ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        </button>
      </div>

      {/* CHART BOX */}
      <div className="h-[280px] sm:h-[360px] shrink-0 glass-panel rounded-none md:rounded-xl p-0 bg-black relative border-x-0 border-t-0 md:border overflow-hidden">
         <div ref={chartContainerRef} className="w-full h-full" />
      </div>

      {/* ANALYSIS RESULTS */}
      <div className="flex flex-col gap-3 pb-4">
          {signal && (
              <div className="glass-panel rounded-none md:rounded-xl p-4 md:p-6 animate-fade-in border-x-0 border-t-0 md:border bg-black/10">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                      <div className="flex items-center gap-4">
                          <div className={`text-4xl font-black tracking-tighter ${signal.action === 'LONG' ? 'text-green-400' : signal.action === 'SHORT' ? 'text-red-400' : 'text-yellow-400'}`}>{signal.action}</div>
                          <div className="flex flex-col">
                              <div className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Signal Status</div>
                              <div className="flex items-center gap-2">
                                <div className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-bold text-white uppercase tracking-tighter">CONFIDENCE: {signal.confidence}%</div>
                                <div className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded text-[9px] font-bold text-orange-400 uppercase tracking-tighter">R:R {signal.riskRewardRatio}</div>
                              </div>
                          </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                          <Activity size={12} className={signal.marketSentiment === 'BULLISH' ? 'text-green-500' : 'text-red-500'} />
                          <span className="text-[10px] font-bold text-white uppercase tracking-wider">{signal.marketSentiment} SENTIMENT</span>
                      </div>
                  </div>

                  {/* EXECUTION LEVELS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                      <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl flex flex-col gap-1 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                          <span className="text-[9px] font-black text-orange-500/60 uppercase tracking-widest flex items-center gap-1.5"><Crosshair size={10}/> Entry Zone</span>
                          <span className="text-2xl font-mono font-bold text-white">{signal.entry}</span>
                      </div>
                      <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex flex-col gap-1 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                          <span className="text-[9px] font-black text-red-500/60 uppercase tracking-widest flex items-center gap-1.5"><ShieldAlert size={10}/> Stop Loss (SL)</span>
                          <span className="text-2xl font-mono font-bold text-red-400">{signal.stopLoss}</span>
                      </div>
                  </div>

                  {/* TAKE PROFIT LADDER */}
                  <div className="mb-8">
                      <div className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-3 flex items-center gap-1.5"><Target size={12}/> Profit Targets</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            { label: 'TP 1', val: signal.tp1, color: 'text-green-300' },
                            { label: 'TP 2', val: signal.tp2, color: 'text-green-400' },
                            { label: 'TP 3', val: signal.tp3, color: 'text-green-500' }
                          ].map((tp, idx) => (
                              <div key={idx} className="p-4 bg-green-500/5 border border-green-500/10 rounded-xl text-center flex flex-col gap-1 hover:border-green-500/30 transition-all">
                                  <div className="text-[8px] font-black text-gray-500 uppercase tracking-tighter">{tp.label}</div>
                                  <div className={`text-xl font-mono font-bold ${tp.color}`}>{tp.val}</div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Technical Analysis Dimensions */}
                  {signal.dimensions && (
                    <div className="flex flex-col gap-3 mb-8">
                      <div className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Key Metrics</div>
                      {[
                        { label: 'Price Action', val: signal.dimensions.priceAction, icon: <TrendingUp size={12}/> },
                        { label: 'Order Book', val: signal.dimensions.orderBook, icon: <AlignLeft size={12}/> },
                        { label: 'Derivatives', val: signal.dimensions.derivatives, icon: <Layers size={12}/> },
                        { label: 'Volatility', val: signal.dimensions.volatility, icon: <Activity size={12}/> },
                        { label: 'Liquidity', val: signal.dimensions.liquidity, icon: <Zap size={12}/> }
                      ].map((dim, i) => (
                        <div key={i} className="p-3 bg-white/5 border border-white/5 rounded-lg flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-[8px] font-black text-orange-400 uppercase tracking-wide min-w-[100px]">
                              {dim.icon} {dim.label}
                          </div>
                          <p className="text-[11px] text-gray-300 italic leading-relaxed">"{dim.val}"</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-4 bg-black/40 rounded-xl border border-white/10 mb-6">
                      <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-orange-500 uppercase tracking-widest"><Search size={14} /> Analysis Summary</div>
                      <p className="text-xs text-gray-300 italic leading-relaxed">"{signal.reasoning}"</p>
                  </div>

                  {/* SOURCES */}
                  {signal.sources && signal.sources.length > 0 && (
                      <div className="pt-4 border-t border-white/5">
                          <div className="text-[9px] text-gray-600 uppercase font-black tracking-widest mb-3 flex items-center gap-1.5"><Info size={10}/> References</div>
                          <div className="flex flex-wrap gap-x-5 gap-y-2">
                              {signal.sources.map((s, idx) => (
                                  <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors underline-offset-2 hover:underline">
                                      <ExternalLink size={10} /> {s.title}
                                  </a>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          )}
      </div>
    </div>
  );
};
