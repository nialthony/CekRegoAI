
import { ReactNode } from 'react';

export type TradingStyle = 'SCALPING' | 'DAY_TRADING' | 'SWING_TRADING';
export type StrategyMode = 'MAX_GAIN' | 'MAX_WIN_RATE';

export interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h: number;
  high_24h: number;
  low_24h: number;
  image?: string;
}

export interface ChartPoint {
  date: number;
  price: number;
}

// Added missing MarketChartData for CoinGecko responses
export interface MarketChartData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export interface TerminalLog {
  id: string;
  type: 'command' | 'response' | 'error' | 'system' | 'analysis' | 'vision';
  content: string | ReactNode;
  timestamp: Date;
}

export interface RiskConfig {
  riskProfile: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  tradingStyle: TradingStyle;
  strategyMode: StrategyMode;
}

export interface TradeSignal {
  action: 'LONG' | 'SHORT' | 'WAIT';
  entry: string;
  stopLoss: string;
  tp1: string;
  tp2: string;
  tp3: string;
  riskRewardRatio: string;
  confidence: number;
  reasoning: string;
  marketSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  socialSentiment: string;
  dimensions?: {
    priceAction: string;
    orderBook: string;
    derivatives: string;
    volatility: string;
    liquidity: string;
  };
  sources?: { title: string; uri: string }[];
}

export interface MarketOpportunity {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  type: string;
  reason: string;
  score: number;
  image?: string;
}

export interface ScannerResult {
  opportunities: MarketOpportunity[];
  marketOverview: string;
  timestamp: number;
  sources?: { title: string; uri: string }[];
}

// Added missing PivotPoints for technical indicators
export interface PivotPoints {
  p: number;
  r1: number;
  r2: number;
  s1: number;
  s2: number;
}

// Added missing TradeExecution for backtesting and portfolio history
export interface TradeExecution {
  id: string;
  type: 'LONG' | 'SHORT' | 'CLOSE_LONG' | 'CLOSE_SHORT';
  price: number;
  date: number;
  leverage: number;
  margin: number;
  balanceAfter: number;
  pnl?: number;
  pnlPercent?: number;
}

// Added missing BacktestResult for strategy analysis
export interface BacktestResult {
  strategyName: string;
  totalTrades: number;
  profitableTrades: number;
  winRate: number;
  netProfit: number;
  roi: number;
  maxDrawdown: number;
  trades: TradeExecution[];
  equityCurve: { date: number, balance: number }[];
}

// Added missing PortfolioPosition for active trades tracking
export interface PortfolioPosition {
  id: string;
  coinId: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  amount: number;
  leverage: number;
  margin: number;
  liquidationPrice: number;
}

// Added missing Portfolio structure
export interface Portfolio {
  cash: number;
  positions: PortfolioPosition[];
  initialBalance: number;
  tradeHistory: TradeExecution[];
  exchangeMode: string;
}

// Added missing ExchangeType for CEX integration
export type ExchangeType = 'SIMULATED' | 'BINANCE' | 'OKX' | 'GATE_IO';

// Added missing ExchangeSettings for API configuration
export interface ExchangeSettings {
  activeExchange: ExchangeType;
  apiKey: string;
  apiSecret: string;
  isTestnet: boolean;
  passphrase?: string;
}
