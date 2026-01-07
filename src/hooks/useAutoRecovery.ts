import { useState, useEffect, useCallback, useRef } from 'react';
import { LaneState, LaneConfig, TimerConfig } from '@/lib/lapTimer';

export interface RecoverableSession {
  timestamp: number;
  startTime: number;
  elapsedTime: number;
  laneStates: LaneState[];
  lanes: LaneConfig[];
  config: TimerConfig;
}

const STORAGE_KEY = 'scalextric-recovery-v1';
const SAVE_INTERVAL = 2000; // Save every 2 seconds

function loadRecovery(): RecoverableSession | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Only offer recovery if session is less than 1 hour old
      if (Date.now() - parsed.timestamp < 3600000) {
        return parsed;
      }
    }
  } catch {
    // Ignore errors
  }
  return null;
}

function saveRecovery(session: RecoverableSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    console.warn('Failed to save recovery:', e);
  }
}

export function clearRecovery(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

export function useAutoRecovery() {
  const [pendingRecovery, setPendingRecovery] = useState<RecoverableSession | null>(() => loadRecovery());
  const saveTimerRef = useRef<number | null>(null);

  // Check for recovery on mount
  useEffect(() => {
    const recovery = loadRecovery();
    if (recovery && recovery.laneStates.some(ls => ls.laps.length > 0)) {
      setPendingRecovery(recovery);
    }
  }, []);

  // Save current state periodically while racing
  const saveState = useCallback((
    isRunning: boolean,
    startTime: number | null,
    laneStates: LaneState[],
    lanes: LaneConfig[],
    config: TimerConfig
  ) => {
    if (!isRunning || !startTime) {
      clearRecovery();
      return;
    }

    const session: RecoverableSession = {
      timestamp: Date.now(),
      startTime,
      elapsedTime: performance.now() - startTime,
      laneStates: laneStates.map(ls => ({
        ...ls,
        prevLuma: null, // Don't save binary data
        smoothingBuffer: [],
      })),
      lanes: [...lanes],
      config: { ...config },
    };

    saveRecovery(session);
  }, []);

  // Start auto-saving
  const startAutoSave = useCallback((
    getState: () => {
      isRunning: boolean;
      startTime: number | null;
      laneStates: LaneState[];
      lanes: LaneConfig[];
      config: TimerConfig;
    }
  ) => {
    if (saveTimerRef.current) {
      window.clearInterval(saveTimerRef.current);
    }

    saveTimerRef.current = window.setInterval(() => {
      const state = getState();
      saveState(state.isRunning, state.startTime, state.laneStates, state.lanes, state.config);
    }, SAVE_INTERVAL);
  }, [saveState]);

  // Stop auto-saving
  const stopAutoSave = useCallback(() => {
    if (saveTimerRef.current) {
      window.clearInterval(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    clearRecovery();
  }, []);

  // Dismiss recovery
  const dismissRecovery = useCallback(() => {
    setPendingRecovery(null);
    clearRecovery();
  }, []);

  // Accept recovery
  const acceptRecovery = useCallback(() => {
    const recovery = pendingRecovery;
    setPendingRecovery(null);
    clearRecovery();
    return recovery;
  }, [pendingRecovery]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearInterval(saveTimerRef.current);
      }
    };
  }, []);

  return {
    pendingRecovery,
    startAutoSave,
    stopAutoSave,
    dismissRecovery,
    acceptRecovery,
    saveState,
  };
}
