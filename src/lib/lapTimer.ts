export interface LapData {
  lapNumber: number;
  lapTime: number;
  timestamp: number;
  relativeTime: number;
}

export interface ROIConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TimerConfig {
  threshold: number;
  cooldown: number;
  smoothing: number;
  debugMode: boolean;
}

export interface TimerState {
  isRunning: boolean;
  startTime: number | null;
  lastLapTime: number | null;
  laps: LapData[];
  bestLap: number | null;
  avgLap: number | null;
}

const DEFAULT_ROI: ROIConfig = {
  x: 0.3,
  y: 0.4,
  width: 0.4,
  height: 0.2,
};

const DEFAULT_CONFIG: TimerConfig = {
  threshold: 15,
  cooldown: 500,
  smoothing: 3,
  debugMode: false,
};

export function loadConfig(): { roi: ROIConfig; timer: TimerConfig } {
  try {
    const saved = localStorage.getItem('scalextric-config');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        roi: { ...DEFAULT_ROI, ...parsed.roi },
        timer: { ...DEFAULT_CONFIG, ...parsed.timer },
      };
    }
  } catch (e) {
    console.warn('Failed to load config:', e);
  }
  return { roi: DEFAULT_ROI, timer: DEFAULT_CONFIG };
}

export function saveConfig(roi: ROIConfig, timer: TimerConfig): void {
  try {
    localStorage.setItem('scalextric-config', JSON.stringify({ roi, timer }));
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

export function exportToCSV(laps: LapData[]): void {
  const headers = ['Lap #', 'Lap Time (s)', 'Lap Time (formatted)', 'Relative Time (s)'];
  const rows = laps.map(lap => [
    lap.lapNumber,
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

export class MotionDetector {
  private prevLuma: Uint8Array | null = null;
  private smoothingBuffer: number[] = [];
  private lastTriggerTime = 0;
  
  reset(): void {
    this.prevLuma = null;
    this.smoothingBuffer = [];
    this.lastTriggerTime = 0;
  }

  extractROI(
    ctx: CanvasRenderingContext2D,
    roi: ROIConfig,
    canvasWidth: number,
    canvasHeight: number,
    downscale: number = 4
  ): { luma: Uint8Array; width: number; height: number } {
    const roiX = Math.floor(roi.x * canvasWidth);
    const roiY = Math.floor(roi.y * canvasHeight);
    const roiW = Math.floor(roi.width * canvasWidth);
    const roiH = Math.floor(roi.height * canvasHeight);

    const targetW = Math.max(1, Math.floor(roiW / downscale));
    const targetH = Math.max(1, Math.floor(roiH / downscale));

    // Create temporary canvas for downscaling
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = targetW;
    tempCanvas.height = targetH;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })!;
    
    tempCtx.drawImage(
      ctx.canvas,
      roiX, roiY, roiW, roiH,
      0, 0, targetW, targetH
    );

    const imageData = tempCtx.getImageData(0, 0, targetW, targetH);
    const data = imageData.data;
    const luma = new Uint8Array(targetW * targetH);

    for (let i = 0; i < luma.length; i++) {
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      // Fast luma approximation
      luma[i] = (r * 77 + g * 150 + b * 29) >> 8;
    }

    return { luma, width: targetW, height: targetH };
  }

  computeDiffScore(currentLuma: Uint8Array): number {
    if (!this.prevLuma || this.prevLuma.length !== currentLuma.length) {
      this.prevLuma = new Uint8Array(currentLuma);
      return 0;
    }

    let totalDiff = 0;
    for (let i = 0; i < currentLuma.length; i++) {
      totalDiff += Math.abs(currentLuma[i] - this.prevLuma[i]);
    }

    // Copy current to prev
    this.prevLuma.set(currentLuma);

    return totalDiff / currentLuma.length;
  }

  applySmoothing(score: number, windowSize: number): number {
    if (windowSize <= 1) return score;
    
    this.smoothingBuffer.push(score);
    if (this.smoothingBuffer.length > windowSize) {
      this.smoothingBuffer.shift();
    }
    
    return this.smoothingBuffer.reduce((a, b) => a + b, 0) / this.smoothingBuffer.length;
  }

  checkTrigger(
    score: number,
    threshold: number,
    cooldown: number,
    isRunning: boolean
  ): boolean {
    const now = performance.now();
    
    if (!isRunning) return false;
    if (score < threshold) return false;
    if (now - this.lastTriggerTime < cooldown) return false;
    
    this.lastTriggerTime = now;
    return true;
  }

  calibrate(
    ctx: CanvasRenderingContext2D,
    roi: ROIConfig,
    canvasWidth: number,
    canvasHeight: number,
    samples: number[]
  ): number {
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const variance = samples.reduce((sum, val) => sum + (val - mean) ** 2, 0) / samples.length;
    const stdDev = Math.sqrt(variance);
    
    // Threshold = mean + 3 * stdDev
    return Math.round(mean + 3 * stdDev);
  }
}
