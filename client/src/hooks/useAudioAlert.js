import { useRef, useCallback } from 'react';

/**
 * Custom hook to generate a luxury audio chime alert using the Web Audio API.
 * Synthesizes a clean two-tone harmonic notification without external audio files.
 */
export const useAudioAlert = () => {
  const audioCtxRef = useRef(null);

  const playChime = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // First harmonic tone (E5 ~ 659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.8);

      // Second ascending harmonic tone (A5 ~ 880 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.15);
      gain2.gain.setValueAtTime(0.35, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 1.2);

      // Vibrate mobile device if supported
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 300]);
      }
    } catch (e) {
      console.warn('[AudioAlert] Web Audio playback not available:', e);
    }
  }, []);

  return { playChime };
};
