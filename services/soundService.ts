
// Web Audio API wrapper for retro terminal sounds
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isMuted = false;

const initAudio = () => {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.15; // Master volume
      masterGain.connect(audioCtx.destination);
    } catch (e) {
      console.error("Web Audio API not supported");
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

const createOscillator = (type: OscillatorType, freq: number, duration: number, vol: number = 1) => {
    if (!audioCtx || !masterGain || isMuted) return;
    
    // Resume context if needed (browser policy)
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    // Envelope
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
};

export const SoundService = {
  init: initAudio,
  
  toggleMute: () => {
      isMuted = !isMuted;
      // If we mute, we can just return the state. 
      // The individual play functions check isMuted.
      return isMuted;
  },
  
  getMuteState: () => isMuted,

  playKeystroke: () => {
    // Mechanical key click: high pitch square wave, very short
    // Randomized pitch for realism
    createOscillator('square', 600 + Math.random() * 200, 0.05, 0.05);
  },

  playEnter: () => {
    // Return key: Lower pitch, slightly longer
    createOscillator('triangle', 300, 0.1, 0.2);
  },

  playError: () => {
    // Error buzzer: Sawtooth, low pitch, descending
    if (!audioCtx || !masterGain || isMuted) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  },

  playProcessing: () => {
      // Modem data burst
      if (isMuted) return;
      const count = 5;
      for(let i=0; i<count; i++) {
          setTimeout(() => {
              createOscillator('square', 800 + Math.random() * 800, 0.05, 0.05);
          }, i * 40);
      }
  },

  playSuccess: () => {
      // Positive chime
      createOscillator('sine', 880, 0.1, 0.1); // A5
      setTimeout(() => createOscillator('sine', 1108, 0.2, 0.1), 100); // C#6
      setTimeout(() => createOscillator('sine', 1318, 0.4, 0.1), 200); // E6
  },
  
  playBoot: () => {
      // Startup swell
      if (!audioCtx || !masterGain || isMuted) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(55, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.5);
      
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.0);
      
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.0);
  },

  playClick: () => {
      // Generic UI interaction
      createOscillator('sine', 800, 0.03, 0.05);
  }
};
