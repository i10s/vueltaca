import React from 'react';
import { Flag, Timer, Infinity, Ruler } from 'lucide-react';
import { TimerConfig } from '@/lib/lapTimer';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface RaceModeSettingsProps {
  config: TimerConfig;
  onChange: (config: Partial<TimerConfig>) => void;
  isRunning: boolean;
}

export function RaceModeSettings({ config, onChange, isRunning }: RaceModeSettingsProps) {
  const modes = [
    { id: 'free', label: 'Free', icon: Infinity, description: 'No limit' },
    { id: 'laps', label: 'Laps', icon: Flag, description: `${config.targetLaps} laps` },
    { id: 'time', label: 'Time', icon: Timer, description: `${Math.floor(config.targetTime / 60)}min` },
  ] as const;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Flag className="w-3 h-3" />
        <span>Race Mode</span>
      </div>

      {/* Mode buttons */}
      <div className="flex gap-2">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = config.raceMode === mode.id;
          
          return (
            <Popover key={mode.id}>
              <PopoverTrigger asChild>
                <Button
                  variant={isActive ? 'default' : 'secondary'}
                  size="sm"
                  className={`flex-1 gap-1.5 ${isActive ? '' : 'opacity-70'}`}
                  disabled={isRunning}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-xs">{mode.label}</span>
                </Button>
              </PopoverTrigger>
              
              {mode.id !== 'free' && (
                <PopoverContent className="w-48 p-3" align="center">
                  <div className="space-y-3">
                    <p className="text-sm font-medium">
                      {mode.id === 'laps' ? 'Target Laps' : 'Race Duration'}
                    </p>
                    
                    {mode.id === 'laps' ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={config.targetLaps}
                          onChange={(e) => onChange({ 
                            raceMode: 'laps',
                            targetLaps: Math.max(1, parseInt(e.target.value) || 10) 
                          })}
                          className="h-8 w-20 text-center"
                        />
                        <span className="text-sm text-muted-foreground">laps</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={60}
                          value={Math.floor(config.targetTime / 60)}
                          onChange={(e) => onChange({ 
                            raceMode: 'time',
                            targetTime: Math.max(60, (parseInt(e.target.value) || 5) * 60) 
                          })}
                          className="h-8 w-20 text-center"
                        />
                        <span className="text-sm text-muted-foreground">min</span>
                      </div>
                    )}
                    
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => onChange({ raceMode: mode.id })}
                    >
                      Apply
                    </Button>
                  </div>
                </PopoverContent>
              )}
            </Popover>
          );
        })}
      </div>

      {/* Current mode description */}
      <div className="text-center text-xs text-muted-foreground">
        {config.raceMode === 'free' && 'Carrera sin límites'}
        {config.raceMode === 'laps' && `El primero en completar ${config.targetLaps} vueltas gana`}
        {config.raceMode === 'time' && `Carrera de ${Math.floor(config.targetTime / 60)} minutos`}
      </div>

      {/* Track length setting for speed calculation */}
      <div className="mt-4 pt-4 border-t border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Ruler className="w-3 h-3" />
            <span>Longitud del circuito</span>
          </div>
          <span className="text-sm font-mono font-medium text-foreground">
            {config.trackLength.toFixed(1)}m
          </span>
        </div>
        <Slider
          value={[config.trackLength]}
          onValueChange={([value]) => onChange({ trackLength: value })}
          min={2}
          max={20}
          step={0.5}
          disabled={isRunning}
          className="w-full"
        />
        <p className="text-[10px] text-muted-foreground text-center">
          Ajusta para calcular la velocidad en km/h
        </p>
      </div>
    </div>
  );
}
