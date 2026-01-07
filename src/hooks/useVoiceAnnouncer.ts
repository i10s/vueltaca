import { useCallback, useRef } from 'react';

interface VoiceAnnouncerOptions {
  enabled: boolean;
  volume?: number;
  rate?: number;
}

export function useVoiceAnnouncer(options: VoiceAnnouncerOptions = { enabled: true }) {
  const { enabled, volume = 1, rate = 1.1 } = options;
  const lastAnnouncementRef = useRef<number>(0);
  const minInterval = 1500; // Minimum time between announcements

  const speak = useCallback((text: string, priority: boolean = false) => {
    if (!enabled || !('speechSynthesis' in window)) return;

    const now = Date.now();
    if (!priority && now - lastAnnouncementRef.current < minInterval) return;
    
    lastAnnouncementRef.current = now;

    // Cancel any ongoing speech for priority announcements
    if (priority) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = volume;
    utterance.rate = rate;
    utterance.pitch = 1;
    
    // Try to use a Spanish voice if available
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => v.lang.startsWith('es'));
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, [enabled, volume, rate]);

  const announceLap = useCallback((laneName: string, lapNumber: number, lapTime: number) => {
    const seconds = (lapTime / 1000).toFixed(1);
    speak(`${laneName}, vuelta ${lapNumber}, ${seconds} segundos`);
  }, [speak]);

  const announceBestLap = useCallback((laneName: string, lapTime: number) => {
    const seconds = (lapTime / 1000).toFixed(1);
    speak(`¡Nueva mejor vuelta! ${laneName}, ${seconds} segundos`, true);
  }, [speak]);

  const announcePosition = useCallback((laneName: string, position: number) => {
    const positionText = position === 1 ? 'primero' : position === 2 ? 'segundo' : position === 3 ? 'tercero' : `posición ${position}`;
    speak(`${laneName} ${positionText}`);
  }, [speak]);

  const announceWinner = useCallback((laneName: string, totalLaps: number) => {
    speak(`¡${laneName} gana la carrera con ${totalLaps} vueltas!`, true);
  }, [speak]);

  const announceCountdown = useCallback((count: number) => {
    if (count > 0) {
      speak(count.toString(), true);
    } else {
      speak('¡Ya!', true);
    }
  }, [speak]);

  return {
    speak,
    announceLap,
    announceBestLap,
    announcePosition,
    announceWinner,
    announceCountdown,
  };
}
