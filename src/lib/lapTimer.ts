export interface LapData {
  lapNumber: number;
  lapTime: number;
  timestamp: number;
  relativeTime: number;
  laneId: number;
}

export interface ROIConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LaneConfig {
  id: number;
  name: string;
  color: string;
  enabled: boolean;
  roi: ROIConfig;
}

export interface TimerConfig {
  threshold: number;
  cooldown: number;
  smoothing: number;
  debugMode: boolean;
  laneCount: number;
  // Race mode settings
  raceMode: 'free' | 'laps' | 'time';
  targetLaps: number;
  targetTime: number; // in seconds
  voiceEnabled: boolean;
  trackLength: number; // in meters
}

export interface LaneState {
  isRunning: boolean;
  startTime: number | null;
  lastLapTime: number | null;
  laps: LapData[];
  bestLap: number | null;
  avgLap: number | null;
  lastTriggerTime: number;
  prevLuma: Uint8Array | null;
  smoothingBuffer: number[];
  diffScore: number;
}

export interface TimerState {
  isRunning: boolean;
  startTime: number | null;
  lanes: LaneState[];
}

// Lane color palette - distinct, high-contrast colors
export const LANE_COLORS: string[] = [
  '#ef4444', // Red
  '#3b82f6', // Blue  
  '#22c55e', // Green
  '#f59e0b', // Amber
];

export const LANE_NAMES: string[] = ['Lane 1', 'Lane 2', 'Lane 3', 'Lane 4'];

const createDefaultROI = (laneIndex: number, totalLanes: number): ROIConfig => {
  const height = 0.15;
  const gap = 0.02;
  const totalHeight = totalLanes * height + (totalLanes - 1) * gap;
  const startY = (1 - totalHeight) / 2;
  
  return {
    x: 0.25,
    y: startY + laneIndex * (height + gap),
    width: 0.5,
    height,
  };
};

export const createDefaultLanes = (count: number): LaneConfig[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: LANE_NAMES[i],
    color: LANE_COLORS[i],
    enabled: true,
    roi: createDefaultROI(i, count),
  }));
};

export const createEmptyLaneState = (): LaneState => ({
  isRunning: false,
  startTime: null,
  lastLapTime: null,
  laps: [],
  bestLap: null,
  avgLap: null,
  lastTriggerTime: 0,
  prevLuma: null,
  smoothingBuffer: [],
  diffScore: 0,
});

const DEFAULT_CONFIG: TimerConfig = {
  threshold: 12, // Lowered for better sensitivity
  cooldown: 400, // Reduced cooldown for faster detection
  smoothing: 2,  // Reduced smoothing for faster response
  debugMode: false,
  laneCount: 2,
  raceMode: 'free',
  targetLaps: 10,
  targetTime: 300,
  voiceEnabled: false,
  trackLength: 5.5, // Default Scalextric track ~5.5m
};

// Calculate speed in km/h from lap time and track length
export function calculateSpeed(lapTimeMs: number, trackLengthMeters: number): number {
  if (lapTimeMs <= 0 || trackLengthMeters <= 0) return 0;
  const lapTimeHours = lapTimeMs / 1000 / 3600;
  const trackLengthKm = trackLengthMeters / 1000;
  return trackLengthKm / lapTimeHours;
}

export function formatSpeed(speed: number): string {
  if (speed <= 0 || !isFinite(speed)) return '--';
  return speed.toFixed(1);
}

export function loadConfig(): { lanes: LaneConfig[]; timer: TimerConfig } {
  try {
    const saved = localStorage.getItem('scalextric-config-v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        lanes: parsed.lanes || createDefaultLanes(parsed.timer?.laneCount || 2),
        timer: { ...DEFAULT_CONFIG, ...parsed.timer },
      };
    }
  } catch (e) {
    console.warn('Failed to load config:', e);
  }
  return { lanes: createDefaultLanes(2), timer: DEFAULT_CONFIG };
}

export function saveConfig(lanes: LaneConfig[], timer: TimerConfig): void {
  try {
    localStorage.setItem('scalextric-config-v2', JSON.stringify({ lanes, timer }));
  } catch (e) {
    console.warn('Failed to save config:', e);
  }
}

export function formatTime(ms: number): string {
  if (ms < 0 || !isFinite(ms)) return '--:--.---';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = Math.floor(ms % 1000);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
}

