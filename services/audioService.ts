
class AudioService {
  private ctx: AudioContext | null = null;

  public init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1, startTime: number = 0) {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);
    
    gain.gain.setValueAtTime(volume, this.ctx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + startTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(this.ctx.currentTime + startTime);
    osc.stop(this.ctx.currentTime + startTime + duration);
  }

  private playNoise(duration: number, volume: number = 0.1, startTime: number = 0) {
    this.init();
    if (!this.ctx) return;
    
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + startTime + duration);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    noise.start(this.ctx.currentTime + startTime);
  }

  playFlip() {
    this.playTone(400, 'sine', 0.1, 0.05);
  }

  playMatch() {
    this.playTone(523.25, 'sine', 0.4, 0.1); 
    this.playTone(659.25, 'sine', 0.4, 0.1, 0.1);
  }

  playCorrectAnswer() {
    this.playTone(523.25, 'triangle', 0.5, 0.1);
    this.playTone(659.25, 'triangle', 0.5, 0.1, 0.1);
    this.playTone(783.99, 'triangle', 0.5, 0.1, 0.2);
    this.playTone(1046.50, 'triangle', 0.8, 0.1, 0.3);

    for (let i = 0; i < 15; i++) {
      const start = 0.1 + (i * 0.07) + (Math.random() * 0.04);
      this.playNoise(0.12, 0.06, start);
    }
  }

  playWrongAnswer() {
    this.playTone(150, 'sawtooth', 0.4, 0.1);
    this.playTone(110, 'sawtooth', 0.6, 0.1, 0.1);
  }

  playTick() {
    this.playTone(800, 'sine', 0.05, 0.05);
  }

  playTada() {
    this.playTone(659.25, 'square', 0.3, 0.05);
    this.playTone(880, 'square', 0.5, 0.05, 0.1);
  }

  playWrong() {
    this.playTone(200, 'sawtooth', 0.3, 0.05);
    this.playTone(150, 'sawtooth', 0.3, 0.05, 0.15);
  }

  playVictory() {
    const melody = [523, 659, 783, 1046, 783, 659, 1046, 1318, 1567, 1046];
    melody.forEach((freq, i) => {
      this.playTone(freq, 'square', 0.5, 0.03, i * 0.15);
    });
    
    for (let i = 0; i < 30; i++) {
      const start = 0.5 + (i * 0.08);
      this.playNoise(0.15, 0.04, start);
    }
  }
}

export const audioService = new AudioService();
