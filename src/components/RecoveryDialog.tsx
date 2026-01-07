import React from 'react';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';
import { RecoverableSession } from '@/hooks/useAutoRecovery';
import { formatTimeShort } from '@/lib/lapTimer';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface RecoveryDialogProps {
  recovery: RecoverableSession;
  onAccept: () => void;
  onDismiss: () => void;
}

export function RecoveryDialog({ recovery, onAccept, onDismiss }: RecoveryDialogProps) {
  const totalLaps = recovery.laneStates.reduce((sum, ls) => sum + ls.laps.length, 0);
  const elapsedMinutes = Math.floor(recovery.elapsedTime / 60000);
  const elapsedSeconds = Math.floor((recovery.elapsedTime % 60000) / 1000);
  
  // Find best lap across all lanes
  let bestLapTime: number | null = null;
  recovery.laneStates.forEach(ls => {
    ls.laps.forEach(lap => {
      if (bestLapTime === null || lap.lapTime < bestLapTime) {
        bestLapTime = lap.lapTime;
      }
    });
  });

  const formatAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-accent/20">
              <AlertTriangle className="w-5 h-5 text-accent" />
            </div>
            <div>
              <DialogTitle className="font-racing">Recover Session?</DialogTitle>
              <DialogDescription className="text-xs">
                Found an unsaved race from {formatAgo(recovery.timestamp)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Session stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Laps</p>
              <p className="font-racing text-xl">{totalLaps}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="font-racing text-xl">{elapsedMinutes}:{elapsedSeconds.toString().padStart(2, '0')}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Best</p>
              <p className="font-racing text-xl text-accent">
                {bestLapTime ? formatTimeShort(bestLapTime) : '--'}
              </p>
            </div>
          </div>

          {/* Lane breakdown */}
          <div className="flex items-center gap-2 justify-center">
            {recovery.lanes.filter(l => l.enabled).map((lane, i) => {
              const laneState = recovery.laneStates[lane.id];
              const lapCount = laneState?.laps.length || 0;
              return (
                <div 
                  key={lane.id}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs"
                  style={{ backgroundColor: `${lane.color}20`, color: lane.color }}
                >
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: lane.color }}
                  />
                  <span className="font-racing">{lane.name}: {lapCount}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onDismiss}>
            <X className="w-4 h-4 mr-1.5" />
            Discard
          </Button>
          <Button className="flex-1" onClick={onAccept}>
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Recover
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
