import { GameSettings } from '../types/game';

/**
 * Procedural Mild Eerie Horror Soundtrack & Sound Effects Engine
 * Synthesizes a subtle haunted celesta/music-box motif over a quiet sub-harmonium drone,
 * plus Husk decay whispers, predictive shutter snaps, and false-hope chimes.
 */
class EerieSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicFilter: BiquadFilterNode | null = null;

  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneLfo: OscillatorNode | null = null;
  private musicTimer: number | null = null;

  private isInitialized = false;
  private settings: GameSettings = {
    masterVolume: 0.55,
    musicVolume: 0.45,
    muted: false,
    cameraParallax: true,
    reducedMotion: false,
  };

  private rageRatio = 0.1;
  private pokerActive = false;
  private noteStep = 0;

  // Haunting D-harmonic-minor / Phrygian music-box motif (Hz)
  private readonly eerieMotif = [
    293.66, // D4
    349.23, // F4
    440.00, // A4
    466.16, // Bb4
    440.00, // A4
    392.00, // G4
    349.23, // F4
    277.18, // C#4
    293.66, // D4
    311.13, // Eb4 (Phrygian unease)
    440.00, // A4
    466.16, // Bb4
    587.33, // D5
    554.37, // C#5
    466.16, // Bb4
    349.23, // F4
  ];

  public applySettings(settings: GameSettings): void {
    this.settings = { ...settings };
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const effectiveMaster = settings.muted ? 0 : settings.masterVolume * 0.62;
    this.masterGain.gain.setTargetAtTime(effectiveMaster, now, 0.08);
    this.musicGain.gain.setTargetAtTime(settings.musicVolume * 0.35, now, 0.12);
    this.sfxGain.gain.setTargetAtTime(0.75, now, 0.08);
  }

  public unlock(): void {
    if (!this.isInitialized) {
      this.initContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private initContext(): void {
    if (this.isInitialized) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicFilter = this.ctx.createBiquadFilter();

      this.musicFilter.type = 'lowpass';
      this.musicFilter.frequency.value = 940;
      this.musicFilter.Q.value = 0.75;

      const effectiveMaster = this.settings.muted ? 0 : this.settings.masterVolume * 0.62;
      this.masterGain.gain.value = effectiveMaster;
      this.musicGain.gain.value = this.settings.musicVolume * 0.35;
      this.sfxGain.gain.value = 0.75;

      const delay = this.ctx.createDelay(1.0);
      delay.delayTime.value = 0.44;
      const delayFeedback = this.ctx.createGain();
      delayFeedback.gain.value = 0.3;
      const delayFilter = this.ctx.createBiquadFilter();
      delayFilter.type = 'lowpass';
      delayFilter.frequency.value = 680;

      this.musicFilter.connect(this.musicGain);
      this.musicFilter.connect(delay);
      delay.connect(delayFilter);
      delayFilter.connect(delayFeedback);
      delayFeedback.connect(delay);
      delayFilter.connect(this.musicGain);

      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.startMildEerieAmbience();
      this.isInitialized = true;
    } catch {
      // Fallback if Web Audio blocked
    }
  }

  private startMildEerieAmbience(): void {
    if (!this.ctx || !this.musicFilter) return;

    const droneSubGain = this.ctx.createGain();
    droneSubGain.gain.value = 0.13;

    const droneLowpass = this.ctx.createBiquadFilter();
    droneLowpass.type = 'lowpass';
    droneLowpass.frequency.value = 200;

    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc1.type = 'sine';
    this.droneOsc1.frequency.value = 73.42; // D2

    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc2.type = 'triangle';
    this.droneOsc2.frequency.value = 110.0; // A2
    this.droneOsc2.detune.value = -5;

    this.droneLfo = this.ctx.createOscillator();
    this.droneLfo.type = 'sine';
    this.droneLfo.frequency.value = 0.1;
    const lfoDepth = this.ctx.createGain();
    lfoDepth.gain.value = 60;

    this.droneLfo.connect(lfoDepth);
    lfoDepth.connect(droneLowpass.frequency);

    this.droneOsc1.connect(droneLowpass);
    this.droneOsc2.connect(droneLowpass);
    droneLowpass.connect(droneSubGain);
    droneSubGain.connect(this.musicFilter);

    this.droneOsc1.start();
    this.droneOsc2.start();
    this.droneLfo.start();

    const scheduleNextNote = () => {
      if (!this.ctx || !this.musicFilter) return;
      if (this.ctx.state === 'running' && !this.settings.muted) {
        this.playEerieMusicBoxPluck();
      }
      const baseInterval = 1580 - this.rageRatio * 340;
      const jitter = (Math.random() - 0.5) * 460;
      this.musicTimer = window.setTimeout(scheduleNextNote, Math.max(880, baseInterval + jitter));
    };

    this.musicTimer = window.setTimeout(scheduleNextNote, 800);
  }

  private playEerieMusicBoxPluck(): void {
    if (!this.ctx || !this.musicFilter) return;
    const now = this.ctx.currentTime;

    const baseFreq = this.eerieMotif[this.noteStep % this.eerieMotif.length];
    this.noteStep++;

    if (this.noteStep % 7 === 0 && Math.random() < 0.4) return;

    // Warped detune increases subtly as the House becomes agitated/entertained
    const detuneCents = (Math.random() - 0.5) * (8 + this.rageRatio * 26);

    const osc = this.ctx.createOscillator();
    const harmonic = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    const harmonicGain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.detune.setValueAtTime(detuneCents, now);

    harmonic.type = 'sine';
    harmonic.frequency.setValueAtTime(baseFreq * 3, now);
    harmonicGain.gain.setValueAtTime(0.055, now);
    harmonicGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(0.125, now + 0.025);
    env.gain.exponentialRampToValueAtTime(0.0008, now + 2.1);

    osc.connect(env);
    harmonic.connect(harmonicGain);
    harmonicGain.connect(env);
    env.connect(this.musicFilter);

    osc.start(now);
    harmonic.start(now);
    osc.stop(now + 2.2);
    harmonic.stop(now + 0.36);

    if (this.rageRatio > 0.38 && Math.random() < 0.34) {
      const ghostOsc = this.ctx.createOscillator();
      const ghostEnv = this.ctx.createGain();
      ghostOsc.type = 'sine';
      ghostOsc.frequency.setValueAtTime(baseFreq * 1.05946, now + 0.26);
      ghostEnv.gain.setValueAtTime(0.0001, now + 0.26);
      ghostEnv.gain.linearRampToValueAtTime(0.045, now + 0.33);
      ghostEnv.gain.exponentialRampToValueAtTime(0.0008, now + 1.35);
      ghostOsc.connect(ghostEnv);
      ghostEnv.connect(this.musicFilter);
      ghostOsc.start(now + 0.26);
      ghostOsc.stop(now + 1.4);
    }
  }

  public setPsychologicalState(rageIndex: number, pokerFaceActive: boolean): void {
    this.rageRatio = Math.max(0, Math.min(1, rageIndex / 100));
    if (this.pokerActive !== pokerFaceActive) {
      this.pokerActive = pokerFaceActive;
      if (this.ctx && this.musicFilter) {
        const now = this.ctx.currentTime;
        this.musicFilter.frequency.setTargetAtTime(pokerFaceActive ? 360 : 940, now, 0.14);
      }
    }
  }

  public playFootstep(): void {
    if (!this.ctx || !this.sfxGain || this.settings.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(92 + Math.random() * 24, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.065);
    env.gain.setValueAtTime(0.085, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.075);
  }

  public playJump(): void {
    if (!this.ctx || !this.sfxGain || this.settings.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(148, now);
    osc.frequency.exponentialRampToValueAtTime(288, now + 0.12);
    env.gain.setValueAtTime(0.075, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playLand(impact = 0.5): void {
    if (!this.ctx || !this.sfxGain || this.settings.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(86, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.1);
    env.gain.setValueAtTime(Math.min(0.15, 0.055 + impact * 0.08), now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playDeathAndHusk(): void {
    if (!this.ctx || !this.sfxGain || this.settings.muted) return;
    const now = this.ctx.currentTime;
    const freqs = [146.83, 207.65, 293.66];
    freqs.forEach((f, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.04);
      osc.frequency.exponentialRampToValueAtTime(f * 0.98, now + 1.05);
      env.gain.setValueAtTime(0.001, now + idx * 0.04);
      env.gain.linearRampToValueAtTime(0.105 / (idx + 1), now + idx * 0.04 + 0.02);
      env.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
      osc.connect(env);
      env.connect(this.sfxGain);
      osc.start(now + idx * 0.04);
      osc.stop(now + 1.15);
    });
  }

  public playHuskDissolve(): void {
    if (!this.ctx || !this.sfxGain || this.settings.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(310, now);
    osc.frequency.exponentialRampToValueAtTime(78, now + 0.34);
    env.gain.setValueAtTime(0.09, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  public playTrapSnap(): void {
    if (!this.ctx || !this.sfxGain || this.settings.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sawtooth';
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    osc.frequency.setValueAtTime(195, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.16);
    env.gain.setValueAtTime(0.13, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
    osc.connect(filter);
    filter.connect(env);
    env.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playSwitchClick(activated: boolean): void {
    if (!this.ctx || !this.sfxGain || this.settings.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(activated ? 320 : 235, now);
    osc.frequency.setValueAtTime(activated ? 430 : 190, now + 0.045);
    env.gain.setValueAtTime(0.095, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Ambiguous eerie Ghost tone (no obvious pleasant/harsh giveaway!)
  public playGhostWhisper(): void {
    if (!this.ctx || !this.sfxGain || this.settings.muted) return;
    const now = this.ctx.currentTime;
    const notes = [349.23, 440.0]; // Haunting open fourth/third shimmer
    notes.forEach((f, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.08);
      osc.frequency.linearRampToValueAtTime(f * 0.992, now + i * 0.08 + 0.6);
      env.gain.setValueAtTime(0.001, now + i * 0.08);
      env.gain.linearRampToValueAtTime(0.07, now + i * 0.08 + 0.05);
      env.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.65);
      osc.connect(env);
      env.connect(this.sfxGain);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.7);
    });
  }

  public playMemoryChime(): void {
    if (!this.ctx || !this.sfxGain || this.settings.muted) return;
    const now = this.ctx.currentTime;
    const chord = [293.66, 349.23, 440.0, 587.33];
    chord.forEach((f, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.08);
      env.gain.setValueAtTime(0.001, now + i * 0.08);
      env.gain.linearRampToValueAtTime(0.085, now + i * 0.08 + 0.04);
      env.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 1.35);
      osc.connect(env);
      env.connect(this.sfxGain);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 1.4);
    });
  }

  public playFakeWinFanfare(): void {
    if (!this.ctx || !this.sfxGain || this.settings.muted) return;
    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.0, 523.25];
    notes.forEach((f, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.11);
      if (i === 3) {
        osc.frequency.linearRampToValueAtTime(466.16, now + i * 0.11 + 0.75);
      }
      env.gain.setValueAtTime(0.09, now + i * 0.11);
      env.gain.exponentialRampToValueAtTime(0.001, now + i * 0.11 + 0.9);
      osc.connect(env);
      env.connect(this.sfxGain);
      osc.start(now + i * 0.11);
      osc.stop(now + i * 0.11 + 0.95);
    });
  }

  public playUIGlitchTick(): void {
    if (!this.ctx || !this.sfxGain || this.settings.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(490, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.05);
    env.gain.setValueAtTime(0.055, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }
}

export const soundEngine = new EerieSoundEngine();
