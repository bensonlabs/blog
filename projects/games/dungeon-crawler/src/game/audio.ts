/**
 * Web Audio API procedural sound synthesizer for dungeon ambience, combat, and mythical encounters.
 * Hardened with defensive error boundaries and safe envelope ramping.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private sfxVolume: number = 0.6;
  private musicVolume: number = 0.3;
  private bgmInterval: number | null = null;
  private isBgmPlaying: boolean = false;

  private initContext(): AudioContext | null {
    try {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      this.ctx = null;
      return null;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopDungeonAmbience();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(sfx: number, music: number) {
    this.sfxVolume = Math.max(0, Math.min(1, sfx));
    this.musicVolume = Math.max(0, Math.min(1, music));
  }

  // --- Sound Effects ---

  public playFootstep() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80 + Math.random() * 20, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(30, ctx.currentTime + 0.05);

      filter.type = 'lowpass';
      filter.frequency.value = 250;

      const vol = Math.max(0.0001, 0.08 * this.sfxVolume);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.05);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch {
      // Audio fallback
    }
  }

  public playSwing() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const bufferSize = Math.floor(ctx.sampleRate * 0.12);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.12);
      filter.Q.value = 3;

      const gain = ctx.createGain();
      const vol = Math.max(0.0001, 0.25 * this.sfxVolume);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
    } catch {
      // Audio fallback
    }
  }

  public playHit() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.15);

      const vol = Math.max(0.0001, 0.3 * this.sfxVolume);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {
      // Audio fallback
    }
  }

  public playShieldRaise() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(540, ctx.currentTime + 0.12);

      const vol = Math.max(0.0001, 0.22 * this.sfxVolume);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {
      // Audio fallback
    }
  }

  public playShieldBlock() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      // Resonant metal clang
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(780, ctx.currentTime);
      osc1.frequency.linearRampToValueAtTime(320, ctx.currentTime + 0.2);

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(1120, ctx.currentTime);
      osc2.frequency.linearRampToValueAtTime(450, ctx.currentTime + 0.15);

      const vol = Math.max(0.0001, 0.35 * this.sfxVolume);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.25);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.26);
      osc2.stop(ctx.currentTime + 0.26);
    } catch {
      // Audio fallback
    }
  }

  public playCritHit() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.08);

      const vol = Math.max(0.0001, 0.35 * this.sfxVolume);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.21);
    } catch {
      // Audio fallback
    }
  }

  public playDash() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(120, ctx.currentTime + 0.15);

      const vol = Math.max(0.0001, 0.25 * this.sfxVolume);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {
      // Audio fallback
    }
  }

  public playSpellCast(type: 'fire' | 'frost' | 'arcane' | 'lightning') {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'fire') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.3);
      } else if (type === 'frost') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.25);
      } else if (type === 'arcane') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(320, ctx.currentTime + 0.2);
      } else {
        osc.type = 'square';
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.18);
      }

      const vol = Math.max(0.0001, 0.25 * this.sfxVolume);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.31);
    } catch {
      // Audio fallback
    }
  }

  public playMonsterRoar(tier: 'minion' | 'elite' | 'boss') {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      const startFreq = tier === 'boss' ? 75 : tier === 'elite' ? 110 : 160;
      osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(startFreq * 0.5, ctx.currentTime + 0.4);

      const vol = Math.max(0.0001, (tier === 'boss' ? 0.45 : 0.28) * this.sfxVolume);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.46);
    } catch {
      // Audio fallback
    }
  }

  public playChestOpen() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(620, ctx.currentTime + 0.25);

      const vol = Math.max(0.0001, 0.3 * this.sfxVolume);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.31);
    } catch {
      // Audio fallback
    }
  }

  public playEquip() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(480, ctx.currentTime + 0.1);

      const vol = Math.max(0.0001, 0.25 * this.sfxVolume);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {
      // Audio fallback
    }
  }

  public playUnequip() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(480, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.1);

      const vol = Math.max(0.0001, 0.25 * this.sfxVolume);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {
      // Audio fallback
    }
  }

  public playDrop() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.1);

      const vol = Math.max(0.0001, 0.2 * this.sfxVolume);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch {
      // Audio fallback
    }
  }

  public playDismantle() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.18);

      const vol = Math.max(0.0001, 0.25 * this.sfxVolume);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.21);
    } catch {
      // Audio fallback
    }
  }

  public playInventoryFull() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.12);

      const vol = Math.max(0.0001, 0.25 * this.sfxVolume);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {
      // Audio fallback
    }
  }

  public playPickup(rarity?: string) {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const baseF = rarity === 'mythic' ? 660 : rarity === 'epic' ? 520 : 440;
      osc.frequency.setValueAtTime(baseF, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(baseF * 1.5, ctx.currentTime + 0.15);

      const vol = Math.max(0.0001, 0.28 * this.sfxVolume);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.21);
    } catch {
      // Audio fallback
    }
  }

  public playPotion() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.2);

      const vol = Math.max(0.0001, 0.25 * this.sfxVolume);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.23);
    } catch {
      // Audio fallback
    }
  }

  public playLevelUp() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const chord = [523.25, 659.25, 783.99, 1046.5]; // C Major
      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        const vol = Math.max(0.0001, 0.3 * this.sfxVolume);
        gain.gain.setValueAtTime(vol, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.0001, now + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + 0.85);
      });
    } catch {
      // Audio fallback
    }
  }

  public playStairs() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [600, 500, 400, 300, 200];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        const vol = Math.max(0.0001, 0.2 * this.sfxVolume);
        gain.gain.setValueAtTime(vol, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.0001, now + idx * 0.08 + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.16);
      });
    } catch {
      // Audio fallback
    }
  }

  public playGameOver() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [300, 280, 260, 220, 150];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.18);

        const vol = Math.max(0.0001, 0.3 * this.sfxVolume);
        gain.gain.setValueAtTime(vol, now + idx * 0.18);
        gain.gain.linearRampToValueAtTime(0.0001, now + idx * 0.18 + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.18);
        osc.stop(now + idx * 0.18 + 0.35);
      });
    } catch {
      // Audio fallback
    }
  }

  // --- Procedural Ambient Background Music ---

  public startDungeonAmbience(isBoss: boolean = false) {
    if (this.isBgmPlaying) {
      this.stopDungeonAmbience();
    }
    this.isBgmPlaying = true;
    const ctx = this.initContext();
    if (!ctx) return;

    const scale = isBoss
      ? [110, 116.54, 130.81, 146.83, 155.56, 174.61, 196.0] // Phrygian dark boss scale
      : [130.81, 146.83, 155.56, 174.61, 196.0, 207.65, 233.08]; // Aeolian minor

    let step = 0;
    this.bgmInterval = window.setInterval(() => {
      try {
        if (this.isMuted || !this.ctx) return;

        const now = this.ctx.currentTime;
        // Ambient bass drone
        if (step % 4 === 0) {
          const droneOsc = this.ctx.createOscillator();
          const droneGain = this.ctx.createGain();
          const filter = this.ctx.createBiquadFilter();

          droneOsc.type = isBoss ? 'sawtooth' : 'triangle';
          droneOsc.frequency.setValueAtTime(scale[0] / 2, now);

          filter.type = 'lowpass';
          filter.frequency.value = isBoss ? 400 : 250;

          const vol = Math.max(0.0001, 0.12 * this.musicVolume);
          droneGain.gain.setValueAtTime(vol, now);
          droneGain.gain.linearRampToValueAtTime(0.0001, now + 3.8);

          droneOsc.connect(filter);
          filter.connect(droneGain);
          droneGain.connect(this.ctx.destination);

          droneOsc.start(now);
          droneOsc.stop(now + 4.0);
        }

        // Random eerie melody note
        if (Math.random() > (isBoss ? 0.2 : 0.45)) {
          const noteIdx = Math.floor(Math.random() * scale.length);
          const freq = scale[noteIdx] * (Math.random() > 0.6 ? 2 : 1);

          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = isBoss ? 'sawtooth' : 'sine';
          osc.frequency.setValueAtTime(freq, now);

          const vol = Math.max(0.0001, 0.08 * this.musicVolume);
          gain.gain.setValueAtTime(vol, now);
          gain.gain.linearRampToValueAtTime(0.0001, now + (isBoss ? 0.8 : 1.8));

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + 2.0);
        }

        step++;
      } catch {
        // Safe catch for interval ticks
      }
    }, isBoss ? 600 : 1200);
  }

  public stopDungeonAmbience() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.isBgmPlaying = false;
  }
}

export const sound = new SoundEngine();
