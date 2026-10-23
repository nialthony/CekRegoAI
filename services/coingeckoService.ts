
import { CryptoData, MarketChartData } from '../types';

const BASE_URL = 'https://api.coingecko.com/api/v3';
const API_KEY = 'CG-oYUT41zxbzrafA4xrKMPp1vw';

// Helper to add a small random delay to prevent synchronized polling spikes
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Basic wrapper for fetch with error handling
async function fetchAPI<T>(endpoint: string, silent404: boolean = false): Promise<T | null> {
  const options = {
    method: 'GET',
  };

  try {
    const hasQuery = endpoint.includes('?');
    const separator = hasQuery ? '&' : '?';
    const url = `${BASE_URL}${endpoint}${separator}x_cg_demo_api_key=${API_KEY}`;

    const response = await fetch(url, options);
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Coingecko Rate Limit Exceeded. Cooling down...");
      }
      if (response.status === 404) {
        if (silent404) return null;
        throw new Error("Asset data unavailable in market index (404).");
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error: any) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error("Network connection unstable.");
    }
    throw error;
  }
}

export const getCoinData = async (coinId: string): Promise<CryptoData | null> => {
  await delay(Math.random() * 500);
  try {
    const data = await fetchAPI<CryptoData[]>(`/coins/markets?vs_currency=usd&ids=${coinId}&order=market_cap_desc&per_page=1&page=1&sparkline=false`);
    if (!data || data.length === 0) return null;
    return data[0];
  } catch (e) {
    throw e;
  }
};

export const getMarketChart = async (coinId: string, days: number = 1): Promise<MarketChartData> => {
  const data = await fetchAPI<MarketChartData>(`/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`);
  if (!data) throw new Error("Chart data unreachable.");
  return data;
};

export const searchCoins = async (query: string): Promise<{ 
  id: string; 
  symbol: string; 
  name: string; 
  market_cap_rank: number | null;
  thumb?: string;
  large?: string;
}[]> => {
  const data = await fetchAPI<{ coins: { id: string; symbol: string; name: string; market_cap_rank: number | null; thumb?: string; large?: string }[] }>(`/search?query=${query}`);
  if (!data || !data.coins) return [];
  
  const sorted = data.coins.sort((a, b) => {
    const queryLower = query.toLowerCase();
    const symbolA = a.symbol.toLowerCase();
    const symbolB = b.symbol.toLowerCase();

    if (symbolA === queryLower && symbolB !== queryLower) return -1;
    if (symbolB === queryLower && symbolA !== queryLower) return 1;

    const rankA = a.market_cap_rank ?? 999999;
    const rankB = b.market_cap_rank ?? 999999;
    
    return rankA - rankB;
  });

  return sorted.slice(0, 8); 
};

export const getMarketOpportunitiesData = async (): Promise<CryptoData[]> => {
    try {
        const trending = await fetchAPI<{ coins: any[] }>('/search/trending', true);
        const trendingIds = trending?.coins ? trending.coins.map(c => c.item.id).slice(0, 10) : [];
        
        const topVolume = await fetchAPI<CryptoData[]>('/coins/markets?vs_currency=usd&order=volume_desc&per_page=15&page=1&sparkline=false', true);
        const volumeData = topVolume || [];
        
        const uniqueIds = [...new Set([...trendingIds, ...volumeData.map(c => c.id)])];
        if (uniqueIds.length === 0) return [];

        const allData = await fetchAPI<CryptoData[]>(`/coins/markets?vs_currency=usd&ids=${uniqueIds.join(',')}&order=market_cap_desc&sparkline=false`, true);
        return allData || [];
    } catch (e) {
        console.error("Scanner data fetch error", e);
        return [];
    }
};

export const getSimplePrices = async (ids: string[]): Promise<Record<string, { usd: number }>> => {
    if (ids.length === 0) return {};
    const data = await fetchAPI<Record<string, { usd: number }>>(`/simple/price?ids=${ids.join(',')}&vs_currencies=usd`, true);
    return data || {};
};

export const getOpenInterest = async (coinId: string): Promise<number> => {
  try {
    // Derivatives endpoint is prone to 404 for many smaller coins
    const data = await fetchAPI<any[]>(`/coins/${coinId}/derivatives?include_tickers=unexpired`, true);
    if (data && Array.isArray(data)) {
      return data.reduce((acc, curr) => acc + (parseFloat(curr.open_interest_usd) || 0), 0);
    }
    return 0;
  } catch (e) {
    return 0;
  }
};

export const getFearAndGreedIndex = async (): Promise<{ value: string, value_classification: string } | null> => {
  try {
    const response = await fetch('https://api.alternative.me/fng/?limit=1');
    if (!response.ok) return null;
    const json = await response.json();
    if (json.data && json.data.length > 0) {
        return json.data[0];
    }
    return null;
  } catch (e) {
    return null;
  }
};
