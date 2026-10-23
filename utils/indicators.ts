
import { ChartPoint, PivotPoints } from '../types';

export const calculateRSI = (data: ChartPoint[], period: number = 14): number[] => {
  if (data.length < period) return new Array(data.length).fill(null);
  
  const rsiArray = new Array(period).fill(null); // Padding
  let gains = 0;
  let losses = 0;

  // Initial calculate
  for (let i = 1; i <= period; i++) {
    const diff = data[i].price - data[i - 1].price;
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // First RSI
  let rs = avgGain / avgLoss;
  rsiArray.push(100 - (100 / (1 + rs)));

  // Subsequent
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].price - data[i - 1].price;
    
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
    }

    rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    rsiArray.push(rsi);
  }
  
  return rsiArray;
};

export const calculateEMA = (data: ChartPoint[], period: number): (number | null)[] => {
  const k = 2 / (period + 1);
  const emaArray = new Array(data.length).fill(null);
  const prices = data.map(d => d.price);

  if (prices.length < period) return emaArray;

  // Start with SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  emaArray[period - 1] = sum / period;

  // Calculate EMA
  for (let i = period; i < prices.length; i++) {
    emaArray[i] = (prices[i] * k) + (emaArray[i - 1]! * (1 - k));
  }

  return emaArray;
};

export const calculateBollingerBands = (data: ChartPoint[], period: number = 20, multiplier: number = 2) => {
  return data.map((point, index, arr) => {
    if (index < period - 1) return { upper: null, lower: null, middle: null };
    
    const slice = arr.slice(index - period + 1, index + 1);
    const sum = slice.reduce((acc, curr) => acc + curr.price, 0);
    const mean = sum / period;
    
    const squaredDiffs = slice.map(p => Math.pow(p.price - mean, 2));
    const variance = squaredDiffs.reduce((acc, curr) => acc + curr, 0) / period;
    const stdDev = Math.sqrt(variance);
    
    return {
      middle: mean,
      upper: mean + (stdDev * multiplier),
      lower: mean - (stdDev * multiplier)
    };
  });
};

export const calculateMACD = (data: ChartPoint[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) => {
   const prices = data.map(d => d.price);
   
   const calculateEMAInternal = (values: number[], period: number) => {
       const k = 2 / (period + 1);
       const emaArray = new Array(values.length).fill(null);
       
       // Simple MA for first value
       let sum = 0;
       for(let i = 0; i < period; i++) sum += values[i];
       emaArray[period - 1] = sum / period;
       
       for(let i = period; i < values.length; i++) {
           emaArray[i] = (values[i] * k) + (emaArray[i-1]! * (1-k));
       }
       return emaArray;
   }
   
   const fastEMA = calculateEMAInternal(prices, fastPeriod);
   const slowEMA = calculateEMAInternal(prices, slowPeriod);
   
   const macdLine = prices.map((_, i) => {
       if (fastEMA[i] === null || slowEMA[i] === null) return null;
       return fastEMA[i]! - slowEMA[i]!;
   });

   // Calculate Signal Line (EMA of MACD Line)
   // Filter out nulls first to calc signal, then map back
   const validMacd = macdLine.filter(x => x !== null) as number[];
   const signalLineRaw = calculateEMAInternal(validMacd, signalPeriod);
   
   // Pad signal line with nulls to match original length
   const padLength = macdLine.length - validMacd.length;
   const signalLine = [...new Array(padLength).fill(null), ...signalLineRaw];

   return data.map((_, i) => ({
       macd: macdLine[i],
       signal: signalLine[i],
       histogram: (macdLine[i] !== null && signalLine[i] !== null) ? macdLine[i]! - signalLine[i]! : null
   }));
};

export const calculateATR = (data: ChartPoint[], period: number = 14): (number | null)[] => {
    if (data.length < period + 1) return new Array(data.length).fill(null);
    
    const trArray: number[] = [];
    
    // Calculate TR
    for(let i = 1; i < data.length; i++) {
        const tr = Math.abs(data[i].price - data[i-1].price);
        trArray.push(tr);
    }
    
    const atrArray = new Array(data.length).fill(null);
    
    // First ATR is simple average of TRs
    let sumTR = 0;
    for(let i = 0; i < period; i++) sumTR += trArray[i];
    atrArray[period] = sumTR / period;
    
    // Subsequent ATR: ((Prior ATR * (period - 1)) + Current TR) / period
    for(let i = period + 1; i < data.length; i++) {
        const currentTR = trArray[i-1];
        const prevATR = atrArray[i-1]!;
        atrArray[i] = ((prevATR * (period - 1)) + currentTR) / period;
    }
    
    return atrArray;
};

// --- NEW FUNCTION: Pivot Points (Standard) ---
export const calculatePivotPoints = (data: ChartPoint[]): PivotPoints | undefined => {
    // We need at least enough data to approximate a daily candle.
    // If data is hourly/minute, we take the last known data points to estimate "Yesterday's" range.
    if (data.length < 2) return undefined;

    // In a real app, we would fetch precise Daily OHLC. 
    // Here we approximate based on the dataset provided (usually 14 days of hourly data).
    // We take the high/low/close of the LAST FULL DAY (or the entire dataset if shorter).
    
    const prices = data.map(d => d.price);
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const close = prices[prices.length - 1];

    const p = (high + low + close) / 3;
    const r1 = (2 * p) - low;
    const s1 = (2 * p) - high;
    const r2 = p + (high - low);
    const s2 = p - (high - low);

    return { p, r1, r2, s1, s2 };
};
