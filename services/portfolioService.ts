
import { Portfolio, PortfolioPosition, TradeExecution } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'cek_rego_portfolio_v1_futures';
const INITIAL_CASH = 10000;
const MAKER_FEE = 0.0004; // 0.04%
const TAKER_FEE = 0.0006; // 0.06% - Futures are generally cheaper than Spot but applied on leverage

export const PortfolioService = {
  load: (): Portfolio => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load portfolio", e);
    }
    // Fixed: Added missing exchangeMode property
    return {
      cash: INITIAL_CASH,
      positions: [],
      initialBalance: INITIAL_CASH,
      tradeHistory: [],
      exchangeMode: 'SIMULATED'
    };
  },

  save: (portfolio: Portfolio) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
    } catch (e) {
      console.error("Failed to save portfolio", e);
    }
  },

  reset: (): Portfolio => {
    // Fixed: Added missing exchangeMode property and used explicit Portfolio type
    const fresh: Portfolio = {
      cash: INITIAL_CASH,
      positions: [],
      initialBalance: INITIAL_CASH,
      tradeHistory: [],
      exchangeMode: 'SIMULATED'
    };
    PortfolioService.save(fresh);
    return fresh;
  },

  openPosition: (
    portfolio: Portfolio, 
    coinId: string, 
    symbol: string, 
    entryPrice: number, 
    marginAmount: number, 
    leverage: number, 
    side: 'LONG' | 'SHORT'
  ): { portfolio: Portfolio, error?: string } => {
    
    // 1. Check Balance
    if (portfolio.cash < marginAmount) {
        return { portfolio, error: `INSUFFICIENT_MARGIN. REQUIRED: $${marginAmount.toFixed(2)} | AVAILABLE: $${portfolio.cash.toFixed(2)}` };
    }

    // 2. Calculate Position Size and Fees
    // Note: Fee is taken from remaining cash, not margin, usually. Here we deduct from cash.
    const positionValueUSD = marginAmount * leverage;
    const positionSizeCoin = positionValueUSD / entryPrice;
    const estimatedFee = positionValueUSD * TAKER_FEE;
    
    if ((portfolio.cash - marginAmount) < estimatedFee) {
         return { portfolio, error: `INSUFFICIENT_FUNDS_FOR_FEES. FEE: $${estimatedFee.toFixed(2)}` };
    }

    const newCash = portfolio.cash - marginAmount - estimatedFee;

    // 3. Calculate Liquidation Price (Simplified)
    // Long Liq = Entry * (1 - 1/Leverage + MaintenanceMarginRatio) -- Simplified to 1/Lev
    // Short Liq = Entry * (1 + 1/Leverage - MaintenanceMarginRatio)
    const maintenanceMargin = 0.005; // 0.5%
    let liquidationPrice = 0;
    
    if (side === 'LONG') {
        liquidationPrice = entryPrice * (1 - (1 / leverage) + maintenanceMargin);
    } else {
        liquidationPrice = entryPrice * (1 + (1 / leverage) - maintenanceMargin);
    }

    const newPosition: PortfolioPosition = {
        id: uuidv4(),
        coinId,
        symbol: symbol.toUpperCase(),
        side,
        entryPrice,
        amount: positionSizeCoin,
        leverage,
        margin: marginAmount,
        liquidationPrice
    };

    const tradeRecord: TradeExecution = {
      id: uuidv4(),
      type: side,
      price: entryPrice,
      date: Date.now(),
      leverage,
      margin: marginAmount,
      balanceAfter: newCash
    };

    const newPortfolio = {
      ...portfolio,
      cash: newCash,
      positions: [...portfolio.positions, newPosition],
      tradeHistory: [...portfolio.tradeHistory, tradeRecord]
    };

    PortfolioService.save(newPortfolio);
    return { portfolio: newPortfolio };
  },

  closePosition: (
    portfolio: Portfolio, 
    positionId: string, 
    exitPrice: number
  ): { portfolio: Portfolio, error?: string, profit?: number } => {
    
    const posIndex = portfolio.positions.findIndex(p => p.id === positionId);
    if (posIndex === -1) return { portfolio, error: 'POSITION_NOT_FOUND' };

    const pos = portfolio.positions[posIndex];
    
    // 1. Calculate PnL
    // Long PnL = (Exit - Entry) * Size
    // Short PnL = (Entry - Exit) * Size
    let rawPnL = 0;
    if (pos.side === 'LONG') {
        rawPnL = (exitPrice - pos.entryPrice) * pos.amount;
    } else {
        rawPnL = (pos.entryPrice - exitPrice) * pos.amount;
    }

    // 2. Fees
    const exitValueUSD = pos.amount * exitPrice;
    const exitFee = exitValueUSD * TAKER_FEE;
    
    const netPnL = rawPnL - exitFee;
    const returnedCash = pos.margin + netPnL;

    // 3. Update Portfolio
    // If returnedCash is negative, user lost more than margin (Liquidation logic, but simplified here to just losing margin max)
    const finalCashReturn = returnedCash > 0 ? returnedCash : 0;
    
    const newCash = portfolio.cash + finalCashReturn;
    const newPositions = [...portfolio.positions];
    newPositions.splice(posIndex, 1);

    const tradeRecord: TradeExecution = {
        id: uuidv4(),
        type: pos.side === 'LONG' ? 'CLOSE_LONG' : 'CLOSE_SHORT',
        price: exitPrice,
        date: Date.now(),
        leverage: pos.leverage,
        margin: pos.margin,
        pnl: netPnL,
        pnlPercent: (netPnL / pos.margin) * 100,
        balanceAfter: newCash
    };

    const newPortfolio = {
        ...portfolio,
        cash: newCash,
        positions: newPositions,
        tradeHistory: [...portfolio.tradeHistory, tradeRecord]
    };

    PortfolioService.save(newPortfolio);
    return { portfolio: newPortfolio, profit: netPnL };
  }
};
