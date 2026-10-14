class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled = true;

  public init(): void {
    if (!this.enabled || typeof window === 'undefined') return;
    if (!this.ctx) {
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
  }

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      this.init();
    }
    return this.ctx;
  }

  public playJump(): void {
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.14);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Ignore audio errors
    }
  }

  public playLightningDash(): void {
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.22);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    } catch {
      // Ignore audio errors
    }
  }

  public playTimeShift(): void {
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const notes = [330, 440, 659.25];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.09, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.36);
      });
    } catch {
      // Ignore audio errors
    }
  }

  public playNovaBlast(): void {
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(48, now + 0.55);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.58);
    } catch {
      // Ignore audio errors
    }
  }

  public playBossRoar(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    try {
      const now = ctx.currentTime;
      const freqs = [95, 72, 54];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f * 1.4, now + idx * 0.08);
        osc.frequency.exponentialRampToValueAtTime(f * 0.65, now + 1.25);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.14, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.35);
      });
    } catch {
      // Ignore audio errors
    }
  }

  public playBossSlam(): void {
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.5);

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.56);
    } catch {
      // Ignore audio errors
    }
  }

  public playSplash(): void {
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.25);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch {
      // Ignore audio errors
    }
  }

  public playSwordSwing(): void {
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.16);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.17);
    } catch {
      // Ignore audio errors
    }
  }

  public playBowDraw(): void {
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.linearRampToValueAtTime(210, now + 0.45);

      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.48);
    } catch {
      // Ignore audio errors
    }
  }

  public playBowShoot(): void {
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);

      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // Ignore audio errors
    }
  }

  public playEnemyHit(killed = false): void {
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(killed ? 280 : 190, now);
      osc.frequency.exponentialRampToValueAtTime(killed ? 560 : 85, now + 0.18);

      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.19);
    } catch {
      // Ignore audio errors
    }
  }

  public playPlayerHurt(): void {
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(135, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.22);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    } catch {
      // Ignore audio errors
    }
  }

  public playPickupAmmo(): void {
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.14);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // Ignore audio errors
    }
  }

  public playOrbCollect(orbCount: number): void {
    const ctx = this.getContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    try {
      const now = ctx.currentTime;
      const baseFreq = 440 + orbCount * 40;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.28);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    } catch {
      // Ignore audio errors
    }
  }

  public playCinematicChord(step = 0, isFinale = false): void {
    const ctx = this.getContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    try {
      const now = ctx.currentTime;
      const chords = isFinale
        ? [
            [261.63, 329.63, 392.0, 523.25],
            [293.66, 369.99, 440.0, 587.33],
            [329.63, 415.3, 493.88, 659.25],
            [392.0, 493.88, 587.33, 783.99],
          ]
        : [
            [220.0, 261.63, 329.63],
            [174.61, 220.0, 261.63],
            [196.0, 246.94, 293.66],
            [220.0, 277.18, 329.63],
          ];

      const notes = chords[step % chords.length];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.001, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.05, now + idx * 0.06 + 0.35);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + idx * 0.06 + 2.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 2.5);
      });
    } catch {
      // Ignore audio errors
    }
  }
}

export const soundFX = new SoundEffects();
