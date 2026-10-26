import { InstrumentType } from '../types';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterFilter: BiquadFilterNode | null = null;
  private masterDistortion: WaveShaperNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    // Context is initialized on user interaction
  }

  public init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create Nodes
      this.masterGain = this.ctx.createGain();
      this.masterFilter = this.ctx.createBiquadFilter();
      this.masterDistortion = this.ctx.createWaveShaper();

      // Configure Nodes
      this.masterGain.gain.value = 0.5; // Avoid clipping
      
      this.masterFilter.type = 'lowpass';
      this.masterFilter.frequency.value = 20000; // Open by default
      this.masterFilter.Q.value = 0;

      this.masterDistortion.curve = this.makeDistortionCurve(0);
      this.masterDistortion.oversample = '4x';

      // Chain: Sources -> MasterGain -> Distortion -> Filter -> Destination
      this.masterGain.connect(this.masterDistortion);
      this.masterDistortion.connect(this.masterFilter);
      this.masterFilter.connect(this.ctx.destination);

      this.createNoiseBuffer();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Effect Control Methods
  public setFilter(frequencyPercent: number, resonancePercent: number) {
    if (!this.masterFilter) return;
    
    // Map 0-100 to Frequency (Logarithmic-ish feel)
    // Min 50Hz, Max 20000Hz
    const minValue = 50;
    const maxValue = 20000;
    // Simple exponential mapping approximation
    const freq = minValue * Math.pow(maxValue / minValue, frequencyPercent / 100);
    
    // Map 0-100 to Q (0 - 20)
    const q = (resonancePercent / 100) * 20;

    // Ramp smoothly to prevent zipper noise
    const t = this.ctx!.currentTime;
    this.masterFilter.frequency.setTargetAtTime(freq, t, 0.05);
    this.masterFilter.Q.setTargetAtTime(q, t, 0.05);
  }

  public setDistortion(amountPercent: number) {
    if (!this.masterDistortion) return;
    this.masterDistortion.curve = this.makeDistortionCurve(amountPercent);
  }

  private makeDistortionCurve(amount: number) {
    const k = amount * 5; // Scaling factor
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    
    if (amount === 0) {
      for (let i = 0; i < n_samples; ++i) {
        curve[i] = (i * 2) / n_samples - 1; // Linear response
      }
    } else {
      for (let i = 0; i < n_samples; ++i) {
        const x = (i * 2) / n_samples - 1;
        // Soft clipping sigmoid
        curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
      }
    }
    return curve;
  }

  private createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  public playSound(type: InstrumentType, pitch: number = 440) {
    if (!this.ctx || !this.masterGain) {
      this.init();
      if (!this.ctx || !this.masterGain) return;
    }

    const t = this.ctx.currentTime;

    switch (type) {
      case 'kick': this.playKick(t); break;
      case 'snare': this.playSnare(t); break;
      case 'hihat': this.playHiHat(t); break;
      case 'tom': this.playTom(t); break;
      case 'bass': this.playTone(t, 'triangle', pitch, 0.2); break;
      case 'lead': this.playTone(t, 'square', pitch, 0.15); break;
      case 'arpeggio': this.playArpeggio(t, pitch); break;
      case 'coin': this.playCoin(t); break;
      case 'jump': this.playJump(t); break;
      case 'laser': this.playLaser(t); break;
    }
  }

  private playKick(t: number) {
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.5);

    gain.gain.setValueAtTime(1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

    osc.start(t);
    osc.stop(t + 0.5);
  }

  private playSnare(t: number) {
    // Noise part
    const noise = this.ctx!.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const noiseFilter = this.ctx!.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    const noiseGain = this.ctx!.createGain();
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain!);

    noiseGain.gain.setValueAtTime(1, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    noise.start(t);
    noise.stop(t + 0.2);

    // Tone part
    const osc = this.ctx!.createOscillator();
    osc.type = 'triangle';
    const oscGain = this.ctx!.createGain();
    osc.connect(oscGain);
    oscGain.connect(this.masterGain!);
    
    osc.frequency.setValueAtTime(250, t); // Higher start
    osc.frequency.linearRampToValueAtTime(100, t + 0.1); // Drop

    oscGain.gain.setValueAtTime(0.5, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    
    osc.start(t);
    osc.stop(t + 0.2);
  }

  private playHiHat(t: number) {
    const src = this.ctx!.createBufferSource();
    src.buffer = this.noiseBuffer;
    
    const filter = this.ctx!.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;

    const gain = this.ctx!.createGain();
    
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

    src.start(t);
    src.stop(t + 0.05);
  }

  private playTom(t: number) {
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.3);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  private playTone(t: number, type: OscillatorType, freq: number, duration: number) {
    const osc = this.ctx!.createOscillator();
    osc.type = type;
    const gain = this.ctx!.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.frequency.setValueAtTime(freq, t);
    
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0.3, t + duration * 0.8);
    gain.gain.linearRampToValueAtTime(0, t + duration);

    osc.start(t);
    osc.stop(t + duration);
  }

  private playCoin(t: number) {
    const osc = this.ctx!.createOscillator();
    osc.type = 'square';
    const gain = this.ctx!.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain!);

    // B5 (987.77) -> E6 (1318.51)
    osc.frequency.setValueAtTime(987.77, t);
    osc.frequency.setValueAtTime(1318.51, t + 0.1);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.setValueAtTime(0.1, t + 0.4);
    gain.gain.linearRampToValueAtTime(0, t + 0.5);

    osc.start(t);
    osc.stop(t + 0.5);
  }

  private playJump(t: number) {
    const osc = this.ctx!.createOscillator();
    osc.type = 'square';
    const gain = this.ctx!.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.frequency.setValueAtTime(150, t);
    osc.frequency.linearRampToValueAtTime(450, t + 0.2);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.2);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  private playLaser(t: number) {
    const osc = this.ctx!.createOscillator();
    osc.type = 'sawtooth';
    const gain = this.ctx!.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.2);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.2);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  private playArpeggio(t: number, baseFreq: number) {
    // Quick major triad
    this.playTone(t, 'square', baseFreq, 0.1);
    this.playTone(t + 0.1, 'square', baseFreq * 1.25, 0.1); // Major 3rd
    this.playTone(t + 0.2, 'square', baseFreq * 1.5, 0.1);  // Perfect 5th
  }
}

export const audioEngine = new AudioEngine();