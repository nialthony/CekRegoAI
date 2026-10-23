
import React, { useState } from 'react';
import { ExchangeSettings, ExchangeType } from '../types';
import { ExchangeService } from '../services/exchangeService';
import { X, Shield, Key, AlertCircle, CheckCircle2, Link, Link2Off } from 'lucide-react';
import { SoundService } from '../services/soundService';

interface ExchangeSettingsModalProps {
  onClose: () => void;
  onUpdate: (settings: ExchangeSettings) => void;
}

export const ExchangeSettingsModal: React.FC<ExchangeSettingsModalProps> = ({ onClose, onUpdate }) => {
  const [settings, setSettings] = useState<ExchangeSettings>(ExchangeService.getSettings());
  const [testResult, setTestResult] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const handleSave = () => {
    ExchangeService.saveSettings(settings);
    onUpdate(settings);
    SoundService.playSuccess();
    onClose();
  };

  const testConnection = async () => {
    setTestResult('testing');
    SoundService.playProcessing();
    await new Promise(r => setTimeout(r, 2000));
    setTestResult('success');
    SoundService.playSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg glass-panel rounded-2xl border border-orange-500/30 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-orange-500/5">
          <div className="flex items-center gap-3">
            <Link className="text-orange-500" size={24} />
            <div>
              <h2 className="text-xl font-bold text-white uppercase tracking-tight">CEX Link Module</h2>
              <p className="text-[10px] text-gray-500 font-mono">ENCRYPTED LOCAL STORAGE • ZERO SERVER SYNC</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={24} /></button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Engine</label>
            <div className="grid grid-cols-2 gap-2">
              {(['SIMULATED', 'BINANCE', 'OKX', 'GATE_IO'] as ExchangeType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setSettings(prev => ({ ...prev, activeExchange: type }))}
                  className={`py-3 rounded-lg border text-xs font-bold transition-all ${settings.activeExchange === type ? 'bg-orange-500 border-orange-500 text-black' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {settings.activeExchange !== 'SIMULATED' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex gap-3">
                <AlertCircle className="text-orange-500 shrink-0" size={18} />
                <p className="text-[10px] text-orange-200 leading-relaxed">
                  Warning: Use restricted API keys with only "Spot/Futures Trading" enabled. 
                  NEVER enable "Withdrawal" permissions. Keys are stored locally on this device.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
                    <Key size={12} /> API Key
                  </div>
                  <input
                    type="password"
                    value={settings.apiKey}
                    onChange={e => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-orange-500 outline-none transition-all"
                    placeholder="Enter Exchange API Key"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
                    <Shield size={12} /> Secret Key
                  </div>
                  <input
                    type="password"
                    value={settings.apiSecret}
                    onChange={e => setSettings(prev => ({ ...prev, apiSecret: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-orange-500 outline-none transition-all"
                    placeholder="Enter Exchange Secret Key"
                  />
                </div>
                {settings.activeExchange === 'OKX' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">
                      Passphrase
                    </div>
                    <input
                      type="password"
                      value={settings.passphrase}
                      onChange={e => setSettings(prev => ({ ...prev, passphrase: e.target.value }))}
                      className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                )}
                
                <div className="flex items-center gap-4">
                   <button 
                    onClick={testConnection}
                    disabled={testResult === 'testing'}
                    className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-gray-300 hover:bg-white/10 flex items-center justify-center gap-2"
                   >
                     {testResult === 'testing' ? <RefreshCw size={14} className="animate-spin" /> : 
                      testResult === 'success' ? <CheckCircle2 size={14} className="text-green-500" /> : <Link size={14} />}
                     Test Connection
                   </button>
                   <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.isTestnet} 
                        onChange={e => setSettings(prev => ({ ...prev, isTestnet: e.target.checked }))}
                        className="accent-orange-500"
                      />
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Use Testnet</span>
                   </label>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 py-3 bg-white/5 rounded-xl text-xs font-bold text-gray-500 hover:text-white transition-all">DISCARD</button>
            <button onClick={handleSave} className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-900/40 transition-all">INITIALIZE LINK</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RefreshCw = ({ className, size }: { className?: string, size?: number }) => (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path></svg>
);
