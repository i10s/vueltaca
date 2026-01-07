import React, { useEffect, useState, useCallback } from 'react';
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
    lanes,
    config,
    isCalibrating,
    triggerFlashes,
    start,
    stop,
    reset,
    updateLane,
    setConfig,
    startCalibration,
    processFrame,
    getAllLaps,
  } = useLapTimer();

  const [showSettings, setShowSettings] = useState(false);
  const [selectedLane, setSelectedLane] = useState(0);

  // Auto-start camera after a short delay to ensure video element is mounted
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('[Index] Starting camera after mount...');
      startCamera();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Get diff scores from lane states
  const diffScores = state.lanes.map(l => l.diffScore);

  // Handle lane ROI change
  const handleLaneROIChange = useCallback((laneId: number, roi: typeof lanes[0]['roi']) => {
    updateLane(laneId, { roi });
  }, [updateLane]);

  // Handle lane toggle
  const handleToggleLane = useCallback((laneId: number, enabled: boolean) => {
    updateLane(laneId, { enabled });
  }, [updateLane]);

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
          
          <div className="flex items-center gap-2">
            {/* Lane indicators */}
            <div className="hidden sm:flex items-center gap-1">
              {lanes.slice(0, config.laneCount).map((lane, i) => (
                <div
                  key={lane.id}
                  className={`w-3 h-3 rounded-full transition-opacity ${lane.enabled ? 'opacity-100' : 'opacity-30'}`}
                  style={{ backgroundColor: lane.color }}
                />
              ))}
            </div>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="lg:hidden px-3 py-1 rounded bg-secondary text-sm font-mono"
            >
              {showSettings ? 'Camera' : 'Settings'}
            </button>
          </div>
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
              lanes={lanes.slice(0, config.laneCount)}
              selectedLane={selectedLane}
              onLaneROIChange={handleLaneROIChange}
              onFrame={processFrame}
              triggerFlashes={triggerFlashes}
              debugMode={config.debugMode}
              diffScores={diffScores}
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

      {/* Sidebar */}
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
            lanes={lanes.slice(0, config.laneCount)}
            laneStates={state.lanes}
            isRunning={state.isRunning}
          />
        </div>

        {/* Detection Settings */}
        <div className="px-4 pb-4">
          <DetectionSettings
            config={config}
            lanes={lanes.slice(0, config.laneCount)}
            selectedLane={selectedLane}
            onChange={setConfig}
            onSelectLane={setSelectedLane}
            onToggleLane={handleToggleLane}
            onCalibrate={startCalibration}
            isCalibrating={isCalibrating}
            diffScores={diffScores}
          />
        </div>

        {/* Lap History */}
        <div className="flex-1 px-4 pb-4 min-h-0">
          <LapList 
            laps={getAllLaps()} 
            lanes={lanes} 
          />
        </div>
      </aside>
    </div>
  );
};

export default Index;
