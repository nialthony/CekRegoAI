
import { ExchangeSettings } from '../types';

const SETTINGS_KEY = 'cek_rego_exchange_settings';

/**
 * ExchangeService: Simplified bridge for simulated execution.
 */
export const ExchangeService = {
  // Added getSettings to fix property missing error in ExchangeSettingsModal
  getSettings: (): ExchangeSettings => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse exchange settings", e);
      }
    }
    return {
      activeExchange: 'SIMULATED',
      apiKey: '',
      apiSecret: '',
      isTestnet: true
    };
  },

  // Added saveSettings to fix property missing error in ExchangeSettingsModal
  saveSettings: (settings: ExchangeSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  // Logic for simulation execution structured as a real call
  fetchBalance: async (settings: ExchangeSettings): Promise<number> => {
    return new Promise(resolve => setTimeout(() => resolve(10000.00), 1000));
  },

  executeOrder: async (
    settings: ExchangeSettings,
    symbol: string,
    side: 'LONG' | 'SHORT',
    amountUSD: number,
    leverage: number
  ): Promise<{ success: boolean; orderId?: string; error?: string }> => {
    // Simulated API Call delay for realism
    await new Promise(r => setTimeout(r, 1200));
    
    return { 
      success: true, 
      orderId: 'SIM-' + Math.random().toString(36).substring(7).toUpperCase() 
    };
  }
};
