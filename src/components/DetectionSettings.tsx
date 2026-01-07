import React from 'react';
import { Sliders, Zap, Bug, Layers } from 'lucide-react';
import { TimerConfig, LaneConfig, LANE_COLORS } from '@/lib/lapTimer';
import { LaneCustomizer } from './LaneCustomizer';

interface DetectionSettingsProps {
  config: TimerConfig;
  lanes: LaneConfig[];
  selectedLane: number;
  onChange: (config: Partial<TimerConfig>) => void;
  onSelectLane: (laneId: number) => void;
  onToggleLane: (laneId: number, enabled: boolean) => void;
  onUpdateLane: (laneId: number, updates: Partial<LaneConfig>) => void;
  onCalibrate: () => void;
  isCalibrating: boolean;
  diffScores: number[];
}

export function DetectionSettings({
  config,
  lanes,
  selectedLane,
  onChange,
  onSelectLane,
  onToggleLane,
  onUpdateLane,
  onCalibrate,
  isCalibrating,
  diffScores,
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

      {/* Lane Count Selector */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Layers className="w-3 h-3" />
          <span>Number of Lanes</span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(count => (
            <button
              key={count}
              onClick={() => onChange({ laneCount: count })}
              className={`flex-1 py-2 rounded-lg font-mono text-sm transition-colors ${
                config.laneCount === count
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {/* Lane Selector */}
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">Select Lane to Edit</span>
        <div className="grid grid-cols-4 gap-2">
          {lanes.map((lane, i) => (
            <button
              key={lane.id}
              onClick={() => onSelectLane(i)}
              className={`relative py-2 rounded-lg font-mono text-xs transition-all ${
                selectedLane === i
                  ? 'ring-2 ring-offset-2 ring-offset-background'
                  : 'opacity-60 hover:opacity-100'
              }`}
              style={{ 
                backgroundColor: lane.color,
                color: 'white',
                '--tw-ring-color': lane.color,
              } as React.CSSProperties}
            >
              {i + 1}
              {!lane.enabled && (
                <div className="absolute inset-0 bg-background/60 rounded-lg flex items-center justify-center">
                  <span className="text-[10px]">OFF</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Lane Settings */}
      {lanes[selectedLane] && (
        <div className="space-y-2 bg-muted rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: lanes[selectedLane].color }}
              />
              <span 
                className="font-racing text-sm"
                style={{ color: lanes[selectedLane].color }}
              >
                {lanes[selectedLane].name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <LaneCustomizer
                lane={lanes[selectedLane]}
                onUpdate={(updates) => onUpdateLane(selectedLane, updates)}
              />
              <button
                onClick={() => onToggleLane(selectedLane, !lanes[selectedLane]?.enabled)}
                className={`w-10 h-5 rounded-full transition-colors ${
                  lanes[selectedLane]?.enabled ? 'bg-accent' : 'bg-secondary'
                }`}
              >
                <div 
                  className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    lanes[selectedLane]?.enabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Score Display */}
      <div className="grid grid-cols-2 gap-2">
        {lanes.slice(0, config.laneCount).map((lane, i) => (
          <div 
            key={lane.id}
            className="flex items-center justify-between bg-muted rounded-lg px-2 py-1.5"
          >
            <div className="flex items-center gap-1.5">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: lane.color }}
              />
              <span className="text-[10px] text-muted-foreground">L{i + 1}</span>
            </div>
            <span className={`font-mono text-xs ${
              (diffScores[i] || 0) >= config.threshold ? 'text-accent' : 'text-foreground'
            }`}>
              {(diffScores[i] || 0).toFixed(1)}
            </span>
          </div>
        ))}
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
          Keep all ROIs clear for 3 seconds...
        </p>
      )}
    </div>
  );
}
