import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, Activity, Sparkles, Image, Terminal as TerminalIcon, Send, X, ArrowRight } from 'lucide-react';
import { TerminalLog } from '../types';
import { SoundService } from '../services/soundService';

interface ActivityDrawerProps {
  logs: TerminalLog[];
  isProcessing: boolean;
  onExecuteCommand: (cmd: string) => void;
  onImageUpload: (file: File) => void;
}

export const ActivityDrawer: React.FC<ActivityDrawerProps> = ({
  logs,
  isProcessing,
  onExecuteCommand,
  onImageUpload
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    SoundService.playClick();
    onExecuteCommand(input.trim());
    setInput('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      SoundService.playClick();
      onImageUpload(file);
      setIsOpen(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const latestLog = logs[logs.length - 1];

  return (
    <div className="w-full bg-[#0a0c12] border-t border-white/[0.08] transition-all z-20">
      {/* Bottom Bar Header / Collapsed Strip */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3 text-xs min-w-0">
          <div className="flex items-center gap-1.5 font-bold text-gray-400 uppercase tracking-wider text-[10px]">
            <Activity size={12} className="text-orange-400" />
            <span>AI Telemetry</span>
          </div>

          <div className="w-px h-3 bg-white/10 hidden sm:block" />

          {/* Latest Log Preview */}
          <div className="text-xs text-gray-300 truncate max-w-[300px] sm:max-w-md md:max-w-xl font-mono">
            {isProcessing ? (
              <span className="text-orange-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                Synthesizing multi-dimensional neural vectors...
              </span>
            ) : latestLog ? (
              typeof latestLog.content === 'string' ? latestLog.content : 'Target analysis updated.'
            ) : (
              'Ready for signal synthesis.'
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
          <span className="hidden sm:inline text-[11px]">{logs.length} events</span>
          <button className="p-1 text-gray-400 hover:text-white">
            {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Log Drawer */}
      {isOpen && (
        <div className="p-4 border-t border-white/[0.06] bg-[#07090e] max-h-64 flex flex-col gap-3">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto space-y-2.5 max-h-44 custom-scrollbar font-mono text-xs pr-2"
          >
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2.5 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="mt-0.5 shrink-0">
                  {log.type === 'analysis' ? (
                    <Sparkles size={13} className="text-orange-400" />
                  ) : log.type === 'vision' ? (
                    <Image size={13} className="text-purple-400" />
                  ) : log.type === 'error' ? (
                    <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                  ) : log.type === 'command' ? (
                    <ArrowRight size={13} className="text-emerald-400" />
                  ) : (
                    <Activity size={13} className="text-blue-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-gray-300 break-words leading-relaxed">
                    {log.content}
                  </div>
                  <div className="text-[10px] text-gray-600 mt-1">
                    {log.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Input Bar */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Quick prompt (e.g. analyze sol, scan, help)..."
              className="flex-1 bg-white/[0.04] border border-white/[0.08] focus:border-orange-500/50 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none font-mono"
            />
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange} 
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-purple-400 text-xs font-semibold"
              title="Upload Chart Screenshot"
            >
              <Image size={15} />
            </button>
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-black text-xs font-bold font-mono transition-all"
            >
              Run
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
