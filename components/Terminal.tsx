
import React, { useState, useEffect, useRef } from 'react';
import { TerminalLog } from '../types';
import { Send, Terminal as TerminalIcon, Sparkles, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { SoundService } from '../services/soundService';

interface TerminalProps {
  logs: TerminalLog[];
  onCommand: (cmd: string) => void;
  onImageUpload: (file: File) => void;
  isProcessing: boolean;
}

export const Terminal: React.FC<TerminalProps> = ({ logs, onCommand, onImageUpload, isProcessing }) => {
  const [input, setInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (instant = false) => {
    if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: instant ? 'auto' : 'smooth'
        });
    }
  };

  useEffect(() => {
    scrollToBottom();
    const lastLog = logs[logs.length - 1];
    if (lastLog && lastLog.type !== 'command') {
      if (lastLog.type === 'error') SoundService.playError();
      else SoundService.playProcessing();
    }
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    SoundService.playEnter();
    onCommand(input.trim());
    setInput('');
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      SoundService.playClick();
      onImageUpload(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full glass-panel flex flex-col h-full rounded-none md:rounded-xl overflow-hidden shadow-none md:shadow-2xl border-x-0 border-t-0 md:border min-h-0 relative transition-all ${isDragging ? 'border-orange-500/50 bg-orange-500/5 scale-[0.995]' : ''}`}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-orange-500/10 backdrop-blur-sm flex flex-col items-center justify-center border-4 border-dashed border-orange-500/30 rounded-xl animate-pulse">
            <UploadCloud size={48} className="text-orange-400 mb-2" />
            <p className="text-orange-300 font-bold uppercase tracking-widest text-xs">Drop Chart for Analysis</p>
        </div>
      )}

      {/* Header - Fixed Height */}
      <div className="px-4 py-3 border-b border-[var(--glass-border)] bg-black/20 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
           <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
           <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
           <span className="ml-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Terminal Log</span>
        </div>
        <TerminalIcon size={14} className="text-gray-500" />
      </div>

      {/* Logs Area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm custom-scrollbar bg-black/10 min-h-0"
      >
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 animate-fade-in">
             <div className="shrink-0 pt-1">
                 {log.type === 'command' && <span className="text-gray-500">➜</span>}
                 {log.type === 'system' && <span className="text-blue-500">ℹ</span>}
                 {log.type === 'error' && <span className="text-red-500">✕</span>}
                 {log.type === 'response' && <span className="text-green-500">✔</span>}
                 {log.type === 'analysis' && <Sparkles size={14} className="text-orange-400" />}
                 {log.type === 'vision' && <span className="text-purple-400">👁</span>}
             </div>
             <div className="flex-1 overflow-hidden break-words">
                 {log.type === 'command' ? (
                     <span className="text-white font-medium">{log.content}</span>
                 ) : (
                     <div className={`
                         ${log.type === 'error' ? 'text-red-300' : 'text-gray-300'}
                         ${log.type === 'analysis' ? 'text-orange-200 bg-orange-500/5 p-2 rounded border border-orange-500/10' : ''}
                         ${log.type === 'vision' ? 'text-purple-200 bg-purple-500/5 p-2 rounded border border-purple-500/10' : ''}
                     `}>
                         {log.content}
                     </div>
                 )}
                 <div className="text-[10px] text-gray-600 mt-1">{log.timestamp.toLocaleTimeString()}</div>
             </div>
          </div>
        ))}
        {isProcessing && (
           <div className="flex items-center gap-2 text-orange-400 text-xs animate-pulse pl-7">
              <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
              AI processing...
           </div>
        )}
        <div ref={bottomRef} className="h-0 w-0 invisible" />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-[var(--glass-border)] bg-white/5 shrink-0">
         <div className="flex items-center gap-3 px-3 py-2 bg-black/30 rounded-lg border border-[var(--glass-border)] focus-within:border-orange-500/50 transition-colors">
            <span className="text-orange-500 font-bold">➜</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); SoundService.playKeystroke(); }}
              className="flex-1 bg-transparent border-none outline-none text-white font-mono text-base md:text-sm placeholder-gray-600"
              placeholder="Type command..."
              autoFocus
            />
            <div className="flex items-center gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                />
                <button 
                  type="button" 
                  onClick={handleImageClick}
                  className="text-gray-500 hover:text-orange-400 transition-colors p-1"
                  title="Upload Chart Image for Analysis"
                >
                  <ImageIcon size={18} />
                </button>
                <button type="submit" disabled={!input} className="text-gray-400 hover:text-orange-500 transition-colors disabled:opacity-30 p-1">
                   <Send size={16} />
                </button>
            </div>
         </div>
      </form>
    </div>
  );
};
