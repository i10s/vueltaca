import React from 'react';
import { formatTimeShort, LaneConfig, LaneState } from '@/lib/lapTimer';
import { Trophy, TrendingUp, Timer } from 'lucide-react';

interface TimerDisplayProps {
  lanes: LaneConfig[];
  laneStates: LaneState[];
  isRunning: boolean;
}

export function TimerDisplay({ lanes, laneStates, isRunning }: TimerDisplayProps) {
  const enabledLanes = lanes.filter(l => l.enabled);

  if (enabledLanes.length === 0) {
    return (
      <div className="racing-card rounded-xl p-4 text-center">
        <p className="text-muted-foreground text-sm">No lanes enabled</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {enabledLanes.map((lane) => {
        const state = laneStates[lane.id];
        const lastLap = state?.laps.length > 0 ? state.laps[state.laps.length - 1].lapTime : null;
        const lapsCount = state?.laps.length || 0;

        return (
          <div 
            key={lane.id}
            className="racing-card rounded-xl p-4 transition-all duration-300"
            style={{ 
              borderColor: lane.color,
              borderWidth: '1px',
              borderStyle: 'solid',
              background: `linear-gradient(135deg, ${lane.color}10, transparent)`,
            }}
          >
            {/* Lane header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full shadow-lg"
                  style={{ 
                    backgroundColor: lane.color,
                    boxShadow: `0 0 10px ${lane.color}60`,
                  }}
                />
                <span 
                  className="font-racing text-sm uppercase tracking-wider font-semibold"
                  style={{ color: lane.color }}
                >
                  {lane.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/50">
                <Timer className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-mono font-medium">
                  {lapsCount} {lapsCount === 1 ? 'lap' : 'laps'}
                </span>
              </div>
            </div>

            {/* Times grid */}
            <div className="grid grid-cols-3 gap-2">
              {/* Last Lap */}
              <div className="text-center p-2 rounded-lg bg-background/50">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center justify-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-racing-green animate-pulse' : 'bg-muted-foreground/50'}`} />
                  Last
                </p>
                <p 
                  className={`font-racing text-xl font-bold tabular-nums ${isRunning && lastLap ? 'animate-pulse' : ''}`}
                  style={{ color: lane.color }}
                >
                  {lastLap ? formatTimeShort(lastLap) : '--:---'}
                </p>
              </div>

              {/* Best Lap */}
              <div className="text-center p-2 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-[10px] uppercase tracking-wider text-accent mb-1 flex items-center justify-center gap-1">
                  <Trophy className="w-3 h-3" />
                  Best
                </p>
                <p className="font-racing text-xl font-bold text-accent tabular-nums">
                  {state?.bestLap ? formatTimeShort(state.bestLap) : '--:---'}
                </p>
              </div>

              {/* Average */}
              <div className="text-center p-2 rounded-lg bg-background/50">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center justify-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Avg
                </p>
                <p className="font-racing text-xl font-bold text-muted-foreground tabular-nums">
                  {state?.avgLap ? formatTimeShort(state.avgLap) : '--:---'}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
