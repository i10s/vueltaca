import React from 'react';
import { Play, Square, RotateCcw, FlipHorizontal2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ControlPanelProps {
  isRunning: boolean;
  hasMultipleCameras: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onFlipCamera: () => void;
}

export function ControlPanel({
  isRunning,
  hasMultipleCameras,
  onStart,
  onStop,
  onReset,
  onFlipCamera,
}: ControlPanelProps) {
  return (
    <div className="flex items-center justify-center gap-3 p-4 bg-card/50 backdrop-blur-sm border-t border-border">
      {/* Main Action Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={isRunning ? onStop : onStart}
            size="lg"
            className={`
              min-w-[140px] h-14 gap-3 font-racing text-lg font-bold
              transition-all duration-200 shadow-lg active:scale-95
              ${isRunning 
                ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/25' 
                : 'bg-racing-green hover:bg-racing-green/90 text-white shadow-racing-green/25'
              }
            `}
            aria-label={isRunning ? 'Stop timer' : 'Start timer'}
          >
            {isRunning ? (
              <>
                <Square className="w-5 h-5 fill-current" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                Start
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{isRunning ? 'Stop recording laps' : 'Start recording laps'}</p>
        </TooltipContent>
      </Tooltip>

      {/* Reset Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onReset}
            variant="outline"
            size="lg"
            className="h-14 gap-2 font-racing border-2 border-muted-foreground/30 hover:border-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-200 active:scale-95"
            aria-label="Reset all laps"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Clear all recorded laps</p>
        </TooltipContent>
      </Tooltip>

      {/* Flip Camera Button */}
      {hasMultipleCameras && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onFlipCamera}
              variant="secondary"
              size="icon"
              className="h-14 w-14 transition-all duration-200 active:scale-95"
              aria-label="Switch camera"
            >
              <FlipHorizontal2 className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Switch camera</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
