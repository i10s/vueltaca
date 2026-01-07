import React from 'react';
import { formatTime, formatTimeShort } from '@/lib/lapTimer';

interface TimerDisplayProps {
  lastLap: number | null;
  bestLap: number | null;
  avgLap: number | null;
  lapsCount: number;
  isRunning: boolean;
}

export function TimerDisplay({ lastLap, bestLap, avgLap, lapsCount, isRunning }: TimerDisplayProps) {
  return (
    <div className="racing-card rounded-xl p-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Last Lap */}
        <div className="col-span-2 text-center border-b border-border pb-4">
          <p className="stat-label mb-1">Last Lap</p>
          <p className={`timer-display text-4xl md:text-5xl font-bold text-primary ${isRunning ? 'glow-pulse' : ''}`}>
            {lastLap ? formatTimeShort(lastLap) : '---.---'}
          </p>
        </div>
        
        {/* Best Lap */}
        <div className="text-center">
          <p className="stat-label mb-1">Best</p>
          <p className="stat-value text-accent">
            {bestLap ? formatTimeShort(bestLap) : '---.---'}
          </p>
        </div>
        
        {/* Average */}
        <div className="text-center">
          <p className="stat-label mb-1">Avg</p>
          <p className="stat-value text-muted-foreground">
            {avgLap ? formatTimeShort(avgLap) : '---.---'}
          </p>
        </div>
        
        {/* Laps Count */}
        <div className="col-span-2 text-center pt-2 border-t border-border">
          <p className="stat-label mb-1">Laps</p>
          <p className="font-racing text-3xl font-bold text-foreground">
            {lapsCount}
          </p>
        </div>
      </div>
    </div>
  );
}
