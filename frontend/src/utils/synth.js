/**
 * LifeReel AI - Web Audio API SciFi Sound Synthesizer
 */
export class SciFiSynth {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume context if suspended (browser security block)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Plays a sequential upward arpeggio chime sound for successful saves
  playConfirmChime() {
    this.init();
    const now = this.ctx.currentTime;
    
    this.createLaserPizz(220, now, 0.4); // A3
    this.createLaserPizz(440, now + 0.1, 0.5); // A4
    this.createLaserPizz(880, now + 0.2, 0.7); // A5
  }

  // Plays a soft mechanical synthesizer click sound for buttons
  playClick() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.05);
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // Generates a soft digital synthesizer drone for memory details playbacks
  playDrone(duration, onTimeUpdate, onEnded) {
    this.init();
    const now = this.ctx.currentTime;
    
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gainNode = this.ctx.createGain();
    
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(110, now); // A2
    osc1.frequency.exponentialRampToValueAtTime(112, now + duration / 2);
    osc1.frequency.exponentialRampToValueAtTime(108, now + duration);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(165, now); // E3
    
    // Warm low pass filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(500, now + duration / 2);
    filter.frequency.exponentialRampToValueAtTime(250, now + duration);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 1.2);
    gainNode.gain.setValueAtTime(0.3, now + duration - 1.5);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed >= duration) {
        clearInterval(interval);
        if (onEnded) onEnded();
      } else {
        if (onTimeUpdate) onTimeUpdate(elapsed);
      }
    }, 100);

    return {
      stop: () => {
        clearInterval(interval);
        try {
          osc1.stop();
          osc2.stop();
        } catch (e) {}
      }
    };
  }

  createLaserPizz(freq, time, duration) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(10, time + duration); // Laser sweep down
    
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.2, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(time);
    osc.stop(time + duration);
  }
}

export const synth = new SciFiSynth();
