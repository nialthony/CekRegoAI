
import React from 'react';
import { ScannerResult } from '../types';
import { Sparkles, Zap, Clock, X, ChevronRight, BarChart3, ExternalLink, RefreshCcw } from 'lucide-react';
import { SoundService } from '../services/soundService';

interface MarketScannerProps {
  result: ScannerResult | null;
  onClose: () => void;
  onRefresh: () => void;
  onSelectCoin: (coinId: string, coinName: string, coinSymbol: string) => void;
  isScanning: boolean;
}

export const MarketScanner: React.FC<MarketScannerProps> = ({ result, onClose, onRefresh, onSelectCoin, isScanning }) => {
  return (
    <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 animate-fade-in">
      <div className="w-full max-w-5xl h-full max-h-[800px] glass-panel rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-orange-500/30">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-orange-500/5">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-orange-500/20 rounded-xl text-orange-500">
                <Sparkles size={24} />
             </div>
             <div>
                <h2 className="text-xl font-bold text-white tracking-tight uppercase">Opportunity Scanner</h2>
                <p className="text-xs text-gray-500 font-mono">Real-time Breakout & Volatility Search</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { SoundService.playClick(); onRefresh(); }}
              disabled={isScanning}
              className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-orange-500 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
              title="Refresh Global Scan"
            >
              <RefreshCcw size={18} className={isScanning ? 'animate-spin' : ''} />
              {result ? 'Refresh' : ''}
            </button>
            <button 
              onClick={() => { SoundService.playClick(); onClose(); }}
              className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-black/20">
          {isScanning && !result ? (
             <div className="h-full flex flex-col items-center justify-center text-center gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Zap size={24} className="text-orange-500 animate-pulse" />
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Scanning Markets...</h3>
                    <p className="text-sm text-gray-500 font-mono mt-1">Collecting price and volume data</p>
                </div>
             </div>
          ) : result ? (
             <div className="space-y-8">
                {/* Market Overview */}
                <div className="p-4 bg-orange-500/5 rounded-xl border border-orange-500/20 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-2 opacity-10"><BarChart3 size={40} /></div>
                   <div className="flex items-center gap-2 mb-2 text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">
                      <BarChart3 size={12} /> Market Summary
                   </div>
                   <p className="text-sm text-gray-200 italic leading-relaxed font-medium">"{result.marketOverview}"</p>
                   
                   {/* Grounded Sources */}
                   {result.sources && result.sources.length > 0 && (
                       <div className="mt-4 pt-4 border-t border-white/5">
                           <div className="text-[10px] text-gray-500 uppercase font-bold mb-2 flex items-center gap-2">
                               <ExternalLink size={10} /> Reference Data
                           </div>
                           <div className="flex flex-wrap gap-x-4 gap-y-1">
                               {result.sources.map((source, idx) => (
                                   <a 
                                       key={idx} 
                                       href={source.uri} 
                                       target="_blank" 
                                       rel="noopener noreferrer" 
                                       className="text-[10px] text-orange-400/80 hover:text-orange-400 hover:underline flex items-center gap-1 transition-all"
                                   >
                                       {source.title}
                                   </a>
                               ))}
                           </div>
                       </div>
                   )}
                </div>

                {/* Opportunity Grid */}
                <div>
                   <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <Zap size={12} className="text-orange-500" /> Top Signals
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {result.opportunities.map((opp) => {
                         const changeNum = Number(opp.change24h) || 0;
                         const isPositive = changeNum >= 0;
                         
                         return (
                           <button 
                             key={opp.id} 
                             onClick={() => { 
                                SoundService.playClick(); 
                                onSelectCoin(opp.id, opp.name, opp.symbol); 
                             }}
                             className="group text-left relative p-5 bg-white/5 hover:bg-orange-500/10 border border-white/5 hover:border-orange-500/40 rounded-2xl cursor-pointer transition-all duration-300 flex flex-col h-full"
                           >
                              <div className="flex justify-between items-start mb-4">
                                 <div className="flex items-center gap-3">
                                    {opp.image ? (
                                       <img 
                                         src={opp.image} 
                                         alt={opp.name} 
                                         className="w-10 h-10 rounded-xl object-contain bg-black/40 border border-white/10 p-1 shrink-0" 
                                         onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                                       />
                                    ) : (
                                       <div className="w-10 h-10 bg-black/40 border border-white/10 rounded-lg flex items-center justify-center font-bold text-orange-400 text-lg group-hover:bg-orange-500 group-hover:text-black transition-all shrink-0">
                                          {opp.symbol ? opp.symbol[0].toUpperCase() : '?'}
                                       </div>
                                    )}
                                    <div>
                                       <div className="font-bold text-white group-hover:text-orange-400 transition-colors truncate max-w-[120px]">{opp.name}</div>
                                       <div className="text-[9px] text-gray-500 uppercase font-mono tracking-tighter">
                                           {opp.symbol} • ${typeof opp.price === 'number' ? opp.price.toLocaleString() : opp.price}
                                       </div>
                                    </div>
                                 </div>
                                 <div className="flex flex-col items-end">
                                    <div className={`text-xs font-bold font-mono ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                       {isPositive ? '+' : ''}{changeNum.toFixed(2)}%
                                    </div>
                                    <div className="text-[8px] px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-gray-400 mt-1 uppercase font-black tracking-tighter">{opp.type}</div>
                                 </div>
                              </div>
                              
                              <p className="text-[11px] text-gray-400 leading-relaxed mb-4 line-clamp-3 italic">
                                 "{opp.reason}"
                              </p>

                              <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                 <div className="flex flex-col">
                                    <span className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Strength Score</span>
                                    <div className="flex items-center gap-2">
                                       <div className="h-1 w-16 bg-white/5 rounded-full overflow-hidden">
                                          <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${opp.score || 0}%` }}></div>
                                       </div>
                                       <span className="text-[10px] font-bold text-white">{opp.score || 0}%</span>
                                    </div>
                                 </div>
                                 <div className="p-1.5 bg-orange-500/10 rounded-lg text-orange-500 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all">
                                    <ChevronRight size={14} />
                                 </div>
                              </div>
                           </button>
                         );
                      })}
                   </div>
                </div>

                <div className="flex items-center justify-center gap-4 text-[10px] text-gray-700 font-mono uppercase border-t border-white/5 pt-4">
                   <span className="flex items-center gap-1"><Clock size={10} /> Last Updated: {new Date(result.timestamp).toLocaleTimeString()}</span>
                   <span>•</span>
                   <span>Analysis Engine Live</span>
                </div>
             </div>
          ) : (
             <div className="h-full flex flex-col items-center justify-center text-center p-10 gap-4">
                <div className="p-5 bg-white/5 rounded-full"><Sparkles size={48} className="text-gray-700" /></div>
                <div>
                   <h3 className="text-lg font-bold text-white uppercase tracking-widest">No Active Data</h3>
                   <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">Refresh to scan for market opportunities.</p>
                </div>
                <button 
                  onClick={() => { SoundService.playClick(); onRefresh(); }}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs uppercase tracking-[0.2em] rounded-lg transition-all shadow-lg shadow-orange-900/40"
                >
                  Start Scan
                </button>
             </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-black/60 border-t border-white/10 flex justify-center">
            <p className="text-[9px] text-gray-700 text-center uppercase tracking-[0.3em] font-mono">Select an asset to view matches and start analysis</p>
        </div>
      </div>
    </div>
  );
};
