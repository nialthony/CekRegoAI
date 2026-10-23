
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from "@google/genai";
import { SoundService } from './soundService';

interface LiveServiceConfig {
  onToolCall: (toolName: string, args: any) => Promise<any>;
  onStatusChange: (status: 'disconnected' | 'connecting' | 'connected' | 'speaking') => void;
}

export class LiveService {
  private ai: GoogleGenAI;
  private config: LiveServiceConfig;
  private session: any = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private outputNode: GainNode | null = null;
  private nextStartTime: number = 0;
  private stream: MediaStream | null = null;
  private isConnected: boolean = false;

  constructor(config: LiveServiceConfig) {
    this.config = config;
    // Correctly initialize with named apiKey parameter
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async connect() {
    this.config.onStatusChange('connecting');
    
    // 1. Setup Audio Contexts
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    this.outputNode = this.outputAudioContext.createGain();
    this.outputNode.connect(this.outputAudioContext.destination);

    // 2. Define Tools
    const analyzeCoinTool: FunctionDeclaration = {
      name: 'analyze_coin',
      parameters: {
        type: Type.OBJECT,
        description: 'Analyzes a specific cryptocurrency ticker symbol.',
        properties: {
          ticker: {
            type: Type.STRING,
            description: 'The symbol or name of the coin (e.g. btc, eth, solana)',
          },
        },
        required: ['ticker'],
      },
    };

    // 3. Connect to Gemini Live
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = this.ai.live.connect({
        // Updated to the latest recommended model for live tasks
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            this.isConnected = true;
            this.config.onStatusChange('connected');
            this.startAudioInput(sessionPromise);
            SoundService.playBoot();
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              this.config.onStatusChange('speaking');
              await this.playAudioChunk(base64Audio);
              // Revert to connected after a short delay if no more audio
              setTimeout(() => {
                  if (this.isConnected) this.config.onStatusChange('connected');
              }, 1000);
            }

            // Handle Tool Calls
            if (message.toolCall) {
               for (const fc of message.toolCall.functionCalls) {
                   if (fc.name === 'analyze_coin') {
                       const result = await this.config.onToolCall(fc.name, fc.args);
                       sessionPromise.then(session => {
                           session.sendToolResponse({
                               functionResponses: {
                                   id: fc.id,
                                   name: fc.name,
                                   response: { result: JSON.stringify(result) }
                               }
                           });
                       });
                   }
               }
            }
          },
          onclose: () => {
            this.disconnect();
          },
          onerror: (e) => {
            console.error("Live API Error:", e);
            this.disconnect();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }, // Deep, serious voice fits terminal
          },
          systemInstruction: "You are the voice interface for CekRego Terminal, a futuristic crypto trading deck. You are concise, professional, and slightly cynical. If the user asks to analyze, check, or look at a coin, CALL the analyze_coin tool immediately. Do not describe charts, just say 'Accessing data for [coin]'.",
          tools: [{ functionDeclarations: [analyzeCoinTool] }],
        },
      });
      
      this.session = sessionPromise;

    } catch (e) {
      console.error("Connection Failed", e);
      this.disconnect();
    }
  }

  private startAudioInput(sessionPromise: Promise<any>) {
    if (!this.inputAudioContext || !this.stream) return;

    this.inputSource = this.inputAudioContext.createMediaStreamSource(this.stream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      if (!this.isConnected) return;
      
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = this.createBlob(inputData);
      
      sessionPromise.then((session) => {
          session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private async playAudioChunk(base64: string) {
    if (!this.outputAudioContext || !this.outputNode) return;

    const arrayBuffer = this.base64ToArrayBuffer(base64);
    const audioBuffer = await this.decodeAudioData(
        new Uint8Array(arrayBuffer), 
        this.outputAudioContext
    );

    this.nextStartTime = Math.max(this.outputAudioContext.currentTime, this.nextStartTime);
    
    const source = this.outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputNode);
    source.start(this.nextStartTime);
    
    this.nextStartTime += audioBuffer.duration;
  }

  disconnect() {
    this.isConnected = false;
    this.config.onStatusChange('disconnected');

    if (this.session) {
        this.session.then((s: any) => {
            try { s.close(); } catch(e){}
        });
        this.session = null;
    }
    
    if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
    }
    
    if (this.inputSource) this.inputSource.disconnect();
    if (this.processor) this.processor.disconnect();
    if (this.inputAudioContext) this.inputAudioContext.close();
    if (this.outputAudioContext) this.outputAudioContext.close();
  }

  // Utils
  private createBlob(data: Float32Array): any {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        // Simple clipping and conversion
        const s = Math.max(-1, Math.min(1, data[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return {
      data: this.arrayBufferToBase64(int16.buffer),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  private async decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
      const dataInt16 = new Int16Array(data.buffer);
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) {
          channelData[i] = dataInt16[i] / 32768.0;
      }
      return buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
  }
}
