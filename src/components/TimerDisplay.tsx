import React from 'react';
import { formatTimeShort, LaneConfig, LaneState } from '@/lib/lapTimer';

interface TimerDisplayProps {
  lanes: LaneConfig[];
  laneStates: LaneState[];
  isRunning: boolean;
}

export function TimerDisplay({ lanes, laneStates, isRunning }: TimerDisplayProps) {
  const enabledLanes = lanes.filter(l => l.enabled);

  return (
    <div className="racing-card rounded-xl p-3 space-y-3">
      {enabledLanes.map((lane) => {
        const state = laneStates[lane.id];
        const lastLap = state?.laps.length > 0 ? state.laps[state.laps.length - 1].lapTime : null;
        const lapsCount = state?.laps.length || 0;

        return (
          <div 
            key={lane.id}
            className="p-3 rounded-lg border"
            style={{ 
              borderColor: lane.color,
              background: `linear-gradient(135deg, ${lane.color}15, transparent)`,
            }}
          >
            {/* Lane header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: lane.color }}
                />
                <span className="font-racing text-xs uppercase tracking-wider" style={{ color: lane.color }}>
                  {lane.name}
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {lapsCount} laps
              </span>
            </div>

            {/* Times row */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Last</p>
                <p 
                  className={`font-racing text-lg font-bold ${isRunning ? 'animate-pulse' : ''}`}
                  style={{ color: lane.color }}
                >
                  {lastLap ? formatTimeShort(lastLap) : '--.---'}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Best</p>
                <p className="font-racing text-lg font-bold text-accent">
                  {state?.bestLap ? formatTimeShort(state.bestLap) : '--.---'}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Avg</p>
                <p className="font-racing text-lg font-bold text-muted-foreground">
                  {state?.avgLap ? formatTimeShort(state.avgLap) : '--.---'}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
