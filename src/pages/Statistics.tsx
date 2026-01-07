import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Clock, Zap, Target, TrendingUp, Award } from 'lucide-react';
import { useRaceSessions } from '@/hooks/useRaceSessions';
import { formatTimeShort, formatTime } from '@/lib/lapTimer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

const Statistics = () => {
  const navigate = useNavigate();
  const { sessions, getBestLapEver } = useRaceSessions();
  const bestEver = getBestLapEver();

  // Calculate all-time stats
  const stats = useMemo(() => {
    if (sessions.length === 0) return null;

    let totalLaps = 0;
    let totalRacingTime = 0;
    let totalRaces = sessions.length;
    
    // Stats per racer (lane name)
    const racerStats: Record<string, {
      name: string;
      color: string;
      totalLaps: number;
      bestLap: number | null;
      wins: number;
      totalTime: number;
    }> = {};

    sessions.forEach(session => {
      totalRacingTime += session.duration;
      
      // Track laps per lane in this session for winner calculation
      const lapsPerLane: Record<number, number> = {};
      
      session.laps.forEach(lap => {
        totalLaps++;
        const lane = session.lanes[lap.laneId];
        if (!lane) return;
        
        const key = lane.name;
        if (!racerStats[key]) {
          racerStats[key] = {
            name: lane.name,
            color: lane.color,
            totalLaps: 0,
            bestLap: null,
            wins: 0,
            totalTime: 0,
          };
        }
        
        racerStats[key].totalLaps++;
        racerStats[key].totalTime += lap.lapTime;
        
        if (racerStats[key].bestLap === null || lap.lapTime < racerStats[key].bestLap) {
          racerStats[key].bestLap = lap.lapTime;
        }

        lapsPerLane[lap.laneId] = (lapsPerLane[lap.laneId] || 0) + 1;
      });

      // Determine winner of this session
      let maxLaps = 0;
      let winnerId: number | null = null;
      Object.entries(lapsPerLane).forEach(([id, laps]) => {
        if (laps > maxLaps) {
          maxLaps = laps;
          winnerId = parseInt(id);
        }
      });

      if (winnerId !== null && session.lanes[winnerId]) {
        const winnerKey = session.lanes[winnerId].name;
        if (racerStats[winnerKey]) {
          racerStats[winnerKey].wins++;
        }
      }
    });

    // Sort racers by total laps
    const sortedRacers = Object.values(racerStats)
      .sort((a, b) => b.totalLaps - a.totalLaps);

    const maxLapsPerRacer = Math.max(...sortedRacers.map(r => r.totalLaps), 1);

    return {
      totalLaps,
      totalRacingTime,
      totalRaces,
      racers: sortedRacers,
      maxLapsPerRacer,
      avgLapsPerRace: totalLaps / totalRaces,
      avgRaceDuration: totalRacingTime / totalRaces,
    };
  }, [sessions]);

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-racing text-lg tracking-wider">Statistics</h1>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {!stats ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No statistics yet</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Complete some races to see your stats</p>
              <Button className="mt-4" onClick={() => navigate('/')}>
                Start Racing
              </Button>
            </div>
          ) : (
            <>
              {/* All-time best */}
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
                    </div>
                  </div>
                </div>
              )}

              {/* Global stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="racing-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Total Races</span>
                  </div>
                  <p className="font-racing text-2xl">{stats.totalRaces}</p>
                </div>
                
                <div className="racing-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Total Laps</span>
                  </div>
                  <p className="font-racing text-2xl">{stats.totalLaps}</p>
                </div>
                
                <div className="racing-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Racing Time</span>
                  </div>
                  <p className="font-racing text-2xl">{formatDuration(stats.totalRacingTime)}</p>
                </div>
                
                <div className="racing-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Avg Laps/Race</span>
                  </div>
                  <p className="font-racing text-2xl">{stats.avgLapsPerRace.toFixed(1)}</p>
                </div>
              </div>

              {/* Racer leaderboard */}
              <div className="space-y-3">
                <h2 className="font-racing text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Racer Leaderboard
                </h2>

                {stats.racers.map((racer, index) => (
                  <div 
                    key={racer.name}
                    className="racing-card rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {/* Position */}
                      <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-racing text-sm ${
                          index === 0 ? 'bg-accent/20 text-accent' :
                          index === 1 ? 'bg-slate-300/20 text-slate-300' :
                          index === 2 ? 'bg-amber-600/20 text-amber-600' :
                          'bg-muted text-muted-foreground'
                        }`}
                      >
                        {index + 1}
                      </div>

                      {/* Name and color */}
                      <div className="flex items-center gap-2 flex-1">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: racer.color }}
                        />
                        <span 
                          className="font-racing text-lg"
                          style={{ color: racer.color }}
                        >
                          {racer.name}
                        </span>
                      </div>

                      {/* Wins badge */}
                      {racer.wins > 0 && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs">
                          <Trophy className="w-3 h-3" />
                          {racer.wins}
                        </div>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <Progress 
                        value={(racer.totalLaps / stats.maxLapsPerRacer) * 100}
                        className="h-2"
                        style={{ 
                          // @ts-ignore - custom CSS property
                          '--progress-foreground': racer.color 
                        }}
                      />
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Laps</p>
                        <p className="font-racing">{racer.totalLaps}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Best</p>
                        <p className="font-racing text-accent">
                          {racer.bestLap ? formatTimeShort(racer.bestLap) : '--'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Avg</p>
                        <p className="font-racing">
                          {racer.totalLaps > 0 
                            ? formatTimeShort(racer.totalTime / racer.totalLaps)
                            : '--'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Statistics;
