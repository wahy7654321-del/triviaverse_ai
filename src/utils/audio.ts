/**
 * Web Audio Engine for TriviaVerse AI:
 * - Game Show Synthesized SFX
 * - High-Fidelity 24kHz PCM Playback for Gemini 3.8 Flash TTS & Gemini 3.8 Live API
 * - 16kHz PCM Little-Endian Mic Capture for Gemini 3.8 Live API
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private playbackCtx: AudioContext | null = null;
  private nextStartTime: number = 0;
  private activeSourceNodes: AudioBufferSourceNode[] = [];
  public isMuted: boolean = false;

  private getAudioContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private getPlaybackContext(): AudioContext {
    if (!this.playbackCtx || this.playbackCtx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.playbackCtx = new AudioCtxClass({ sampleRate: 24000 });
    }
    if (this.playbackCtx.state === 'suspended') {
      this.playbackCtx.resume();
    }
    return this.playbackCtx;
  }

  // --- GAME SHOW SOUND EFFECTS ---
  playClick(variant: 'crisp' | 'soft' | 'bubble' = 'crisp') {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (variant === 'bubble') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(360, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.14, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.065);
      } else if (variant === 'soft') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
      } else {
        // Crisp tactile click
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.035);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.045);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
    } catch (e) {}
  }

  playTransition(type: 'whoosh' | 'warp' | 'next' = 'whoosh') {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();

      if (type === 'next') {
        // Crisp question transition chime & whoosh
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1050, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.23);

        const bell = ctx.createOscillator();
        const bellGain = ctx.createGain();
        bell.type = 'triangle';
        bell.frequency.setValueAtTime(1318.5, ctx.currentTime + 0.08); // E6
        bellGain.gain.setValueAtTime(0.12, ctx.currentTime + 0.08);
        bellGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        bell.connect(bellGain);
        bellGain.connect(ctx.destination);
        bell.start(ctx.currentTime + 0.08);
        bell.stop(ctx.currentTime + 0.32);
      } else if (type === 'warp') {
        // Sci-Fi Warp whoosh
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.33);
      } else {
        // Smooth atmospheric stage whoosh
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';

        osc1.frequency.setValueAtTime(260, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(950, ctx.currentTime + 0.15);
        osc1.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.3);

        osc2.frequency.setValueAtTime(130, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(475, ctx.currentTime + 0.15);
        osc2.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.33);
        osc2.stop(ctx.currentTime + 0.33);
      }
    } catch (e) {}
  }

  playGameStart() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      // Dramatic TV game show launch chords
      const chords = [
        { freqs: [261.63, 392.0], time: 0, dur: 0.15 },       // C4, G4
        { freqs: [329.63, 493.88], time: 0.13, dur: 0.16 },   // E4, B4
        { freqs: [392.0, 523.25, 659.25], time: 0.28, dur: 0.45 }, // G4, C5, E5
      ];

      chords.forEach((chord) => {
        chord.freqs.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + chord.time);

          gain.gain.setValueAtTime(0, ctx.currentTime + chord.time);
          gain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + chord.time + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + chord.time + chord.dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(ctx.currentTime + chord.time);
          osc.stop(ctx.currentTime + chord.time + chord.dur + 0.05);
        });
      });
    } catch (e) {}
  }

  playGameComplete(isHighVictory: boolean = true) {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const notes = isHighVictory
        ? [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.5, 1567.98] // C5, E5, G5, B5, C6, E6, G6
        : [440, 554.37, 659.25, 880, 1108.73]; // Warm completion

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        const startT = ctx.currentTime + idx * 0.09;

        osc.frequency.setValueAtTime(freq, startT);
        gain.gain.setValueAtTime(0, startT);
        gain.gain.linearRampToValueAtTime(0.16, startT + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startT);
        osc.stop(startT + 0.5);
      });
    } catch (e) {}
  }

  playCountdownWarning(isUrgent: boolean = false) {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      if (isUrgent) {
        // High alert double-beep for <= 2 seconds
        [0, 0.07].forEach((delay) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1150, ctx.currentTime + delay);
          gain.gain.setValueAtTime(0.18, ctx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.05);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + delay);
          osc.stop(ctx.currentTime + delay + 0.06);
        });
      } else {
        // Moderate warning beep for 3-5 seconds
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(920, ctx.currentTime);
        gain.gain.setValueAtTime(0.14, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.08);
      }
    } catch (e) {}
  }

  playCardSelect() {
    this.playClick('bubble');
  }

  playBonus() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      [1046.5, 1318.5, 1567.98, 2093.0].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const st = ctx.currentTime + idx * 0.05;
        osc.frequency.setValueAtTime(freq, st);
        gain.gain.setValueAtTime(0.12, st);
        gain.gain.exponentialRampToValueAtTime(0.001, st + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(st);
        osc.stop(st + 0.26);
      });
    } catch (e) {}
  }

  playModalOpen() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(740, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  }

  playModalClose() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  }

  playCorrect() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.4);
      });
    } catch (e) {
      // Audio autoplay policy
    }
  }

  playWrong() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      [160, 150].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

        gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.32);
      });
    } catch (e) {}
  }

  playTick() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
  }

  playLifeline() {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const freqs = [440, 554.37, 659.25, 880, 1108.73];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.06);

        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.06);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + i * 0.06);
        osc.stop(ctx.currentTime + i * 0.06 + 0.45);
      });
    } catch (e) {}
  }

  playStreak(streakCount: number = 2) {
    if (this.isMuted) return;
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const baseFreq = Math.min(300 + streakCount * 60, 700);
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.8, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.36);
    } catch (e) {}
  }

  // --- GEMINI PCM 24kHz AUDIO PLAYBACK ---
  playPcmChunk(base64Data: string, onEnd?: () => void) {
    if (this.isMuted) {
      if (onEnd) onEnd();
      return;
    }

    try {
      const ctx = this.getPlaybackContext();
      const binary = atob(base64Data);

      // Check if it is a WAV container
      if (binary.startsWith('RIFF')) {
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        ctx.decodeAudioData(bytes.buffer.slice(0), (buffer) => {
          this.scheduleAudioBuffer(ctx, buffer, onEnd);
        });
        return;
      }

      // Raw 16-bit PCM Little Endian @ 24kHz
      const sampleCount = Math.floor(binary.length / 2);
      if (sampleCount <= 0) {
        if (onEnd) onEnd();
        return;
      }

      const buffer = ctx.createBuffer(1, sampleCount, 24000);
      const channelData = buffer.getChannelData(0);

      for (let i = 0; i < sampleCount; i++) {
        const byte1 = binary.charCodeAt(i * 2);
        const byte2 = binary.charCodeAt(i * 2 + 1);
        let val = (byte2 << 8) | byte1;
        if (val >= 0x8000) val -= 0x10000;
        channelData[i] = val / 32768.0;
      }

      this.scheduleAudioBuffer(ctx, buffer, onEnd);
    } catch {
      if (onEnd) onEnd();
    }
  }

  private scheduleAudioBuffer(ctx: AudioContext, buffer: AudioBuffer, onEnd?: () => void) {
    const now = ctx.currentTime;
    // Schedule gapless playback
    if (this.nextStartTime < now) {
      this.nextStartTime = now + 0.02;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    source.start(this.nextStartTime);
    this.activeSourceNodes.push(source);

    this.nextStartTime += buffer.duration;

    source.onended = () => {
      const idx = this.activeSourceNodes.indexOf(source);
      if (idx !== -1) {
        this.activeSourceNodes.splice(idx, 1);
      }
      if (onEnd && this.activeSourceNodes.length === 0) {
        onEnd();
      }
    };
  }

  stopAllPlayback() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    this.activeSourceNodes.forEach((node) => {
      try {
        node.stop();
      } catch (e) {}
    });
    this.activeSourceNodes = [];
    if (this.playbackCtx) {
      this.nextStartTime = this.playbackCtx.currentTime;
    }
  }

  speakWithBrowserTts(text: string, hostId: string = 'arya', onEnd?: () => void) {
    if (this.isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';

      // Tune voice pitch and rate according to each host persona
      switch (hostId) {
        case 'kiki':
          utterance.pitch = 1.3;
          utterance.rate = 1.15;
          break;
        case 'arya':
          utterance.pitch = 0.95;
          utterance.rate = 0.95;
          break;
        case 'roro':
          utterance.pitch = 1.05;
          utterance.rate = 0.92;
          break;
        case 'bintang':
          utterance.pitch = 0.85;
          utterance.rate = 1.05;
          break;
        case 'cyber':
          utterance.pitch = 1.25;
          utterance.rate = 1.05;
          break;
        default:
          utterance.pitch = 1.0;
          utterance.rate = 1.0;
      }

      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find((v) => v.lang.startsWith('id') || v.lang.includes('ID'));
      if (idVoice) {
        utterance.voice = idVoice;
      }

      utterance.onend = () => {
        if (onEnd) onEnd();
      };
      utterance.onerror = () => {
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      if (onEnd) onEnd();
    }
  }
}

export const sound = new SoundEngine();

// Microphone audio processing for Gemini Live API (16kHz PCM Little Endian)
export class MicStreamer {
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private isStreaming: boolean = false;
  private onAudioChunk: (base64Pcm: string) => void;

  constructor(onAudioChunk: (base64Pcm: string) => void) {
    this.onAudioChunk = onAudioChunk;
  }

  async start() {
    if (this.isStreaming) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass({ sampleRate: 16000 });
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      this.source = this.audioCtx.createMediaStreamSource(this.mediaStream);
      // ScriptProcessor with bufferSize 4096 (approx 250ms at 16kHz)
      this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.isStreaming) return;
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to 16-bit PCM little endian
        const buffer = new ArrayBuffer(inputData.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          const val = s < 0 ? s * 0x8000 : s * 0x7fff;
          view.setInt16(i * 2, val, true);
        }

        // Convert to Base64
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const sub = bytes.subarray(i, i + chunkSize);
          binary += String.fromCharCode.apply(null, sub as any);
        }
        const base64 = btoa(binary);
        this.onAudioChunk(base64);
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioCtx.destination);
      this.isStreaming = true;
    } catch (err) {
      throw err;
    }
  }

  stop() {
    this.isStreaming = false;
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }

  get active(): boolean {
    return this.isStreaming;
  }
}
