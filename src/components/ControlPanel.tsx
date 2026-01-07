import React from 'react';
import { Play, Square, RotateCcw, FlipHorizontal2 } from 'lucide-react';

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
    <div className="flex items-center justify-center gap-3 p-4">
      {!isRunning ? (
        <button
          onClick={onStart}
          className="btn-racing btn-start flex items-center gap-2 px-6 py-3 rounded-xl font-racing font-bold text-white"
        >
          <Play className="w-5 h-5" />
          Start
        </button>
      ) : (
        <button
          onClick={onStop}
          className="btn-racing btn-stop flex items-center gap-2 px-6 py-3 rounded-xl font-racing font-bold text-black"
        >
          <Square className="w-5 h-5" />
          Stop
        </button>
      )}
      
      <button
        onClick={onReset}
        className="btn-racing btn-reset flex items-center gap-2 px-6 py-3 rounded-xl font-racing font-bold text-white"
      >
        <RotateCcw className="w-5 h-5" />
        Reset
      </button>
      
      {hasMultipleCameras && (
        <button
          onClick={onFlipCamera}
          className="btn-racing bg-secondary flex items-center gap-2 px-4 py-3 rounded-xl font-mono text-foreground"
        >
          <FlipHorizontal2 className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
