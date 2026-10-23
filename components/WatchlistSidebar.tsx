import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Image, Upload, Search, Activity, Sparkles, Shield, Compass } from 'lucide-react';
import { CryptoData } from '../types';
import { getMarketOpportunitiesData, getFearAndGreedIndex } from '../services/coingeckoService';
import { SoundService } from '../services/soundService';

interface WatchlistSidebarProps {
  activeCoinId: string | null;
  onSelectCoin: (coinId: string, coinName: string, symbol?: string) => void;
  onOpenSearch: () => void;
  onOpenScanner: () => void;
  onImageUpload: (file: File) => void;
  isProcessing: boolean;
}

export const WatchlistSidebar: React.FC<WatchlistSidebarProps> = ({
  activeCoinId,
  onSelectCoin,
  onOpenSearch,
  onOpenScanner,
  onImageUpload,
  isProcessing
}) => {
  const [watchlist, setWatchlist] = useState<CryptoData[]>([]);
  const [fearAndGreed, setFearAndGreed] = useState<{ value: string; value_classification: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchWatchlist = async () => {
      try {
        const [marketData, fng] = await Promise.all([
          getMarketOpportunitiesData(),
          getFearAndGreedIndex()
        ]);
        if (isMounted) {
          if (marketData && marketData.length > 0) {
            setWatchlist(marketData.slice(0, 10));
          }
          if (fng) {
            setFearAndGreed(fng);
          }
        }
      } catch (err) {
        console.warn("Watchlist fetch error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchWatchlist();
    return () => { isMounted = false; };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      SoundService.playClick();
      onImageUpload(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <aside className="w-full lg:w-72 xl:w-80 h-full flex flex-col bg-[#0b0d13] border-r border-white/[0.08] select-none shrink-0 overflow-hidden">
      {/* Search Trigger Button */}
      <div className="p-3 border-b border-white/[0.08]">
        <button
          onClick={() => {
            SoundService.playClick();
            onOpenSearch();
          }}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-gray-400 hover:text-white transition-all text-xs group"
        >
          <div className="flex items-center gap-2">
            <Search size={14} className="text-orange-400" />
            <span className="font-medium">Search any market...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-gray-500 bg-black/40 border border-white/10 rounded group-hover:border-white/20">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Market Sentiment Badge */}
      {fearAndGreed && (
        <div className="px-3 py-2.5 mx-3 mt-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass size={14} className="text-orange-400" />
            <span className="text-[11px] font-semibold text-gray-300">Fear & Greed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-mono font-bold ${
              Number(fearAndGreed.value) >= 60 ? 'text-emerald-400' :
              Number(fearAndGreed.value) <= 40 ? 'text-red-400' : 'text-amber-400'
            }`}>
              {fearAndGreed.value}
            </span>
            <span className="text-[10px] text-gray-500 uppercase font-mono">
              ({fearAndGreed.value_classification})
            </span>
          </div>
        </div>
      )}

      {/* Quick Action Pills */}
      <div className="px-3 pt-3 pb-2 grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            SoundService.playClick();
            onOpenScanner();
          }}
          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 text-xs font-semibold transition-all"
        >
          <Sparkles size={13} />
          <span>Scanner</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-gray-300 hover:text-white text-xs font-semibold transition-all"
        >
          <Image size={13} className="text-purple-400" />
          <span>Vision AI</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Watchlist Header */}
      <div className="px-4 py-2 flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
        <span>Active Watchlist</span>
        <span className="text-[10px] font-mono text-gray-600">24H VOL</span>
      </div>

      {/* Asset List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
        {isLoading ? (
          <div className="p-6 text-center text-xs text-gray-500 font-mono flex flex-col items-center gap-2">
            <Activity size={18} className="animate-spin text-orange-400" />
            <span>Loading telemetry...</span>
          </div>
        ) : watchlist.length > 0 ? (
          watchlist.map((coin) => {
            const isActive = activeCoinId === coin.id;
            const change = coin.price_change_percentage_24h || 0;
            const isPositive = change >= 0;

            return (
              <button
                key={coin.id}
                onClick={() => {
                  SoundService.playClick();
                  onSelectCoin(coin.id, coin.name, coin.symbol);
                }}
                disabled={isProcessing}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${
                  isActive
                    ? 'bg-orange-500/10 border-orange-500/40 text-white shadow-sm'
                    : 'bg-transparent hover:bg-white/[0.04] border-transparent hover:border-white/[0.06] text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {coin.image ? (
                    <img 
                      src={coin.image} 
                      alt={coin.name} 
                      className="w-7 h-7 rounded-full object-contain shrink-0 bg-white/5 p-0.5 border border-white/10" 
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono shrink-0 ${
                      isActive 
                        ? 'bg-orange-500 text-black' 
                        : 'bg-white/5 border border-white/10 text-orange-400'
                    }`}>
                      {coin.symbol.slice(0, 3).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                      <span>{coin.name}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />}
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono">
                      {coin.symbol.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-mono font-bold text-white">
                    ${coin.current_price >= 1 ? coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : coin.current_price.toFixed(4)}
                  </div>
                  <div className={`text-[10px] font-mono font-medium flex items-center justify-end gap-0.5 ${
                    isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    <span>{isPositive ? '+' : ''}{change.toFixed(2)}%</span>
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="p-4 text-center text-xs text-gray-500">
            No watchlist assets available.
          </div>
        )}
      </div>

      {/* Footer System Status */}
      <div className="p-3 border-t border-white/[0.08] bg-black/30 flex items-center justify-between text-[10px] text-gray-500 font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Engine v4.0 Active</span>
        </div>
        <span>@MarketNews_Feed</span>
      </div>
    </aside>
  );
};
