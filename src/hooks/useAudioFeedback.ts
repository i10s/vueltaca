import { useCallback, useRef, useEffect } from 'react';

interface AudioFeedbackOptions {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export function useAudioFeedback(options: AudioFeedbackOptions = { soundEnabled: true, vibrationEnabled: true }) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const { soundEnabled, vibrationEnabled } = options;

  // Initialize AudioContext on first user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };

    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('touchstart', initAudio, { once: true });

    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!soundEnabled || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, [soundEnabled]);

  const vibrate = useCallback((pattern: number | number[]) => {
    if (!vibrationEnabled || !navigator.vibrate) return;
    navigator.vibrate(pattern);
  }, [vibrationEnabled]);

  // Lane-specific frequencies for distinct sounds
  const LANE_FREQUENCIES = [
    { base: 523.25, notes: [523.25, 659.25] }, // Lane 1: C5-E5 (bright major third)
    { base: 392.00, notes: [392.00, 493.88] }, // Lane 2: G4-B4 (warm major third)
    { base: 440.00, notes: [440.00, 554.37] }, // Lane 3: A4-C#5 (strong major third)
    { base: 349.23, notes: [349.23, 440.00] }, // Lane 4: F4-A4 (rich major third)
  ];

  // Lap detection sound - distinct two-note chime per lane
  const playLapSound = useCallback((laneId: number = 0) => {
    if (!soundEnabled || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const laneSound = LANE_FREQUENCIES[laneId % LANE_FREQUENCIES.length];
    
    // Play two-note ascending chime for clear lane identification
    laneSound.notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      const startTime = ctx.currentTime + i * 0.08;
      gainNode.gain.setValueAtTime(0.35, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.15);
    });

    vibrate([30, 20, 50]);
  }, [soundEnabled, vibrate]);

  // Best lap sound - celebratory fanfare
  const playBestLapSound = useCallback(() => {
    if (!soundEnabled || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    
    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      const startTime = ctx.currentTime + i * 0.1;
      gainNode.gain.setValueAtTime(0.2, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.2);
    });

    vibrate([100, 50, 100, 50, 200]);
  }, [soundEnabled, vibrate]);

  // Countdown sounds
  const playCountdownTick = useCallback(() => {
    playTone(440, 0.1, 'sine'); // A4
    vibrate(30);
  }, [playTone, vibrate]);

  const playCountdownGo = useCallback(() => {
    playTone(880, 0.3, 'square'); // A5
    vibrate(100);
  }, [playTone, vibrate]);

  // Start/Stop sounds
  const playStartSound = useCallback(() => {
    playTone(660, 0.2, 'sine'); // E5
    vibrate(50);
  }, [playTone, vibrate]);

  const playStopSound = useCallback(() => {
    playTone(330, 0.3, 'sine'); // E4
    vibrate([50, 50, 50]);
  }, [playTone, vibrate]);

  return {
    playLapSound,
    playBestLapSound,
    playCountdownTick,
    playCountdownGo,
    playStartSound,
    playStopSound,
    vibrate,
  };
}
