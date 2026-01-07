import React, { useEffect, useState } from 'react';
import { Camera, AlertCircle, Timer } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import { useLapTimer } from '@/hooks/useLapTimer';
import { CameraView } from '@/components/CameraView';
import { TimerDisplay } from '@/components/TimerDisplay';
import { ControlPanel } from '@/components/ControlPanel';
import { DetectionSettings } from '@/components/DetectionSettings';
import { LapList } from '@/components/LapList';

const Index = () => {
  const {
    videoRef,
    stream,
    error: cameraError,
    isLoading,
    hasMultipleCameras,
    startCamera,
    flipCamera,
  } = useCamera();

  const {
    state,
    roi,
    config,
    diffScore,
    isCalibrating,
    triggerFlash,
    start,
    stop,
    reset,
    setROI,
    setConfig,
    startCalibration,
    processFrame,
  } = useLapTimer();

  const [showSettings, setShowSettings] = useState(false);

  // Auto-start camera on mount
  useEffect(() => {
    startCamera();
  }, []);

  return (
    <div className="h-full flex flex-col lg:flex-row bg-background">
      {/* Main Camera Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <Timer className="w-6 h-6 text-primary" />
            <h1 className="font-racing text-lg md:text-xl tracking-wider">
              Scalextric Lap Timer
            </h1>
          </div>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="lg:hidden px-3 py-1 rounded bg-secondary text-sm font-mono"
          >
            {showSettings ? 'Camera' : 'Settings'}
          </button>
        </header>

        {/* Camera / Error View */}
        <div className="flex-1 relative min-h-0">
          {cameraError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <AlertCircle className="w-16 h-16 text-destructive mb-4" />
              <p className="text-lg text-foreground mb-2">Camera Error</p>
              <p className="text-muted-foreground mb-6">{cameraError}</p>
              <button
                onClick={startCamera}
                className="btn-racing btn-start px-6 py-3 rounded-xl font-racing text-white"
              >
                Try Again
              </button>
            </div>
          ) : isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Camera className="w-16 h-16 text-muted-foreground animate-pulse mb-4" />
              <p className="text-muted-foreground">Starting camera...</p>
            </div>
          ) : !stream ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <Camera className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg text-foreground mb-2">Camera Required</p>
              <p className="text-muted-foreground mb-6">
                Point your camera at the finish line to start timing laps
              </p>
              <button
                onClick={startCamera}
                className="btn-racing btn-start px-6 py-3 rounded-xl font-racing text-white"
              >
                Start Camera
              </button>
            </div>
          ) : (
            <CameraView
              videoRef={videoRef}
              roi={roi}
              onROIChange={setROI}
              onFrame={processFrame}
              triggerFlash={triggerFlash}
              debugMode={config.debugMode}
              diffScore={diffScore}
              threshold={config.threshold}
            />
          )}
        </div>

        {/* Controls */}
        {stream && (
          <ControlPanel
            isRunning={state.isRunning}
            hasMultipleCameras={hasMultipleCameras}
            onStart={start}
            onStop={stop}
            onReset={reset}
            onFlipCamera={flipCamera}
          />
        )}
      </div>

      {/* Sidebar (mobile: toggleable, desktop: always visible) */}
      <aside
        className={`
          ${showSettings ? 'flex' : 'hidden'} lg:flex
          flex-col w-full lg:w-80 xl:w-96 
          border-t lg:border-t-0 lg:border-l border-border
          bg-card overflow-hidden
        `}
      >
        {/* Timer Stats */}
        <div className="p-4">
          <TimerDisplay
            lastLap={state.laps.length > 0 ? state.laps[state.laps.length - 1].lapTime : null}
            bestLap={state.bestLap}
            avgLap={state.avgLap}
            lapsCount={state.laps.length}
            isRunning={state.isRunning}
          />
        </div>

        {/* Detection Settings */}
        <div className="px-4 pb-4">
          <DetectionSettings
            config={config}
            onChange={setConfig}
            onCalibrate={startCalibration}
            isCalibrating={isCalibrating}
            diffScore={diffScore}
          />
        </div>

        {/* Lap History */}
        <div className="flex-1 px-4 pb-4 min-h-0">
          <LapList laps={state.laps} bestLap={state.bestLap} />
        </div>
      </aside>
    </div>
  );
};

export default Index;
