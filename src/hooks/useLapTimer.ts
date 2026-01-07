import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  LapData, 
  LaneConfig,
  LaneState,
  TimerConfig, 
  TimerState,
  loadConfig,
  saveConfig,
  createDefaultLanes,
  createEmptyLaneState,
  extractROILuma,
  computeDiffScore,
  applySmoothing,
  calibrateThreshold,
} from '@/lib/lapTimer';

export interface BestLapEvent {
  laneId: number;
  lapTime: number;
  laneName: string;
  laneColor: string;
}

interface UseLapTimerReturn {
  state: TimerState;
  lanes: LaneConfig[];
  config: TimerConfig;
  isCalibrating: boolean;
  triggerFlashes: boolean[];
  onLapDetected: React.MutableRefObject<((laneId: number, isBestLap: boolean) => void) | null>;
  onBestLap: React.MutableRefObject<((event: BestLapEvent) => void) | null>;
  
  start: () => void;
  stop: () => void;
  reset: () => void;
  setLanes: (lanes: LaneConfig[]) => void;
  updateLane: (laneId: number, updates: Partial<LaneConfig>) => void;
  setConfig: (config: Partial<TimerConfig>) => void;
  startCalibration: () => void;
  processFrame: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  getAllLaps: () => LapData[];
  getLaneState: (laneId: number) => LaneState;
}

