import React from 'react';
import { Sliders, Zap, Bug } from 'lucide-react';
import { TimerConfig } from '@/lib/lapTimer';

interface DetectionSettingsProps {
  config: TimerConfig;
  onChange: (config: Partial<TimerConfig>) => void;
  onCalibrate: () => void;
  isCalibrating: boolean;
  diffScore: number;
}

export function DetectionSettings({
  config,
  onChange,
  onCalibrate,
  isCalibrating,
  diffScore,
}: DetectionSettingsProps) {
  return (
    <div className="racing-card rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-primary" />
          <h3 className="font-racing text-sm uppercase tracking-wider">Detection</h3>
        </div>
        
        <button
          onClick={() => onChange({ debugMode: !config.debugMode })}
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
            config.debugMode 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-secondary text-muted-foreground'
          }`}
        >
          <Bug className="w-3 h-3" />
          Debug
        </button>
      </div>

      {/* Current Score Display */}
      <div className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
        <span className="text-xs text-muted-foreground">Score</span>
        <span className={`font-mono text-sm ${
          diffScore >= config.threshold ? 'text-accent' : 'text-foreground'
        }`}>
          {diffScore.toFixed(1)}
        </span>
      </div>

      {/* Threshold Slider */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Threshold</span>
          <span className="font-mono">{config.threshold}</span>
        </div>
        <input
          type="range"
          min="1"
          max="100"
          value={config.threshold}
          onChange={(e) => onChange({ threshold: parseInt(e.target.value) })}
          className="slider-racing w-full"
        />
      </div>

      {/* Cooldown Slider */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Cooldown (ms)</span>
          <span className="font-mono">{config.cooldown}</span>
        </div>
        <input
          type="range"
          min="100"
          max="2000"
          step="50"
          value={config.cooldown}
          onChange={(e) => onChange({ cooldown: parseInt(e.target.value) })}
          className="slider-racing w-full"
        />
      </div>

      {/* Smoothing Slider */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Smoothing</span>
          <span className="font-mono">{config.smoothing}</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          value={config.smoothing}
          onChange={(e) => onChange({ smoothing: parseInt(e.target.value) })}
          className="slider-racing w-full"
        />
      </div>

      {/* Calibrate Button */}
      <button
        onClick={onCalibrate}
        disabled={isCalibrating}
        className="w-full btn-racing bg-secondary hover:bg-muted flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-mono text-sm text-foreground disabled:opacity-50"
      >
        <Zap className={`w-4 h-4 ${isCalibrating ? 'animate-pulse text-racing-yellow' : ''}`} />
        {isCalibrating ? 'Calibrating...' : 'Auto-Calibrate'}
      </button>
      
      {isCalibrating && (
        <p className="text-xs text-center text-muted-foreground">
          Keep ROI clear for 3 seconds...
        </p>
      )}
    </div>
  );
}
