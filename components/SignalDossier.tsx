import React, { useState } from 'react';
import { 
  TrendingUp, TrendingDown, Target, ShieldAlert, Crosshair, 
  Copy, Check, Activity, AlignLeft, Layers, Zap, Info, ExternalLink, Sparkles 
} from 'lucide-react';
import { TradeSignal, CryptoData } from '../types';
import { SoundService } from '../services/soundService';

interface SignalDossierProps {
  signal: TradeSignal | null;
  coinData: CryptoData | null;
  isProcessing: boolean;
  onRefresh: () => void;
}

export const SignalDossier: React.FC<SignalDossierProps> = ({
  signal,
  coinData,
  isProcessing,
  onRefresh
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    SoundService.playClick();
    navigator.clipboard.writeText(text.replace('$', '').trim());
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!signal && !isProcessing) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#0d0f17] border-l border-white/[0.08]">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-orange-400 mb-3 animate-pulse">
          <Target size={32} />
        </div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
          Awaiting Trade Target
        </h3>
        <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
          Select any asset from the watchlist or search bar to generate institutional AI entry & exit coordinates.
        </p>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#0d0f17] border-l border-white/[0.08] gap-3">
        <div className="relative">
          <div className="w-14 h-14 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap size={20} className="text-orange-400 animate-pulse" />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">Synthesizing Signals...</h4>
          <p className="text-xs text-gray-500 font-mono mt-0.5">Calculating optimal entry, stop loss & TP ladder</p>
        </div>
      </div>
    );
  }

  if (!signal) return null;

  const isLong = signal.action === 'LONG';
  const isShort = signal.action === 'SHORT';

  return (
    <div className="h-full flex flex-col bg-[#0b0d13] border-l border-white/[0.08] overflow-y-auto custom-scrollbar">
      {/* Header Badge */}
      <div className="p-4 border-b border-white/[0.08] bg-white/[0.01]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            <Sparkles size={13} className="text-orange-400" />
            <span>AI Signal Matrix</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${
              signal.marketSentiment === 'BULLISH' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : signal.marketSentiment === 'BEARISH'
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              {signal.marketSentiment}
            </span>
          </div>
        </div>

        {/* Action Hero Box */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
          isLong 
            ? 'bg-emerald-500/[0.08] border-emerald-500/30 text-emerald-400' 
            : isShort
            ? 'bg-rose-500/[0.08] border-rose-500/30 text-rose-400'
            : 'bg-amber-500/[0.08] border-amber-500/30 text-amber-400'
        }`}>
          <div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-0.5">
              Recommended Action
            </div>
            <div className="text-2xl font-black tracking-tight flex items-center gap-2">
              {coinData?.image ? (
                <img 
                  src={coinData.image} 
                  alt={coinData.name} 
                  className="w-7 h-7 rounded-full object-contain p-0.5 bg-black/40 border border-white/20 shrink-0" 
                  onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                />
              ) : (
                isLong ? <TrendingUp size={24} /> : isShort ? <TrendingDown size={24} /> : <Activity size={24} />
              )}
              <span>{signal.action} {coinData ? coinData.symbol.toUpperCase() : ''}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase text-gray-400 mb-0.5">Confidence</div>
            <div className="text-xl font-mono font-bold text-white">{signal.confidence}%</div>
          </div>
        </div>

        {/* Confidence Meter */}
        <div className="mt-3">
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-700 ${isLong ? 'bg-emerald-400' : isShort ? 'bg-rose-400' : 'bg-amber-400'}`}
              style={{ width: `${Math.min(100, Math.max(10, signal.confidence))}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 mt-1.5">
            <span>Risk-Reward: <strong className="text-white">{signal.riskRewardRatio}</strong></span>
            <span>Target Probability: <strong className="text-emerald-400">High</strong></span>
          </div>
        </div>
      </div>

      {/* Target Levels Grid */}
      <div className="p-4 space-y-3 border-b border-white/[0.08]">
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          Execution Coordinates
        </div>

        {/* Entry Zone */}
        <div className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] flex items-center justify-between transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Crosshair size={14} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Entry Zone</div>
              <div className="text-base font-mono font-bold text-white">{signal.entry}</div>
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(signal.entry, 'entry')}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Copy Entry Price"
          >
            {copiedKey === 'entry' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>

        {/* Stop Loss */}
        <div className="p-3 rounded-xl bg-rose-500/[0.04] hover:bg-rose-500/[0.07] border border-rose-500/20 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert size={14} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-rose-400/80 uppercase tracking-tight">Stop Loss (SL)</div>
              <div className="text-base font-mono font-bold text-rose-300">{signal.stopLoss}</div>
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(signal.stopLoss, 'sl')}
            className="p-1.5 text-gray-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
            title="Copy Stop Loss Price"
          >
            {copiedKey === 'sl' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>

        {/* Take Profit Ladder */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <Target size={12} className="text-emerald-400" />
            <span>Take Profit Ladder</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'TP 1 (Safe)', val: signal.tp1, key: 'tp1', badge: '1x' },
              { label: 'TP 2 (Target)', val: signal.tp2, key: 'tp2', badge: '2x' },
              { label: 'TP 3 (Runner)', val: signal.tp3, key: 'tp3', badge: '3x' }
            ].map((tp) => (
              <div 
                key={tp.key}
                onClick={() => copyToClipboard(tp.val, tp.key)}
                className="p-2.5 rounded-xl bg-emerald-500/[0.03] hover:bg-emerald-500/[0.08] border border-emerald-500/15 hover:border-emerald-500/30 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-[9px] font-bold text-gray-400 uppercase">
                  <span>{tp.badge}</span>
                  {copiedKey === tp.key ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} className="text-gray-600 hover:text-white" />}
                </div>
                <div className="text-xs font-mono font-bold text-emerald-400 mt-1 truncate">
                  {tp.val}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5-Dimensional Key Metrics */}
      {signal.dimensions && (
        <div className="p-4 space-y-2.5 border-b border-white/[0.08]">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Technical Dimensions
          </div>

          {[
            { label: 'Price Action', val: signal.dimensions.priceAction, icon: <TrendingUp size={12} className="text-orange-400" /> },
            { label: 'Order Book', val: signal.dimensions.orderBook, icon: <AlignLeft size={12} className="text-blue-400" /> },
            { label: 'Derivatives & OI', val: signal.dimensions.derivatives, icon: <Layers size={12} className="text-purple-400" /> },
            { label: 'Volatility & ATR', val: signal.dimensions.volatility, icon: <Activity size={12} className="text-emerald-400" /> },
            { label: 'Liquidity Pools', val: signal.dimensions.liquidity, icon: <Zap size={12} className="text-cyan-400" /> }
          ].map((dim, idx) => (
            <div key={idx} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase mb-1">
                {dim.icon}
                <span>{dim.label}</span>
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
                {dim.val}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Rationale & Grounding */}
      <div className="p-4 space-y-3">
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
          <span>AI Synthesis Summary</span>
          <span className="text-[10px] text-orange-400 font-mono">@MarketNews_Feed</span>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-gray-300 leading-relaxed italic">
          "{signal.reasoning}"
        </div>

        {/* References */}
        {signal.sources && signal.sources.length > 0 && (
          <div className="pt-2">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Info size={11} /> Grounded Sources
            </div>
            <div className="flex flex-wrap gap-1.5">
              {signal.sources.map((src, i) => (
                <a
                  key={i}
                  href={src.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-orange-500/10 border border-white/[0.06] hover:border-orange-500/30 text-[10px] text-gray-300 hover:text-orange-300 transition-colors"
                >
                  <ExternalLink size={9} />
                  <span className="truncate max-w-[180px]">{src.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
