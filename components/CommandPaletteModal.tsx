import React, { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, Sparkles, ChevronRight, Activity, ArrowUpRight } from 'lucide-react';
import { searchCoins } from '../services/coingeckoService';
import { SoundService } from '../services/soundService';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCoin: (coinId: string, coinName: string, coinSymbol?: string) => void;
  onOpenScanner: () => void;
}

const POPULAR_ASSETS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', trend: '+2.4%', image: 'https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', trend: '+1.8%', image: 'https://coin-images.coingecko.com/coins/images/279/large/ethereum.png' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', trend: '+5.2%', image: 'https://coin-images.coingecko.com/coins/images/4128/large/solana.png' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', trend: '-0.6%', image: 'https://coin-images.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', trend: '+0.9%', image: 'https://coin-images.coingecko.com/coins/images/825/large/bnb-icon2_2x.png' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', trend: '+4.1%', image: 'https://coin-images.coingecko.com/coins/images/5/large/dogecoin.png' },
];

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectCoin,
  onOpenScanner
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; symbol: string; name: string; market_cap_rank: number | null }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Keyboard shortcut listener for ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const found = await searchCoins(query.trim());
        setResults(found);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-[#0e1017] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3 bg-white/[0.02]">
          <Search size={20} className="text-orange-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search coin name or symbol (e.g. BTC, Solana, PEPE)..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-base font-sans"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="text-gray-500 hover:text-white p-1"
            >
              <X size={16} />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-medium text-gray-400 bg-white/5 border border-white/10 rounded">
            ESC to close
          </kbd>
        </div>

        {/* Content Area */}
        <div className="max-h-[380px] overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {/* Quick Scanner Shortcut */}
          <div 
            onClick={() => {
              SoundService.playClick();
              onClose();
              onOpenScanner();
            }}
            className="flex items-center justify-between p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 hover:border-orange-500/40 cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500 text-black font-bold">
                <Sparkles size={16} />
              </div>
              <div>
                <div className="text-sm font-bold text-white group-hover:text-orange-300 transition-colors">
                  Run Global Market Scanner
                </div>
                <div className="text-xs text-gray-400">
                  Scan top 200 assets for volume breakouts and multi-signal scalps
                </div>
              </div>
            </div>
            <ArrowUpRight size={18} className="text-orange-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>

          {/* Search Results */}
          {query.trim() ? (
            <div>
              <div className="px-2 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                <span>Search Results</span>
                {isSearching && <span className="text-orange-400 flex items-center gap-1.5"><Activity size={12} className="animate-spin" /> Searching...</span>}
              </div>

              {results.length > 0 ? (
                <div className="space-y-1 mt-1">
                  {results.map((coin) => (
                    <button
                      key={coin.id}
                      onClick={() => {
                        SoundService.playClick();
                        onSelectCoin(coin.id, coin.name, coin.symbol);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3">
                        {coin.thumb || coin.large ? (
                          <img 
                            src={coin.thumb || coin.large} 
                            alt={coin.name} 
                            className="w-8 h-8 rounded-lg object-contain bg-white/5 border border-white/10 p-0.5 shrink-0" 
                            onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-orange-400 shrink-0">
                            {coin.symbol.slice(0, 3).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                            {coin.name}
                          </span>
                          <span className="ml-2 text-xs text-gray-500 font-mono uppercase">
                            {coin.symbol}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {coin.market_cap_rank && (
                          <span className="text-[10px] text-gray-500 font-mono px-2 py-0.5 rounded bg-white/5 border border-white/5">
                            RANK #{coin.market_cap_rank}
                          </span>
                        )}
                        <ChevronRight size={16} className="text-gray-600 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : !isSearching ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No assets found for "{query}". Try another ticker.
                </div>
              ) : null}
            </div>
          ) : (
            /* Popular Assets Preset */
            <div>
              <div className="px-2 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={12} className="text-orange-400" />
                <span>Popular Assets</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {POPULAR_ASSETS.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => {
                      SoundService.playClick();
                      onSelectCoin(asset.id, asset.name, asset.symbol);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-orange-500/30 transition-all text-left group"
                  >
                    <div className="flex items-center gap-2.5">
                      {asset.image ? (
                        <img 
                          src={asset.image} 
                          alt={asset.name} 
                          className="w-7 h-7 rounded-full object-contain shrink-0 bg-white/5 p-0.5 border border-white/10" 
                          onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-400 shrink-0">
                          {asset.symbol[0]}
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-orange-300 transition-colors">
                          {asset.symbol}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {asset.name}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-semibold">
                      {asset.trend}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-black/40 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500 font-mono">
          <span>Search 10,000+ crypto assets powered by CoinGecko & Gemini AI</span>
          <span>Press Enter to select</span>
        </div>
      </div>
    </div>
  );
};
