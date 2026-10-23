import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
  BarChart2, Sparkles, Shield, Cpu, Activity, Search, 
  Image, Compass, Sliders, ChevronDown 
} from 'lucide-react';
import { WatchlistSidebar } from './components/WatchlistSidebar';
import { ProChartPanel } from './components/ProChartPanel';
import { SignalDossier } from './components/SignalDossier';
import { ActivityDrawer } from './components/ActivityDrawer';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { MarketScanner } from './components/MarketScanner';
import { OnboardingTutorial } from './components/OnboardingTutorial';

import { 
  getCoinData, getFearAndGreedIndex, getMarketChart, 
  getMarketOpportunitiesData, getOpenInterest 
} from './services/coingeckoService';
import { 
  analyzeMarket, findMarketOpportunities, analyzeChartVision, 
  analyzeMarketFallback 
} from './services/geminiService';
import { SoundService } from './services/soundService';
import { ChartPoint, CryptoData, RiskConfig, ScannerResult, TerminalLog, TradeSignal } from './types';

const generateId = () => Math.random().toString(36).substring(2, 9);
const STORAGE_RISK_CONFIG = 'cek_rego_risk_config';

const INITIAL_LOGS: TerminalLog[] = [
  {
    id: 'init-1',
    type: 'system',
    content: 'Pro Trading Workstation v4.0 Initialized. Telemetry engine ready.',
    timestamp: new Date()
  }
];