export function formatTimeShort(ms: number): string {
  if (ms < 0 || !isFinite(ms)) return '--.---';
  const seconds = Math.floor(ms / 1000);
  const millis = Math.floor(ms % 1000);
  return `${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
}

export function exportToCSV(laps: LapData[], lanes: LaneConfig[]): void {
  const headers = ['Lap #', 'Lane', 'Lap Time (s)', 'Lap Time', 'Total Time (s)'];
  const rows = laps
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(lap => [
      lap.lapNumber,
      lanes[lap.laneId]?.name || `Lane ${lap.laneId + 1}`,
      (lap.lapTime / 1000).toFixed(3),
      formatTimeShort(lap.lapTime),
      (lap.relativeTime / 1000).toFixed(3),
    ]);

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `scalextric-laps-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
  link.click();
  
  URL.revokeObjectURL(url);
}

// Optimized motion detection with shared temp canvas
let sharedTempCanvas: HTMLCanvasElement | null = null;
let sharedTempCtx: CanvasRenderingContext2D | null = null;

function getSharedTempCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  if (!sharedTempCanvas) {
    sharedTempCanvas = document.createElement('canvas');
    sharedTempCtx = sharedTempCanvas.getContext('2d', { willReadFrequently: true })!;
  }
  return { canvas: sharedTempCanvas, ctx: sharedTempCtx! };
}

export function extractROILuma(
  sourceCtx: CanvasRenderingContext2D,
  roi: ROIConfig,
  canvasWidth: number,
  canvasHeight: number,
  downscale: number = 4
): Uint8Array {
  const roiX = Math.floor(roi.x * canvasWidth);
  const roiY = Math.floor(roi.y * canvasHeight);
  const roiW = Math.max(1, Math.floor(roi.width * canvasWidth));
  const roiH = Math.max(1, Math.floor(roi.height * canvasHeight));

  const targetW = Math.max(1, Math.floor(roiW / downscale));
  const targetH = Math.max(1, Math.floor(roiH / downscale));

  const { canvas: tempCanvas, ctx: tempCtx } = getSharedTempCanvas();
  
  if (tempCanvas.width !== targetW || tempCanvas.height !== targetH) {
    tempCanvas.width = targetW;
    tempCanvas.height = targetH;
  }
  
  tempCtx.drawImage(
    sourceCtx.canvas,
    roiX, roiY, roiW, roiH,
    0, 0, targetW, targetH
  );

  const imageData = tempCtx.getImageData(0, 0, targetW, targetH);
  const data = imageData.data;
  const luma = new Uint8Array(targetW * targetH);

  // Optimized luma calculation using integer math
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    luma[j] = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
  }

  return luma;
}

export function computeDiffScore(currentLuma: Uint8Array, prevLuma: Uint8Array | null): number {
  if (!prevLuma || prevLuma.length !== currentLuma.length) {
    return 0;
  }

  let totalDiff = 0;
  const len = currentLuma.length;
  
  // Unrolled loop for performance
  const remainder = len % 4;
  let i = 0;
  
  for (; i < len - remainder; i += 4) {
    totalDiff += Math.abs(currentLuma[i] - prevLuma[i]);
    totalDiff += Math.abs(currentLuma[i + 1] - prevLuma[i + 1]);
    totalDiff += Math.abs(currentLuma[i + 2] - prevLuma[i + 2]);
    totalDiff += Math.abs(currentLuma[i + 3] - prevLuma[i + 3]);
  }
  
  for (; i < len; i++) {
    totalDiff += Math.abs(currentLuma[i] - prevLuma[i]);
  }

  return totalDiff / len;
}

export function applySmoothing(buffer: number[], newValue: number, windowSize: number): number {
  buffer.push(newValue);
  if (buffer.length > windowSize) {
    buffer.shift();
  }
  
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i];
  }
  return sum / buffer.length;
}

export function calibrateThreshold(samples: number[]): number {
  if (samples.length === 0) return 15;
  
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i];
  }
  const mean = sum / samples.length;
  
  let variance = 0;
  for (let i = 0; i < samples.length; i++) {
    variance += (samples[i] - mean) ** 2;
  }
  variance /= samples.length;
  
  const stdDev = Math.sqrt(variance);
  return Math.round(Math.max(5, Math.min(100, mean + 3 * stdDev)));
}
