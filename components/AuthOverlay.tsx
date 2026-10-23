
import React, { useState, useEffect } from 'react';
import { AuthService, AccessKey } from '../services/authService';
import { ShieldCheck, Lock, Terminal, Key, UserCheck, Calendar, Globe, Send, History, Smartphone, RefreshCw, LogIn, Cpu } from 'lucide-react';

interface AuthOverlayProps {
    onAuthenticated: () => void;
}

export const AuthOverlay: React.FC<AuthOverlayProps> = ({ onAuthenticated }) => {
    const [view, setView] = useState<'login' | 'admin'>('login');
    const [inputKey, setInputKey] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [deviceId, setDeviceId] = useState('');
    
    // Success/Loading State
    const [isSuccess, setIsSuccess] = useState(false);
    const [progress, setProgress] = useState(0);

    // Admin State
    const [generatedKey, setGeneratedKey] = useState('');
    const [keysList, setKeysList] = useState<AccessKey[]>([]);

    useEffect(() => {
        setDeviceId(AuthService.getDeviceId());
        if (AuthService.checkAuth()) {
            onAuthenticated();
        }
    }, [onAuthenticated]);

    // Handle the 5-second success animation
    useEffect(() => {
        if (isSuccess) {
            const duration = 5000; // 5 seconds
            const intervalTime = 50;
            const steps = duration / intervalTime;
            let currentStep = 0;

            const timer = setInterval(() => {
                currentStep++;
                const newProgress = Math.min((currentStep / steps) * 100, 100);
                setProgress(newProgress);

                if (currentStep >= steps) {
                    clearInterval(timer);
                    onAuthenticated();
                }
            }, intervalTime);

            return () => clearInterval(timer);
        }
    }, [isSuccess, onAuthenticated]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simulate network check
        await new Promise(r => setTimeout(r, 800));

        if (inputKey === '24jun19') {
            setView('admin');
            setKeysList(AuthService.getAdminHistory());
            setIsLoading(false);
            return;
        }

        const result = AuthService.validateKey(inputKey);
        
        setIsLoading(false);
        
        if (result.valid) {
            setIsSuccess(true); // Trigger animation
        } else {
            setError(result.message);
        }
    };

    const generateKey = (days: number) => {
        const newKey = AuthService.generateKey(days);
        setGeneratedKey(newKey);
        setKeysList(AuthService.getAdminHistory());
    };
    
    const refreshHistory = () => {
        setKeysList(AuthService.getAdminHistory());
    };

    const getDeviceLimitText = (days: number) => {
        if (days <= 7) return "1 Device";
        if (days === 14) return "2 Devices";
        return "4 Devices";
    }

    // SUCCESS / AUTHENTICATING SCREEN
    if (isSuccess) {
        return (
            <div className="fixed inset-0 z-50 bg-[#050505] flex items-center justify-center p-4">
                 <div className="w-full max-w-md text-center">
                    <div className="mb-6 relative inline-block">
                        <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full animate-pulse"></div>
                        <ShieldCheck size={64} className="text-green-500 relative z-10 animate-bounce" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2 tracking-widest animate-pulse">AUTHENTICATING...</h2>
                    <p className="text-green-400 font-mono text-sm mb-6">ESTABLISHING SECURE CONNECTION</p>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                        <div 
                            className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] transition-all duration-75 ease-linear"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    
                    <div className="flex justify-between mt-2 font-mono text-[10px] text-gray-500">
                        <span>HANDSHAKE_INIT</span>
                        <span>{Math.round(progress)}%</span>
                        <span>DECRYPTING</span>
                    </div>

                    <div className="mt-8 grid grid-cols-1 gap-1 text-[10px] text-gray-600 font-mono text-left opacity-70">
                         {progress > 10 && <div>{'>'} Verifying Key Signature... OK</div>}
                         {progress > 30 && <div>{'>'} Checking Device ID Hash... OK</div>}
                         {progress > 60 && <div>{'>'} Allocating Neural Resources... OK</div>}
                         {progress > 85 && <div>{'>'} Initializing Dashboard...</div>}
                    </div>
                 </div>
            </div>
        )
    }

    if (view === 'admin') {
        return (
            <div className="fixed inset-0 z-50 bg-[#050505] text-white flex flex-col font-mono">
                <div className="border-b border-orange-500/20 p-4 bg-orange-500/5 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-orange-500">
                        <Terminal size={20} />
                        <span className="font-bold tracking-wider">ADMIN_PANEL // KEY_GEN</span>
                    </div>
                    <div className="flex gap-4 items-center">
                        <button 
                            onClick={onAuthenticated} 
                            className="flex items-center gap-1 text-xs font-bold text-green-400 hover:text-green-300 border border-green-500/30 px-3 py-1.5 rounded bg-green-500/10 transition-colors"
                        >
                            <LogIn size={12} /> ENTER APP
                        </button>
                        <button onClick={() => setView('login')} className="text-xs text-gray-500 hover:text-white">LOGOUT</button>
                    </div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Generator */}
                        <div className="glass-panel p-6 rounded-xl border border-white/10">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Key className="text-orange-500" /> Generate Signed Key
                            </h2>
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {[3, 7, 14, 30].map(days => (
                                    <button
                                        key={days}
                                        onClick={() => generateKey(days)}
                                        className="flex flex-col items-center justify-center py-4 px-2 bg-white/5 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500 transition-all rounded text-sm group"
                                    >
                                        <span className="font-bold text-lg group-hover:text-orange-400">{days} DAYS</span>
                                        <span className="text-[10px] text-gray-500 group-hover:text-white/80 uppercase tracking-wider flex items-center gap-1">
                                            <Smartphone size={10} /> {getDeviceLimitText(days)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                            
                            {generatedKey && (
                                <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg text-center animate-fade-in">
                                    <div className="text-xs text-green-400 uppercase tracking-wider mb-1">New Key Generated</div>
                                    <div className="text-2xl font-bold text-white select-all cursor-pointer">{generatedKey}</div>
                                    <div className="text-[10px] text-gray-500 mt-2">
                                        Valid for {keysList[keysList.length-1]?.durationDays} days. 
                                        Max {keysList[keysList.length-1]?.maxDevices} Device(s).
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Database View */}
                        <div className="glass-panel p-6 rounded-xl border border-white/10">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <History className="text-blue-500" /> Generation Log
                                </h2>
                                <button 
                                    onClick={refreshHistory} 
                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                    title="Refresh List"
                                >
                                    <RefreshCw size={16} />
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead>
                                        <tr className="border-b border-white/10 text-gray-500">
                                            <th className="py-2 pl-2">KEY</th>
                                            <th className="py-2">DAYS</th>
                                            <th className="py-2">LIMIT</th>
                                            <th className="py-2">CREATED</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {[...keysList].reverse().map((k, i) => (
                                            <tr key={i} className="hover:bg-white/5">
                                                <td className="py-2 pl-2 font-mono text-orange-300">{k.key}</td>
                                                <td className="py-2">{k.durationDays}d</td>
                                                <td className="py-2 text-gray-400 flex items-center gap-1">
                                                    <Smartphone size={12} /> {k.maxDevices}
                                                </td>
                                                <td className="py-2 text-gray-500">
                                                    {new Date(k.generatedAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Login View
    return (
        <div className="fixed inset-0 z-50 bg-[#050505] flex items-center justify-center p-4">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                 <div className="absolute top-[-20%] left-[-20%] w-[50vw] h-[50vw] bg-orange-600/10 rounded-full blur-[100px]"></div>
                 <div className="absolute bottom-[-20%] right-[-20%] w-[50vw] h-[50vw] bg-blue-600/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-white/10 relative shadow-2xl shadow-orange-900/20">
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-orange-500/10 rounded-full border border-orange-500/30">
                        <ShieldCheck size={48} className="text-orange-500" />
                    </div>
                </div>
                
                <h1 className="text-2xl font-bold text-center text-white mb-1 tracking-tight">CEKREGO AI <span className="text-orange-500">PREMIUM</span></h1>
                <p className="text-center text-gray-500 text-sm mb-8">Futures Intelligence & Analysis Engine</p>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                         <label className="text-xs font-bold text-gray-400 ml-1 uppercase">Access Key</label>
                         <div className="relative">
                             <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                             <input 
                                type="text" 
                                value={inputKey}
                                onChange={(e) => setInputKey(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white font-mono focus:border-orange-500/50 outline-none transition-all placeholder-gray-700"
                                placeholder="CEK-XX-X-XXXX-XXXX"
                             />
                         </div>
                    </div>
                    
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex items-center gap-2">
                             <ShieldCheck size={14} /> {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading || !inputKey}
                        className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-orange-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {isLoading ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <>AUTHENTICATE <Send size={16} /></>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-4">
                     <div className="text-[10px] text-gray-600 font-mono">
                        DEVICE ID: {deviceId.substring(0, 12)}...
                     </div>
                     <a 
                        href="https://nialthony.t.me/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                     >
                        <Globe size={12} /> Contact Admin for Access
                     </a>
                </div>
            </div>
        </div>
    );
};
