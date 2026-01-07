import React from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LaneConfig, LaneState, formatTimeShort } from '@/lib/lapTimer';

interface RacePosition {
  laneId: number;
  laneName: string;
  laneColor: string;
  lapsCompleted: number;
  bestLap: number | null;
  lastLap: number | null;
  delta: number | null; // Difference from best lap (positive = slower)
  position: number;
}

interface RaceLeaderboardProps {
  lanes: LaneConfig[];
  laneStates: LaneState[];
  isRunning: boolean;
}

export function RaceLeaderboard({ lanes, laneStates, isRunning }: RaceLeaderboardProps) {
  // Calculate positions based on laps completed and best times
  const positions: RacePosition[] = lanes
    .filter(lane => lane.enabled)
    .map(lane => {
      const state = laneStates[lane.id];
      const lapsCompleted = state?.laps.length || 0;
      const bestLap = state?.bestLap || null;
      const lastLap = lapsCompleted > 0 ? state.laps[lapsCompleted - 1].lapTime : null;
      const delta = bestLap && lastLap ? lastLap - bestLap : null;

      return {
        laneId: lane.id,
        laneName: lane.name,
        laneColor: lane.color,
        lapsCompleted,
        bestLap,
        lastLap,
        delta,
        position: 0, // Will be set after sorting
      };
    })
    .sort((a, b) => {
      // Sort by laps completed (desc), then by best lap time (asc)
      if (b.lapsCompleted !== a.lapsCompleted) {
        return b.lapsCompleted - a.lapsCompleted;
      }
      if (a.bestLap && b.bestLap) {
        return a.bestLap - b.bestLap;
      }
      return 0;
    })
    .map((pos, index) => ({ ...pos, position: index + 1 }));

  if (positions.length === 0) {
    return null;
  }

  return (
    <div className="racing-card rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/30">
        <Trophy className="w-4 h-4 text-accent" />
        <h3 className="font-racing text-sm uppercase tracking-wider">Positions</h3>
      </div>

      {/* Positions list */}
      <div className="divide-y divide-border/50">
        {positions.map((pos) => (
          <div
            key={pos.laneId}
            className={`
              flex items-center gap-3 p-3 transition-all duration-300
              ${pos.position === 1 ? 'bg-accent/10' : ''}
            `}
          >
            {/* Position number */}
            <div 
              className={`
                w-8 h-8 rounded-full flex items-center justify-center font-racing font-bold text-sm
                ${pos.position === 1 
                  ? 'bg-accent text-accent-foreground shadow-lg' 
                  : 'bg-muted text-muted-foreground'
                }
              `}
            >
              {pos.position}
            </div>

            {/* Lane info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: pos.laneColor }}
                />
                <span 
                  className="font-racing text-sm truncate"
                  style={{ color: pos.laneColor }}
                >
                  {pos.laneName}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground font-mono">
                  {pos.lapsCompleted} {pos.lapsCompleted === 1 ? 'lap' : 'laps'}
                </span>
                {pos.bestLap && (
                  <span className="text-xs text-accent font-mono">
                    Best: {formatTimeShort(pos.bestLap)}
                  </span>
                )}
              </div>
            </div>

            {/* Delta indicator */}
            {pos.delta !== null && pos.lapsCompleted > 1 && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono ${
                pos.delta === 0 
                  ? 'bg-accent/20 text-accent' 
                  : pos.delta > 0 
                    ? 'bg-destructive/20 text-destructive' 
                    : 'bg-racing-green/20 text-racing-green'
              }`}>
                {pos.delta === 0 ? (
                  <Minus className="w-3 h-3" />
                ) : pos.delta > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {pos.delta > 0 ? '+' : ''}{(pos.delta / 1000).toFixed(2)}s
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
