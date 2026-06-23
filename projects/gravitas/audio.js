// Procedural Web Audio Synthesizer

export class AudioController {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.droneGain = null;
    this.isEnabled = false;
    
    // Ambient drone components
    this.osc1 = null;
    this.osc2 = null;
    this.lfo = null;
    this.lfoGain = null;
    this.lowpass = null;
  }

  // Initialize the Web Audio API (Must be triggered by user gesture)
  async init() {
    if (this.ctx) return; // Already initialized

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime); // Low baseline volume
      this.masterGain.connect(this.ctx.destination);
      
      // Setup Ambient Space Drone
      this.setupDrone();
      
      this.isEnabled = true;
      console.log('Gravitas sound system initialized.');
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  // Configure a low-pitch dual-oscillator space drone
  setupDrone() {
    if (!this.ctx) return;

    // Master drone gain
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.08, this.ctx.currentTime); // Subtle background
    this.droneGain.connect(this.masterGain);

    // Filter to keep it warm and subby
    this.lowpass = this.ctx.createBiquadFilter();
    this.lowpass.type = 'lowpass';
    this.lowpass.frequency.setValueAtTime(150, this.ctx.currentTime);
    this.lowpass.connect(this.droneGain);

    // Osc 1: Base low pitch drone (55Hz / A1)
    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = 'sawtooth';
    this.osc1.frequency.setValueAtTime(55.0, this.ctx.currentTime);
    this.osc1.connect(this.lowpass);

    // Osc 2: Detuned fifth (82.4Hz / E2) for complexity
    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = 'triangle';
    this.osc2.frequency.setValueAtTime(82.4, this.ctx.currentTime);
    this.osc2.connect(this.lowpass);

    // LFO to slowly modulate filter cutoff (simulating cosmic breathing)
    this.lfo = this.ctx.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime); // Extremely slow: 12 seconds per cycle

    this.lfoGain = this.ctx.createGain();
    this.lfoGain.gain.setValueAtTime(60, this.ctx.currentTime); // Modulate by 60Hz

    // Connect LFO
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.lowpass.frequency);

    // Start all
    this.osc1.start();
    this.osc2.start();
    this.lfo.start();
  }

  // Adjust master volume (0.0 to 1.0)
  setVolume(val) {
    if (!this.ctx || !this.masterGain) return;
    this.masterGain.gain.linearRampToValueAtTime(val * 0.5, this.ctx.currentTime + 0.1);
  }

  // Enable/disable the ambient drone
  toggleDrone(state) {
    if (!this.ctx || !this.droneGain) return;
    const target = state ? 0.08 : 0.0;
    this.droneGain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.5);
  }

  // Synthesize dynamic sounds on physical events
  triggerSound(type, mass) {
    if (!this.ctx || this.ctx.state === 'suspended' || !this.isEnabled) return;

    const now = this.ctx.currentTime;
    
    // Scale pitch based on object mass (Lighter = higher pitch, Heavier = deeper pitch)
    const pitchFactor = Math.max(0.1, 1 - Math.min(mass / 10000, 0.9)); // Range 0.1 to 1.0

    switch (type) {
      case 'collision': {
        // High-pitched crystal chime
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        const baseFreq = 400 + pitchFactor * 600; // 400Hz - 1000Hz
        osc.frequency.setValueAtTime(baseFreq, now);
        
        // Ring modulator style harmonic frequency
        const oscHarmonic = this.ctx.createOscillator();
        oscHarmonic.type = 'triangle';
        oscHarmonic.frequency.setValueAtTime(baseFreq * 1.5, now);
        
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8); // 800ms decay
        
        osc.connect(gain);
        oscHarmonic.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(now);
        oscHarmonic.start(now);
        
        osc.stop(now + 0.8);
        oscHarmonic.stop(now + 0.8);
        break;
      }
      
      case 'merge': {
        // Celestial sweep downwards (accretion)
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        const startFreq = 220 + pitchFactor * 330; // 220Hz - 550Hz
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.6); // Sweep down

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(startFreq * 2, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.6);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.6);
        break;
      }

      case 'destroy': {
        // Disintegration crash (white noise bandpass filter sweep)
        const noiseLength = 0.5; // seconds
        const bufferSize = this.ctx.sampleRate * noiseLength;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate white noise buffer
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noiseNode = this.ctx.createBufferSource();
        noiseNode.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.setValueAtTime(3.0, now);
        filter.frequency.setValueAtTime(800 * pitchFactor + 200, now);
        filter.frequency.exponentialRampToValueAtTime(60, now + noiseLength);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + noiseLength);

        noiseNode.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noiseNode.start(now);
        noiseNode.stop(now + noiseLength);
        break;
      }

      case 'blackhole': {
        // Black Hole swallow sub wobble
        const osc = this.ctx.createOscillator();
        const wobble = this.ctx.createOscillator();
        const wobbleGain = this.ctx.createGain();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(32.7, now + 1.2); // sweep down to C1 sub-bass

        wobble.type = 'sine';
        wobble.frequency.setValueAtTime(14, now); // 14Hz wobble

        wobbleGain.gain.setValueAtTime(15, now); // wobble frequency by 15Hz

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        wobble.connect(wobbleGain);
        wobbleGain.connect(osc.frequency);
        
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        wobble.start(now);
        
        osc.stop(now + 1.2);
        wobble.stop(now + 1.2);
        break;
      }
    }
  }

  // Resume context if suspended
  async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
      this.toggleDrone(true);
    }
  }

  // Suspend context
  async suspend() {
    if (this.ctx && this.ctx.state === 'running') {
      this.toggleDrone(false);
      // Wait for drone to fade out before suspending
      setTimeout(async () => {
        if (this.ctx && this.ctx.state === 'running') {
          await this.ctx.suspend();
        }
      }, 500);
    }
  }
}
