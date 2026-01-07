import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Trophy, Clock, Calendar, ChevronRight } from 'lucide-react';
import { useRaceSessions, RaceSession } from '@/hooks/useRaceSessions';
import { formatTimeShort } from '@/lib/lapTimer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const History = () => {
  const navigate = useNavigate();
  const { sessions, deleteSession, clearAllSessions, getBestLapEver } = useRaceSessions();
  const bestEver = getBestLapEver();

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-racing text-lg tracking-wider">Race History</h1>
        </div>
        
        {sessions.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all history?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {sessions.length} race sessions. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={clearAllSessions} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </header>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Best Ever Card */}
          {bestEver && (
            <div className="racing-card rounded-xl p-4 border-2 border-accent bg-gradient-to-br from-accent/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-accent/20">
                  <Trophy className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-accent uppercase tracking-wider font-racing">All-Time Best Lap</p>
                  <p className="font-racing text-3xl font-bold text-accent">
                    {formatTimeShort(bestEver.time)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(bestEver.session.date)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sessions List */}
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Clock className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No races recorded yet</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Complete a race to see it here</p>
              <Button className="mt-4" onClick={() => navigate('/')}>
                Start Racing
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="font-racing text-sm uppercase tracking-wider text-muted-foreground">
                Recent Races ({sessions.length})
              </h2>
              
              {sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onDelete={() => deleteSession(session.id)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

interface SessionCardProps {
  session: RaceSession;
  onDelete: () => void;
}

function SessionCard({ session, onDelete }: SessionCardProps) {
  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get lane with most laps
  const lapsByLane: Record<number, number> = {};
  session.laps.forEach(lap => {
    lapsByLane[lap.laneId] = (lapsByLane[lap.laneId] || 0) + 1;
  });
  
  const winnerLaneId = Object.entries(lapsByLane)
    .sort(([, a], [, b]) => b - a)[0]?.[0];
  const winnerLane = winnerLaneId !== undefined ? session.lanes[parseInt(winnerLaneId)] : null;

  return (
    <div className="racing-card rounded-xl p-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Date and duration */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(session.date)}</span>
            <span className="text-muted-foreground/50">•</span>
            <span>{Math.floor(session.duration / 60000)}min</span>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Laps</p>
              <p className="font-racing text-lg">{session.totalLaps}</p>
            </div>
            {session.bestLapTime && (
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-accent" />
                  Best
                </p>
                <p className="font-racing text-lg text-accent">
                  {formatTimeShort(session.bestLapTime)}
                </p>
              </div>
            )}
            {winnerLane && (
              <div className="ml-auto">
                <p className="text-xs text-muted-foreground">Winner</p>
                <div className="flex items-center gap-1.5">
                  <div 
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: winnerLane.color }}
                  />
                  <span 
                    className="font-racing text-sm"
                    style={{ color: winnerLane.color }}
                  >
                    {winnerLane.name}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Lanes participated */}
          <div className="flex items-center gap-2 mt-2">
            {session.lanes.filter(l => l.enabled).map(lane => (
              <div
                key={lane.id}
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: lane.color }}
                title={lane.name}
              />
            ))}
          </div>
        </div>

        {/* Delete button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this race?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this race session with {session.totalLaps} laps.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default History;
