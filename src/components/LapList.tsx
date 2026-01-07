import React, { memo, useMemo, useCallback } from 'react';
import { Download, Trophy, Clock, Zap, Gauge } from 'lucide-react';
import { LapData, LaneConfig, formatTimeShort, exportToCSV, calculateSpeed, formatSpeed } from '@/lib/lapTimer';
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
  trackLength?: number;
}

interface LapRowProps {
  lap: LapData;
  lane: LaneConfig | undefined;
  isBest: boolean;
  isRecent: boolean;
  trackLength: number;
}

// Memoized row component for virtualization-like performance
const LapRow = memo(function LapRow({ lap, lane, isBest, isRecent, trackLength }: LapRowProps) {
  const speed = useMemo(() => calculateSpeed(lap.lapTime, trackLength), [lap.lapTime, trackLength]);
  
  return (
    <div
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
            {lane?.name || `Carril ${lap.laneId + 1}`}
          </span>
        </div>
      </div>

      {/* Right: Speed + Time + Best indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Gauge className="w-3 h-3" />
          <span className="font-mono">{formatSpeed(speed)} km/h</span>
        </div>
        
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
});

export const LapList = memo(function LapList({ laps, lanes, trackLength = 5.5 }: LapListProps) {
  // Find best lap per lane - memoized
  const bestPerLane = useMemo(() => {
    const best: Record<number, number> = {};
    for (let i = 0; i < laps.length; i++) {
      const lap = laps[i];
      if (!best[lap.laneId] || lap.lapTime < best[lap.laneId]) {
        best[lap.laneId] = lap.lapTime;
      }
    }
    return best;
  }, [laps]);

  // Sort laps by most recent first - memoized
  const sortedLaps = useMemo(() => [...laps].reverse(), [laps]);

  const handleExport = useCallback(() => {
    exportToCSV(laps, lanes);
  }, [laps, lanes]);

  return (
    <div className="racing-card rounded-xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-racing text-sm uppercase tracking-wider">
            Historial
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
                onClick={handleExport}
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs hover:bg-primary/10 hover:text-primary"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Descargar tiempos en CSV</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {laps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <Zap className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground text-sm">Sin vueltas registradas</p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              ¡Inicia el cronómetro y corre!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {sortedLaps.map((lap, index) => (
              <LapRow
                key={`${lap.laneId}-${lap.lapNumber}-${laps.length - index}`}
                lap={lap}
                lane={lanes[lap.laneId]}
                isBest={lap.lapTime === bestPerLane[lap.laneId]}
                isRecent={index < 3}
                trackLength={trackLength}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
});