export function useLapTimer(): UseLapTimerReturn {
  const savedConfig = loadConfig();
  
  const [lanes, setLanesState] = useState<LaneConfig[]>(savedConfig.lanes);
  const [config, setConfigState] = useState<TimerConfig>(savedConfig.timer);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [triggerFlashes, setTriggerFlashes] = useState<boolean[]>([false, false, false, false]);
  
  // Use refs for mutable state that doesn't need re-renders
  const laneStatesRef = useRef<LaneState[]>(
    Array.from({ length: 4 }, () => createEmptyLaneState())
  );
  const isRunningRef = useRef(false);
  const startTimeRef = useRef<number | null>(null);
  const calibrationSamplesRef = useRef<number[][]>([[], [], [], []]);
  const calibrationStartRef = useRef<number>(0);
  
  // Event callbacks
  const onLapDetectedRef = useRef<((laneId: number, isBestLap: boolean) => void) | null>(null);
  const onBestLapRef = useRef<((event: BestLapEvent) => void) | null>(null);
  
  // Force re-render trigger
  const [, forceUpdate] = useState({});

  const [state, setState] = useState<TimerState>({
    isRunning: false,
    startTime: null,
    lanes: laneStatesRef.current,
  });

  // Save config when it changes
  useEffect(() => {
    saveConfig(lanes, config);
  }, [lanes, config]);

  // Update lane count
  useEffect(() => {
    if (lanes.length !== config.laneCount) {
      setLanesState(createDefaultLanes(config.laneCount));
    }
  }, [config.laneCount, lanes.length]);

  const setLanes = useCallback((newLanes: LaneConfig[]) => {
    setLanesState(newLanes);
  }, []);

  const updateLane = useCallback((laneId: number, updates: Partial<LaneConfig>) => {
    setLanesState(prev => prev.map(lane => 
      lane.id === laneId ? { ...lane, ...updates } : lane
    ));
  }, []);

  const setConfig = useCallback((partial: Partial<TimerConfig>) => {
    setConfigState(prev => ({ ...prev, ...partial }));
  }, []);

  const start = useCallback(() => {
    const now = performance.now();
    isRunningRef.current = true;
    startTimeRef.current = now;
    
    // Reset all lane states
    laneStatesRef.current = laneStatesRef.current.map(lane => ({
      ...createEmptyLaneState(),
      isRunning: true,
      startTime: now,
      lastLapTime: now,
    }));
    
    setState({
      isRunning: true,
      startTime: now,
      lanes: laneStatesRef.current,
    });
  }, []);

  const stop = useCallback(() => {
    isRunningRef.current = false;
    
    laneStatesRef.current = laneStatesRef.current.map(lane => ({
      ...lane,
      isRunning: false,
    }));
    
    setState(prev => ({
      ...prev,
      isRunning: false,
      lanes: laneStatesRef.current,
    }));
  }, []);

  const reset = useCallback(() => {
    isRunningRef.current = false;
    startTimeRef.current = null;
    
    laneStatesRef.current = Array.from({ length: 4 }, () => createEmptyLaneState());
    
    setState({
      isRunning: false,
      startTime: null,
      lanes: laneStatesRef.current,
    });
  }, []);

  const startCalibration = useCallback(() => {
    setIsCalibrating(true);
    calibrationSamplesRef.current = [[], [], [], []];
    calibrationStartRef.current = performance.now();
  }, []);

  const showTriggerFlash = useCallback((laneId: number) => {
    setTriggerFlashes(prev => {
      const next = [...prev];
      next[laneId] = true;
      return next;
    });
    
    setTimeout(() => {
      setTriggerFlashes(prev => {
        const next = [...prev];
        next[laneId] = false;
        return next;
      });
    }, 200);
  }, []);

  const processFrame = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const now = performance.now();
    let stateChanged = false;

    // Process each enabled lane
    for (let i = 0; i < lanes.length; i++) {
      const lane = lanes[i];
      if (!lane.enabled) continue;

      const laneState = laneStatesRef.current[i];
      
      // Extract and compute diff score
      const luma = extractROILuma(ctx, lane.roi, width, height);
      const rawScore = computeDiffScore(luma, laneState.prevLuma);
      const smoothedScore = applySmoothing(
        laneState.smoothingBuffer, 
        rawScore, 
        config.smoothing
      );
      
      // Update luma for next frame
      laneState.prevLuma = luma;
      laneState.diffScore = smoothedScore;

      // Handle calibration
      if (isCalibrating) {
        calibrationSamplesRef.current[i].push(smoothedScore);
        continue;
      }

      // Check for trigger
      if (
        isRunningRef.current &&
        smoothedScore >= config.threshold &&
        now - laneState.lastTriggerTime >= config.cooldown
      ) {
        laneState.lastTriggerTime = now;
        
        if (laneState.lastLapTime && startTimeRef.current) {
          const lapTime = now - laneState.lastLapTime;
          const relativeTime = now - startTimeRef.current;
          const lapNumber = laneState.laps.length + 1;
          
          const newLap: LapData = {
            lapNumber,
            lapTime,
            timestamp: now,
            relativeTime,
            laneId: i,
          };
          
          laneState.laps.push(newLap);
          
          // Update stats and check for best lap
          const times = laneState.laps.map(l => l.lapTime);
          const prevBest = laneState.bestLap;
          laneState.bestLap = Math.min(...times);
          laneState.avgLap = times.reduce((a, b) => a + b, 0) / times.length;
          
          const isBestLap = prevBest === null || lapTime < prevBest;
          
          // Trigger callbacks
          onLapDetectedRef.current?.(i, isBestLap);
          
          if (isBestLap && lanes[i]) {
            onBestLapRef.current?.({
              laneId: i,
              lapTime,
              laneName: lanes[i].name,
              laneColor: lanes[i].color,
            });
          }
          
          showTriggerFlash(i);
          stateChanged = true;
        }
        
        laneState.lastLapTime = now;
      }
    }

    // Complete calibration after 3 seconds
    if (isCalibrating && now - calibrationStartRef.current > 3000) {
      const allSamples = calibrationSamplesRef.current
        .flat()
        .filter(s => s > 0);
      
      if (allSamples.length > 0) {
        const newThreshold = calibrateThreshold(allSamples);
        setConfig({ threshold: newThreshold });
      }
      setIsCalibrating(false);
    }

    // Update state periodically for UI refresh
    if (stateChanged || now % 100 < 16) {
      setState({
        isRunning: isRunningRef.current,
        startTime: startTimeRef.current,
        lanes: [...laneStatesRef.current],
      });
    }
  }, [lanes, config, isCalibrating, setConfig, showTriggerFlash]);

  const getAllLaps = useCallback((): LapData[] => {
    return laneStatesRef.current
      .flatMap(lane => lane.laps)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, []);

  const getLaneState = useCallback((laneId: number): LaneState => {
    return laneStatesRef.current[laneId] || createEmptyLaneState();
  }, []);

  return {
    state,
    lanes,
    config,
    isCalibrating,
    triggerFlashes,
    onLapDetected: onLapDetectedRef,
    onBestLap: onBestLapRef,
    start,
    stop,
    reset,
    setLanes,
    updateLane,
    setConfig,
    startCalibration,
    processFrame,
    getAllLaps,
    getLaneState,
  };
}
