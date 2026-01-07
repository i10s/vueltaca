import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, AlertCircle, Timer, Maximize, Minimize, Volume2, VolumeX, Mic, MicOff, History } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';
import { useLapTimer, BestLapEvent } from '@/hooks/useLapTimer';
import { useAudioFeedback } from '@/hooks/useAudioFeedback';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useRaceSessions } from '@/hooks/useRaceSessions';
import { useVoiceAnnouncer } from '@/hooks/useVoiceAnnouncer';
import { CameraView } from '@/components/CameraView';
import { TimerDisplay } from '@/components/TimerDisplay';
import { ControlPanel } from '@/components/ControlPanel';
import { DetectionSettings } from '@/components/DetectionSettings';
import { LapList } from '@/components/LapList';
import { CountdownOverlay } from '@/components/CountdownOverlay';
import { BestLapCelebration } from '@/components/BestLapCelebration';
import { RaceLeaderboard } from '@/components/RaceLeaderboard';
import { LapChart } from '@/components/LapChart';
import { RaceModeSettings } from '@/components/RaceModeSettings';
import { ShareResults } from '@/components/ShareResults';
import { LaneCustomizer } from '@/components/LaneCustomizer';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const Index = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  
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
    onLapDetected,
    onBestLap,
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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showCountdown, setShowCountdown] = useState(false);
  const [bestLapCelebration, setBestLapCelebration] = useState<BestLapEvent | null>(null);
  const [raceWinner, setRaceWinner] = useState<{ laneId: number; laneName: string } | null>(null);
  
  const { 
    playLapSound, 
    playBestLapSound, 
    playCountdownTick, 
    playCountdownGo,
    playStopSound,
  } = useAudioFeedback({ soundEnabled, vibrationEnabled: true });
  
  const { announceLap, announceBestLap, announceWinner } = useVoiceAnnouncer({ enabled: config.voiceEnabled });
  
  const { isActive: wakeLockActive, request: requestWakeLock, release: releaseWakeLock } = useWakeLock();
  const { isFullscreen, isSupported: fullscreenSupported, toggle: toggleFullscreen } = useFullscreen(containerRef);
  const { saveSession } = useRaceSessions();
  
  const startTimeRef = useRef<number | null>(null);

  // Auto-start camera after a short delay to ensure video element is mounted
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('[Index] Starting camera after mount...');
      startCamera();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Set up lap detection callbacks
  useEffect(() => {
    onLapDetected.current = (laneId: number, isBestLap: boolean) => {
      const lane = lanes[laneId];
      const laneState = state.lanes[laneId];
      const lapCount = laneState?.laps.length || 0;
      const lastLap = laneState?.laps[lapCount - 1];
      
      if (isBestLap) {
        playBestLapSound();
        if (lastLap) announceBestLap(lane?.name || `Lane ${laneId + 1}`, lastLap.lapTime);
      } else {
        playLapSound();
        if (lastLap) announceLap(lane?.name || `Lane ${laneId + 1}`, lapCount, lastLap.lapTime);
      }
      
      // Check for race win in laps mode
      if (config.raceMode === 'laps' && lapCount >= config.targetLaps) {
        setRaceWinner({ laneId, laneName: lane?.name || `Lane ${laneId + 1}` });
        announceWinner(lane?.name || `Lane ${laneId + 1}`, lapCount);
        handleStop();
      }
    };
    
    onBestLap.current = (event: BestLapEvent) => {
      setBestLapCelebration(event);
    };
  }, [onLapDetected, onBestLap, playLapSound, playBestLapSound, lanes, state.lanes, config, announceLap, announceBestLap, announceWinner]);

  // Wake lock management
  useEffect(() => {
    if (state.isRunning && !wakeLockActive) {
      requestWakeLock();
    } else if (!state.isRunning && wakeLockActive) {
      releaseWakeLock();
    }
  }, [state.isRunning, wakeLockActive, requestWakeLock, releaseWakeLock]);

  // Handle start with countdown
  const handleStartWithCountdown = useCallback(() => {
    setShowCountdown(true);
  }, []);

  const handleCountdownComplete = useCallback(() => {
    setShowCountdown(false);
    startTimeRef.current = performance.now();
    start();
  }, [start]);

  // Handle stop and save session
  const handleStop = useCallback(() => {
    stop();
    playStopSound();
    
    // Save session if we have laps
    const allLaps = getAllLaps();
    if (allLaps.length > 0 && startTimeRef.current) {
      const duration = performance.now() - startTimeRef.current;
      saveSession(allLaps, lanes, duration);
    }
  }, [stop, playStopSound, getAllLaps, lanes, saveSession]);

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
    <div ref={containerRef} className="h-full flex flex-col lg:flex-row bg-background">
      {/* Countdown Overlay */}
      {showCountdown && (
        <CountdownOverlay
          onComplete={handleCountdownComplete}
          onTick={playCountdownTick}
          onGo={playCountdownGo}
        />
      )}
      
      {/* Best Lap Celebration */}
      {bestLapCelebration && (
        <BestLapCelebration
          lapTime={bestLapCelebration.lapTime}
          laneName={bestLapCelebration.laneName}
          laneColor={bestLapCelebration.laneColor}
          onComplete={() => setBestLapCelebration(null)}
        />
      )}

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
            
            {/* Toolbar buttons */}
            <div className="flex items-center gap-1">
              {/* Sound toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                  >
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {soundEnabled ? 'Mute sounds' : 'Enable sounds'}
                </TooltipContent>
              </Tooltip>
              
              {/* Fullscreen toggle */}
              {fullscreenSupported && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={toggleFullscreen}
                    >
                      {isFullscreen ? (
                        <Minimize className="w-4 h-4" />
                      ) : (
                        <Maximize className="w-4 h-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isFullscreen ? 'Exit fullscreen' : 'Fullscreen mode'}
                  </TooltipContent>
                </Tooltip>
              )}
              
              {/* Settings toggle (mobile) */}
              <Button
                variant="secondary"
                size="sm"
                className="lg:hidden h-8"
                onClick={() => setShowSettings(!showSettings)}
              >
                {showSettings ? 'Camera' : 'Settings'}
              </Button>
            </div>
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
            onStart={handleStartWithCountdown}
            onStop={handleStop}
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
        {/* Timer Stats & Leaderboard */}
        <div className="p-4 space-y-3">
          <RaceLeaderboard
            lanes={lanes.slice(0, config.laneCount)}
            laneStates={state.lanes}
            isRunning={state.isRunning}
          />
          <TimerDisplay
            lanes={lanes.slice(0, config.laneCount)}
            laneStates={state.lanes}
            isRunning={state.isRunning}
          />
        </div>

        {/* Lap Chart */}
        <div className="px-4 pb-3">
          <LapChart
            lanes={lanes.slice(0, config.laneCount)}
            laneStates={state.lanes}
          />
        </div>

        {/* Race Mode & Detection Settings */}
        <div className="px-4 pb-4 space-y-4">
          <RaceModeSettings
            config={config}
            onChange={setConfig}
            isRunning={state.isRunning}
          />
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

        {/* Lap History with Share */}
        <div className="flex-1 px-4 pb-4 min-h-0 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/history')} className="gap-1.5">
              <History className="w-4 h-4" />
              History
            </Button>
            <ShareResults laps={getAllLaps()} lanes={lanes} />
          </div>
          <div className="flex-1 min-h-0">
            <LapList 
              laps={getAllLaps()} 
              lanes={lanes} 
            />
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Index;