export default function App() {
  const [logs, setLogs] = useState<TerminalLog[]>(INITIAL_LOGS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeCoin, setActiveCoin] = useState<CryptoData | null>(null);
  const [openInterest, setOpenInterest] = useState<number>(0);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [tradeSignal, setTradeSignal] = useState<TradeSignal | null>(null);
  const [selectedDays, setSelectedDays] = useState<number>(1);
  
  // Modals & Panels state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scannerResult, setScannerResult] = useState<ScannerResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chart' | 'signal' | 'watchlist'>('chart');

  // Risk configuration
  const [riskConfig, setRiskConfig] = useState<RiskConfig>(() => {
    const saved = localStorage.getItem(STORAGE_RISK_CONFIG);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { 
      riskProfile: 'MODERATE', 
      tradingStyle: 'SCALPING',
      strategyMode: 'MAX_GAIN'
    };
  });

  const activeCoinIdRef = useRef<string | null>(null);

  // Initialize sounds and check onboarding
  useEffect(() => {
    SoundService.init();
    SoundService.playBoot();
    const onboardingComplete = localStorage.getItem('cek_rego_onboarding_complete');
    if (!onboardingComplete) {
      setShowOnboarding(true);
    }

    // Default load Bitcoin on startup
    performAnalysis('bitcoin', 'Bitcoin', 1);

    // Global keyboard shortcut for Cmd+K / Ctrl+K
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Persist risk config
  useEffect(() => {
    localStorage.setItem(STORAGE_RISK_CONFIG, JSON.stringify(riskConfig));
  }, [riskConfig]);

  const addLog = useCallback((type: TerminalLog['type'], content: React.ReactNode | string) => {
    setLogs(prev => [...prev, {
      id: generateId(),
      type,
      content,
      timestamp: new Date()
    }]);
  }, []);

  const updateTradingStyle = (style: any) => {
    const newConfig = { ...riskConfig, tradingStyle: style };
    setRiskConfig(newConfig);
    SoundService.playClick();
    addLog('system', `Timeframe switched to ${style}. Next analysis will target ${style.toLowerCase()} parameters.`);
    if (activeCoin) {
      performAnalysis(activeCoin.id, activeCoin.name, selectedDays);
    }
  };

  const updateStrategyMode = (mode: any) => {
    const newConfig = { ...riskConfig, strategyMode: mode };
    setRiskConfig(newConfig);
    SoundService.playClick();
    addLog('system', `Strategy mode calibrated to ${mode.replace('_', ' ')}.`);
    if (activeCoin) {
      performAnalysis(activeCoin.id, activeCoin.name, selectedDays);
    }
  };

  const performAnalysis = async (coinId: string, coinName: string, days = selectedDays) => {
    if (isProcessing) return;
    setIsProcessing(true);
    activeCoinIdRef.current = coinId;
    addLog('system', `Synthesizing ${riskConfig.tradingStyle.toLowerCase()} analysis for ${coinName} [Mode: ${riskConfig.strategyMode}]...`);
    
    try {
      const coinDetails = await getCoinData(coinId);
      
      if (!coinDetails) {
        addLog('system', `Coingecko index unavailable for ${coinName}. Running search synthesis...`);
        const fallbackSignal = await analyzeMarketFallback(coinName, riskConfig);
        setTradeSignal(fallbackSignal);
        setActiveCoin({
          id: coinId,
          name: coinName,
          symbol: coinName.substring(0, 4),
          current_price: 100,
          market_cap: 1000000000,
          total_volume: 50000000,
          price_change_percentage_24h: 1.5,
          high_24h: 105,
          low_24h: 96
        });
        setChartData([]);
        SoundService.playSuccess();
        return;
      }

      const [marketChart, btcData] = await Promise.all([
        getMarketChart(coinId, days),
        getMarketChart('bitcoin', 1)
      ]);

      let oi = 0;
      let fng = null;
      try {
        [oi, fng] = await Promise.all([getOpenInterest(coinId), getFearAndGreedIndex()]);
      } catch(suppError) {}

      const chartPrices = marketChart.prices.map(p => ({ date: p[0], price: p[1] }));
      setActiveCoin(coinDetails);
      setOpenInterest(oi);
      setChartData(chartPrices);

      const globalData = await getMarketChart(coinId, 14);
      const globalPrices = globalData.prices.map(p => ({ date: p[0], price: p[1] }));
      
      const signal = await analyzeMarket(
        coinDetails, 
        chartPrices, 
        btcData.prices.map(p => ({ date: p[0], price: p[1] })), 
        globalPrices, 
        riskConfig, 
        fng
      );
      
      setTradeSignal(signal);
      addLog('analysis', `Signal synthesized for ${coinName}: ${signal.action} (Confidence: ${signal.confidence}%, R:R: ${signal.riskRewardRatio})`);
      SoundService.playSuccess();
    } catch (e: any) {
      addLog('error', `Analysis warning: ${e.message}`);
      SoundService.playError();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDaysChange = (days: number) => {
    setSelectedDays(days);
    if (activeCoin) {
      performAnalysis(activeCoin.id, activeCoin.name, days);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (isProcessing) return;
    setIsProcessing(true);
    addLog('vision', `Analyzing chart screenshot: ${file.name}...`);
    
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      
      const base64Image = await base64Promise;
      const analysis = await analyzeChartVision(base64Image);
      
      addLog('vision', (
        <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed py-2 text-gray-200">
          {analysis}
        </div>
      ));
      SoundService.playSuccess();
    } catch (error: any) {
      addLog('error', `Vision Analysis notice: ${error.message}`);
      SoundService.playError();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScanRequest = async (force = false) => {
    setIsScannerOpen(true);
    if (scannerResult && !force && !isScanning) return;
    
    setIsScanning(true);
    try {
      const data = await getMarketOpportunitiesData();
      const scanRes = await findMarketOpportunities(data);
      setScannerResult(scanRes);
    } catch(e: any) {
      addLog('error', `Scanner note: ${e.message}`);
      if (!scannerResult) setIsScannerOpen(false);
    } finally {
      setIsScanning(false);
    }
  };

  const handleCommand = async (cmdString: string) => {
    addLog('command', cmdString);
    const trimmed = cmdString.trim().toLowerCase();
    const [cmd, ...args] = trimmed.split(' ');

    switch (cmd) {
      case 'analyze':
        if (args.length === 0) {
          addLog('error', 'Symbol required. Example: analyze btc');
        } else {
          performAnalysis(args.join('-'), args.join(' ').toUpperCase());
        }
        break;
      case 'scan':
        handleScanRequest();
        break;
      case 'tutorial':
        setShowOnboarding(true);
        break;
      case 'clear':
        setLogs(INITIAL_LOGS);
        break;
      case 'help':
        addLog('response', 'AVAILABLE COMMANDS:\nanalyze [ticker] - Launch AI scan for coin\nscan - Open breakout opportunity scanner\ntutorial - Restart calibration tour\nclear - Reset telemetry stream');
        break;
      default:
        // Assume ticker search directly
        performAnalysis(trimmed, trimmed.toUpperCase());
    }
  };

  return (
    <div className="flex flex-col h-screen h-[100dvh] w-full bg-[#08090d] text-white overflow-hidden select-none">
      {/* Onboarding Tour */}
      {showOnboarding && (
        <OnboardingTutorial onComplete={() => setShowOnboarding(false)} />
      )}

      {/* Spotlight Command Palette (Cmd + K) */}
      <CommandPaletteModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectCoin={(id, name) => performAnalysis(id, name)}
        onOpenScanner={() => handleScanRequest()}
      />

      {/* Global Market Scanner Modal */}
      {isScannerOpen && (
        <MarketScanner 
          result={scannerResult} 
          isScanning={isScanning} 
          onClose={() => setIsScannerOpen(false)} 
          onRefresh={() => handleScanRequest(true)}
          onSelectCoin={(id, name) => { 
            setIsScannerOpen(false); 
            performAnalysis(id, name); 
          }} 
        />
      )}

      {/* TOP NAVIGATION BAR (Linear & Raycast Pro Aesthetic) */}
      <header className="h-14 border-b border-white/[0.08] px-4 flex items-center justify-between shrink-0 bg-[#090b10] z-30 gap-4">
        {/* Brand & Status */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-900/30">
            <Activity size={18} className="text-black stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-wider uppercase text-white font-sans">
                CEKREGO <span className="text-orange-400 font-mono">PRO</span>
              </h1>
              <span className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase">
                LIVE
              </span>
            </div>
            <div className="text-[10px] text-gray-500 font-mono hidden sm:block">
              Institutional AI Trading Workstation
            </div>
          </div>
        </div>

        {/* Central Search Spotlight Bar (Cmd+K) */}
        <div className="flex-1 max-w-md mx-auto hidden md:block">
          <button
            onClick={() => {
              SoundService.playClick();
              setIsSearchOpen(true);
            }}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] text-gray-400 hover:text-white transition-all text-xs group"
          >
            <div className="flex items-center gap-2">
              <Search size={14} className="text-orange-400" />
              <span className="text-gray-400 font-medium truncate">
                {activeCoin ? `Analyzing ${activeCoin.name} (${activeCoin.symbol.toUpperCase()}) — Search any coin...` : 'Search 10,000+ crypto pairs...'}
              </span>
            </div>
            <kbd className="px-2 py-0.5 text-[10px] font-mono text-gray-400 bg-white/5 border border-white/10 rounded group-hover:border-white/20">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Controls: Timeframe, Strategy & Scanner */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Timeframe Switcher */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.03] rounded-xl border border-white/[0.08]">
            <Shield size={12} className="text-orange-400" />
            <select 
              value={riskConfig.tradingStyle} 
              onChange={(e) => updateTradingStyle(e.target.value)} 
              className="bg-transparent text-[11px] font-mono font-bold text-gray-300 outline-none uppercase cursor-pointer"
            >
              <option value="SCALPING" className="bg-[#0b0d13] text-white">Scalp (1m-15m)</option>
              <option value="DAY_TRADING" className="bg-[#0b0d13] text-white">Day (15m-4h)</option>
              <option value="SWING_TRADING" className="bg-[#0b0d13] text-white">Swing (4h-1D)</option>
            </select>
          </div>

          {/* Strategy Mode Switcher */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.03] rounded-xl border border-white/[0.08]">
            <Cpu size={12} className="text-blue-400" />
            <select 
              value={riskConfig.strategyMode} 
              onChange={(e) => updateStrategyMode(e.target.value)} 
              className="bg-transparent text-[11px] font-mono font-bold text-gray-300 outline-none uppercase cursor-pointer"
            >
              <option value="MAX_GAIN" className="bg-[#0b0d13] text-white">Max Gain (High R:R)</option>
              <option value="MAX_WIN_RATE" className="bg-[#0b0d13] text-white">Win Rate (Safety)</option>
            </select>
          </div>

          {/* Scanner Button */}
          <button 
            onClick={() => handleScanRequest()} 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black text-xs font-bold font-sans transition-all shadow-md shadow-orange-900/30"
          >
            <Sparkles size={13} className="stroke-[2.5]" />
            <span className="hidden sm:inline">Scanner</span>
          </button>
        </div>
      </header>

      {/* MOBILE TAB BAR (Only on small screens) */}
      <div className="flex md:hidden border-b border-white/[0.08] bg-[#090b10] text-xs font-mono">
        <button
          onClick={() => setMobileTab('chart')}
          className={`flex-1 py-2.5 text-center font-bold border-b-2 transition-colors ${
            mobileTab === 'chart' ? 'border-orange-500 text-orange-400 bg-orange-500/5' : 'border-transparent text-gray-400'
          }`}
        >
          Chart
        </button>
        <button
          onClick={() => setMobileTab('signal')}
          className={`flex-1 py-2.5 text-center font-bold border-b-2 transition-colors ${
            mobileTab === 'signal' ? 'border-orange-500 text-orange-400 bg-orange-500/5' : 'border-transparent text-gray-400'
          }`}
        >
          AI Signal
        </button>
        <button
          onClick={() => setMobileTab('watchlist')}
          className={`flex-1 py-2.5 text-center font-bold border-b-2 transition-colors ${
            mobileTab === 'watchlist' ? 'border-orange-500 text-orange-400 bg-orange-500/5' : 'border-transparent text-gray-400'
          }`}
        >
          Watchlist
        </button>
      </div>

      {/* MAIN 3-COLUMN WORKSTATION LAYOUT */}
      <main className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Left Column: Watchlist & Radar */}
        <div className={`h-full ${mobileTab === 'watchlist' ? 'w-full' : 'hidden lg:block'}`}>
          <WatchlistSidebar
            activeCoinId={activeCoin?.id || null}
            onSelectCoin={(id, name) => performAnalysis(id, name)}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenScanner={() => handleScanRequest()}
            onImageUpload={handleImageUpload}
            isProcessing={isProcessing}
          />
        </div>

        {/* Center Column: The Hero Interactive Pro Chart */}
        <div className={`h-full flex-1 flex flex-col min-w-0 ${mobileTab === 'chart' ? 'flex' : 'hidden md:flex'}`}>
          <ProChartPanel
            coinData={activeCoin}
            chartData={chartData}
            openInterest={openInterest}
            signal={tradeSignal}
            isProcessing={isProcessing}
            selectedDays={selectedDays}
            onDaysChange={handleDaysChange}
            onReAnalyze={() => activeCoin && performAnalysis(activeCoin.id, activeCoin.name, selectedDays)}
          />
        </div>

        {/* Right Column: AI Signal Matrix & Intelligence Dossier */}
        <div className={`h-full w-full md:w-80 lg:w-96 xl:w-[420px] shrink-0 ${mobileTab === 'signal' ? 'block' : 'hidden md:block'}`}>
          <SignalDossier
            signal={tradeSignal}
            coinData={activeCoin}
            isProcessing={isProcessing}
            onRefresh={() => activeCoin && performAnalysis(activeCoin.id, activeCoin.name, selectedDays)}
          />
        </div>
      </main>

      {/* Bottom Modern Telemetry & Vision Drawer */}
      <ActivityDrawer
        logs={logs}
        isProcessing={isProcessing}
        onExecuteCommand={handleCommand}
        onImageUpload={handleImageUpload}
      />
    </div>
  );
}
