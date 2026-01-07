import React from 'react';
import { Download, Trophy, Clock, Zap } from 'lucide-react';
import { LapData, LaneConfig, formatTimeShort, exportToCSV } from '@/lib/lapTimer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LapListProps {
  laps: LapData[];
  lanes: LaneConfig[];
}

export function LapList({ laps, lanes }: LapListProps) {
  // Find best lap per lane
  const bestPerLane: Record<number, number> = {};
  laps.forEach(lap => {
    if (!bestPerLane[lap.laneId] || lap.lapTime < bestPerLane[lap.laneId]) {
      bestPerLane[lap.laneId] = lap.lapTime;
    }
  });

  // Sort laps by most recent first for better UX
  const sortedLaps = [...laps].reverse();

  return (
    <div className="racing-card rounded-xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-racing text-sm uppercase tracking-wider">
            Lap History
          </h3>
          {laps.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-mono">
              {laps.length}
            </span>
          )}
        </div>
        
        {laps.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => exportToCSV(laps, lanes)}
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs hover:bg-primary/10 hover:text-primary"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Download lap times as CSV</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {laps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <Zap className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground text-sm">No laps recorded yet</p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Start the timer and race!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {sortedLaps.map((lap, index) => {
              const lane = lanes[lap.laneId];
              const isBest = lap.lapTime === bestPerLane[lap.laneId];
              const isRecent = index < 3;
              
              return (
                <div
                  key={`${lap.laneId}-${lap.lapNumber}-${laps.length - index}`}
                  className={`
                    flex items-center justify-between p-3 transition-colors
                    ${isRecent ? 'bg-muted/30' : ''}
                    ${isBest ? 'bg-gradient-to-r from-accent/20 to-transparent' : ''}
                  `}
                  style={isBest ? { borderLeft: `3px solid ${lane?.color}` } : undefined}
                >
                  {/* Left: Lap number + Lane indicator */}
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-muted-foreground text-sm w-6">
                      #{lap.lapNumber}
                    </span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: lane?.color }}
                      />
                      <span 
                        className="text-xs font-medium"
                        style={{ color: lane?.color }}
                      >
                        {lane?.name || `Lane ${lap.laneId + 1}`}
                      </span>
                    </div>
                  </div>

                  {/* Right: Time + Best indicator */}
                  <div className="flex items-center gap-2">
                    {isBest && (
                      <Trophy className="w-4 h-4 text-accent animate-pulse" />
                    )}
                    <span 
                      className={`font-mono text-sm ${isBest ? 'font-bold text-accent' : 'text-foreground'}`}
                    >
                      {formatTimeShort(lap.lapTime)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
