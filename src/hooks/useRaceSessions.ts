import { useState, useCallback, useEffect } from 'react';
import { LapData, LaneConfig } from '@/lib/lapTimer';

export interface RaceSession {
  id: string;
  date: string;
  duration: number;
  laps: LapData[];
  lanes: LaneConfig[];
  bestLapTime: number | null;
  bestLapLane: number | null;
  totalLaps: number;
}

const STORAGE_KEY = 'scalextric-sessions-v1';
const MAX_SESSIONS = 20;

function loadSessions(): RaceSession[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: RaceSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
  } catch (e) {
    console.warn('Failed to save sessions:', e);
  }
}

export function useRaceSessions() {
  const [sessions, setSessions] = useState<RaceSession[]>(() => loadSessions());

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  const saveSession = useCallback((laps: LapData[], lanes: LaneConfig[], duration: number) => {
    if (laps.length === 0) return null;

    // Find best lap
    let bestLapTime: number | null = null;
    let bestLapLane: number | null = null;
    laps.forEach(lap => {
      if (bestLapTime === null || lap.lapTime < bestLapTime) {
        bestLapTime = lap.lapTime;
        bestLapLane = lap.laneId;
      }
    });

    const session: RaceSession = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      date: new Date().toISOString(),
      duration,
      laps: [...laps],
      lanes: lanes.map(l => ({ ...l })),
      bestLapTime,
      bestLapLane,
      totalLaps: laps.length,
    };

    setSessions(prev => [session, ...prev]);
    return session;
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  }, []);

  const clearAllSessions = useCallback(() => {
    setSessions([]);
  }, []);

  const getBestLapEver = useCallback((): { time: number; session: RaceSession } | null => {
    let best: { time: number; session: RaceSession } | null = null;
    
    sessions.forEach(session => {
      if (session.bestLapTime !== null) {
        if (best === null || session.bestLapTime < best.time) {
          best = { time: session.bestLapTime, session };
        }
      }
    });
    
    return best;
  }, [sessions]);

  return {
    sessions,
    saveSession,
    deleteSession,
    clearAllSessions,
    getBestLapEver,
  };
}
