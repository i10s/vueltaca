import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  LapData, 
  ROIConfig, 
  TimerConfig, 
  TimerState,
  MotionDetector,
  loadConfig,
  saveConfig,
} from '@/lib/lapTimer';

interface UseLapTimerReturn {
  // State
  state: TimerState;
  roi: ROIConfig;
  config: TimerConfig;
  diffScore: number;
  isCalibrating: boolean;
  triggerFlash: boolean;
  
  // Actions
  start: () => void;
  stop: () => void;
  reset: () => void;
  setROI: (roi: ROIConfig) => void;
  setConfig: (config: Partial<TimerConfig>) => void;
  startCalibration: () => void;
  
  // Frame processing
  processFrame: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

export function useLapTimer(): UseLapTimerReturn {
  const savedConfig = loadConfig();
  
  const [state, setState] = useState<TimerState>({
    isRunning: false,
    startTime: null,
    lastLapTime: null,
    laps: [],
    bestLap: null,
    avgLap: null,
  });
  
  const [roi, setROIState] = useState<ROIConfig>(savedConfig.roi);
  const [config, setConfigState] = useState<TimerConfig>(savedConfig.timer);
  const [diffScore, setDiffScore] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [triggerFlash, setTriggerFlash] = useState(false);
  
  const detectorRef = useRef(new MotionDetector());
  const calibrationSamplesRef = useRef<number[]>([]);
  const calibrationStartRef = useRef<number>(0);

  // Save config when it changes
  useEffect(() => {
    saveConfig(roi, config);
  }, [roi, config]);

  const setROI = useCallback((newROI: ROIConfig) => {
    setROIState(newROI);
  }, []);

  const setConfig = useCallback((partial: Partial<TimerConfig>) => {
    setConfigState(prev => ({ ...prev, ...partial }));
  }, []);

  const start = useCallback(() => {
    const now = performance.now();
    setState(prev => ({
      ...prev,
      isRunning: true,
      startTime: now,
      lastLapTime: now,
    }));
    detectorRef.current.reset();
  }, []);

  const stop = useCallback(() => {
    setState(prev => ({
      ...prev,
      isRunning: false,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isRunning: false,
      startTime: null,
      lastLapTime: null,
      laps: [],
      bestLap: null,
      avgLap: null,
    });
    detectorRef.current.reset();
    setDiffScore(0);
  }, []);

  const startCalibration = useCallback(() => {
    setIsCalibrating(true);
    calibrationSamplesRef.current = [];
    calibrationStartRef.current = performance.now();
  }, []);

  const showTriggerFlash = useCallback(() => {
    setTriggerFlash(true);
    setTimeout(() => setTriggerFlash(false), 200);
  }, []);

  const processFrame = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const detector = detectorRef.current;
    
    // Extract and process ROI
    const { luma } = detector.extractROI(ctx, roi, width, height);
    const rawScore = detector.computeDiffScore(luma);
    const smoothedScore = detector.applySmoothing(rawScore, config.smoothing);
    
    setDiffScore(smoothedScore);

    // Handle calibration
    if (isCalibrating) {
      calibrationSamplesRef.current.push(smoothedScore);
      
      if (performance.now() - calibrationStartRef.current > 3000) {
        const newThreshold = detector.calibrate(
          ctx, roi, width, height,
          calibrationSamplesRef.current
        );
        setConfig({ threshold: Math.max(5, Math.min(100, newThreshold)) });
        setIsCalibrating(false);
      }
      return;
    }

    // Check for trigger
    if (detector.checkTrigger(smoothedScore, config.threshold, config.cooldown, state.isRunning)) {
      const now = performance.now();
      
      showTriggerFlash();
      
      setState(prev => {
        if (!prev.lastLapTime || !prev.startTime) return prev;
        
        const lapTime = now - prev.lastLapTime;
        const relativeTime = now - prev.startTime;
        const lapNumber = prev.laps.length + 1;
        
        const newLap: LapData = {
          lapNumber,
          lapTime,
          timestamp: now,
          relativeTime,
        };
        
        const newLaps = [...prev.laps, newLap];
        const times = newLaps.map(l => l.lapTime);
        const bestLap = Math.min(...times);
        const avgLap = times.reduce((a, b) => a + b, 0) / times.length;
        
        return {
          ...prev,
          lastLapTime: now,
          laps: newLaps,
          bestLap,
          avgLap,
        };
      });
    }
  }, [roi, config, state.isRunning, isCalibrating, setConfig, showTriggerFlash]);

  return {
    state,
    roi,
    config,
    diffScore,
    isCalibrating,
    triggerFlash,
    start,
    stop,
    reset,
    setROI,
    setConfig,
    startCalibration,
    processFrame,
  };
}
