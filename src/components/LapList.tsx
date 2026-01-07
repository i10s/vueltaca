import React from 'react';
import { Download, Trophy } from 'lucide-react';
import { LapData, LaneConfig, formatTimeShort, exportToCSV } from '@/lib/lapTimer';

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

  return (
    <div className="racing-card rounded-xl flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-racing text-sm uppercase tracking-wider">Lap History</h3>
        
        {laps.length > 0 && (
          <button
            onClick={() => exportToCSV(laps, lanes)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-secondary text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download className="w-3 h-3" />
            CSV
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-racing">
        {laps.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No laps recorded
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="text-xs text-muted-foreground">
                <th className="text-left p-2 w-12">#</th>
                <th className="text-left p-2">Lane</th>
                <th className="text-right p-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {laps.map((lap, index) => {
                const lane = lanes[lap.laneId];
                const isBest = lap.lapTime === bestPerLane[lap.laneId];
                
                return (
                  <tr
                    key={`${lap.laneId}-${lap.lapNumber}-${index}`}
                    className="border-t border-border/50 transition-colors hover:bg-muted/50"
                    style={isBest ? { 
                      background: `linear-gradient(90deg, ${lane?.color}20, transparent)`,
                      borderLeft: `3px solid ${lane?.color}`,
                    } : undefined}
                  >
                    <td className="p-2 font-mono text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {lap.lapNumber}
                        {isBest && <Trophy className="w-3 h-3 text-accent" />}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: lane?.color }}
                        />
                        <span className="text-xs" style={{ color: lane?.color }}>
                          {lane?.name || `Lane ${lap.laneId + 1}`}
                        </span>
                      </div>
                    </td>
                    <td className={`p-2 font-mono text-right ${isBest ? 'font-bold' : ''}`} style={isBest ? { color: lane?.color } : undefined}>
                      {formatTimeShort(lap.lapTime)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
