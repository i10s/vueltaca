import React from 'react';
import { Download, Trophy } from 'lucide-react';
import { LapData, formatTimeShort, exportToCSV } from '@/lib/lapTimer';

interface LapListProps {
  laps: LapData[];
  bestLap: number | null;
}

export function LapList({ laps, bestLap }: LapListProps) {
  const reversedLaps = [...laps].reverse();

  return (
    <div className="racing-card rounded-xl flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-racing text-sm uppercase tracking-wider">Lap History</h3>
        
        {laps.length > 0 && (
          <button
            onClick={() => exportToCSV(laps)}
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
                <th className="text-left p-3 w-16">#</th>
                <th className="text-right p-3">Time</th>
                <th className="text-right p-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {reversedLaps.map((lap) => {
                const isBest = lap.lapTime === bestLap;
                return (
                  <tr
                    key={lap.lapNumber}
                    className={`lap-row border-t border-border/50 ${isBest ? 'best' : ''}`}
                  >
                    <td className="p-3 font-mono">
                      <div className="flex items-center gap-2">
                        {lap.lapNumber}
                        {isBest && <Trophy className="w-3 h-3 text-accent" />}
                      </div>
                    </td>
                    <td className={`p-3 font-mono text-right ${isBest ? 'text-accent font-bold' : ''}`}>
                      {formatTimeShort(lap.lapTime)}
                    </td>
                    <td className="p-3 font-mono text-right text-muted-foreground">
                      {formatTimeShort(lap.relativeTime)}
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
