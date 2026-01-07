import React, { useMemo, memo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { LaneConfig, LaneState, formatTimeShort, isOutlier } from '@/lib/lapTimer';

interface LapChartProps {
  lanes: LaneConfig[];
  laneStates: LaneState[];
}

export const LapChart = memo(function LapChart({ lanes, laneStates }: LapChartProps) {
  // Pre-calculate all lap times per lane for outlier detection
  const laneAllTimes = useMemo(() => {
    const result: Map<number, number[]> = new Map();
    lanes.forEach(lane => {
      if (!lane.enabled) return;
      const state = laneStates[lane.id];
      if (state) {
        result.set(lane.id, state.laps.map(l => l.lapTime));
      }
    });
    return result;
  }, [lanes, laneStates]);

  const chartData = useMemo(() => {
    const maxLaps = Math.max(...laneStates.map(s => s.laps.length), 0);
    if (maxLaps === 0) return [];

    const data: Array<{ lap: number; [key: string]: number | null }> = [];
    
    for (let i = 0; i < maxLaps; i++) {
      const point: { lap: number; [key: string]: number | null } = { lap: i + 1 };
      
      lanes.forEach((lane) => {
        if (!lane.enabled) return;
        const state = laneStates[lane.id];
        const lap = state?.laps[i];
        if (lap) {
          const allTimes = laneAllTimes.get(lane.id) || [];
          // Filter outliers - don't show in chart
          if (!isOutlier(lap.lapTime, allTimes)) {
            point[lane.name] = lap.lapTime / 1000;
          } else {
            point[lane.name] = null; // Will be skipped with connectNulls
          }
        }
      });
      
      data.push(point);
    }
    
    return data;
  }, [lanes, laneStates, laneAllTimes]);

  // Calculate best lap excluding outliers
  const bestLapTime = useMemo(() => {
    let best = Infinity;
    laneStates.forEach((state, laneId) => {
      const allTimes = laneAllTimes.get(laneId) || [];
      state.laps.forEach(lap => {
        if (!isOutlier(lap.lapTime, allTimes) && lap.lapTime < best) {
          best = lap.lapTime;
        }
      });
    });
    return best === Infinity ? null : best / 1000;
  }, [laneStates, laneAllTimes]);

  const enabledLanes = lanes.filter(l => l.enabled);
  const hasData = chartData.length > 0;

  if (!hasData) {
    return (
      <div className="racing-card rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-racing text-sm uppercase tracking-wider">Lap Times</h3>
        </div>
        <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
          Complete laps to see the chart
        </div>
      </div>
    );
  }

  return (
    <div className="racing-card rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="font-racing text-sm uppercase tracking-wider">Lap Times</h3>
      </div>

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <XAxis 
              dataKey="lap" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={(v) => `${v.toFixed(1)}s`}
              domain={['auto', 'auto']}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number, name: string) => [
                formatTimeShort(value * 1000),
                name
              ]}
              labelFormatter={(label) => `Lap ${label}`}
            />
            
            {/* Best lap reference line */}
            {bestLapTime && (
              <ReferenceLine 
                y={bestLapTime} 
                stroke="hsl(var(--accent))" 
                strokeDasharray="3 3"
                strokeWidth={1}
              />
            )}

            {/* Lane lines */}
            {enabledLanes.map((lane) => (
              <Line
                key={lane.id}
                type="monotone"
                dataKey={lane.name}
                stroke={lane.color}
                strokeWidth={2}
                dot={{ fill: lane.color, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        {enabledLanes.map((lane) => (
          <div key={lane.id} className="flex items-center gap-1.5">
            <div 
              className="w-3 h-1 rounded-full"
              style={{ backgroundColor: lane.color }}
            />
            <span className="text-xs text-muted-foreground">{lane.name}</span>
          </div>
        ))}
        {bestLapTime && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 border-t-2 border-dashed border-accent" />
            <span className="text-xs text-accent">Best</span>
          </div>
        )}
      </div>
    </div>
  );
});
