import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart2, 
  Sparkles, 
  Shield, 
  ChevronRight, 
  X, 
  Search,
  Target,
  Activity,
  Cpu
} from 'lucide-react';
import { SoundService } from '../services/soundService';

interface Step {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    title: "Welcome to CekRego Pro",
    description: "Your modern institutional crypto trading workstation. Say goodbye to retro command lines and hello to real-time AI visual telemetry.",
    icon: <Activity className="text-orange-500" size={38} />
  },
  {
    title: "Spotlight Search (Cmd + K)",
    description: "Press ⌘K or click the search bar anytime to search over 10,000+ crypto pairs. Instant price tags, rankings, and one-click analysis.",
    icon: <Search className="text-blue-400" size={38} />
  },
  {
    title: "TradingView Pro Chart Canvas",
    description: "Interactive real-time candlestick & area charts. Switch between 1D, 7D, 14D, and 30D timeframes with live open interest and 24h stats.",
    icon: <BarChart2 className="text-emerald-400" size={38} />
  },
  {
    title: "AI Signal Matrix & Targets",
    description: "Get institutional Entry, Stop Loss, and 3-stage Take Profit ladders with 1-click clipboard copy. Grounded by real-time @MarketNews_Feed intelligence.",
    icon: <Target className="text-rose-400" size={38} />
  },
  {
    title: "Breakout Opportunity Scanner",
    description: "Let the AI scan top volume coins for sudden breakouts, oversold bounces, and high-probability scalping opportunities.",
    icon: <Sparkles className="text-purple-400" size={38} />
  }
];

interface OnboardingTutorialProps {
  onComplete: () => void;
}

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      SoundService.playClick();
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      localStorage.setItem('cek_rego_onboarding_complete', 'true');
      onComplete();
      SoundService.playSuccess();
    }, 250);
  };

  const step = STEPS[currentStep];

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-md bg-[#0e1017] border border-orange-500/30 rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-5 pb-0 flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-[10px] font-mono text-orange-400 uppercase tracking-widest font-bold">
                  Workstation Tour
                </span>
              </div>
              <button 
                onClick={handleComplete}
                className="text-gray-500 hover:text-white transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col items-center text-center">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-5 p-4 bg-white/[0.04] rounded-2xl border border-white/[0.08]"
              >
                {step.icon}
              </motion.div>

              <motion.h2
                key={`title-${currentStep}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg font-bold text-white mb-2"
              >
                {step.title}
              </motion.h2>

              <motion.p
                key={`desc-${currentStep}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-gray-400 leading-relaxed mb-6 max-w-xs"
              >
                {step.description}
              </motion.p>

              {/* Progress Dots */}
              <div className="flex gap-1.5 mb-6">
                {STEPS.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      idx === currentStep ? 'w-6 bg-orange-500' : 'w-2 bg-white/10'
                    }`}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex w-full gap-2.5">
                <button 
                  onClick={handleComplete}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                >
                  Skip
                </button>
                <button 
                  onClick={handleNext}
                  className="flex-[2] py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-xs font-black text-black transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-orange-900/30"
                >
                  <span>{currentStep === STEPS.length - 1 ? 'Start Trading' : 'Next'}</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-black/40 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-gray-500">
              <div className="flex items-center gap-1.5">
                <Cpu size={12} className="text-gray-500" />
                <span>Step {currentStep + 1} of {STEPS.length}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity size={12} className="text-emerald-400" />
                <span>Engine Ready</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
