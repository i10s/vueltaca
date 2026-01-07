import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ROIConfig } from '@/lib/lapTimer';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  roi: ROIConfig;
  onROIChange: (roi: ROIConfig) => void;
  onFrame: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  triggerFlash: boolean;
  debugMode: boolean;
  diffScore: number;
  threshold: number;
}

type DragHandle = 'move' | 'nw' | 'ne' | 'sw' | 'se' | null;

export function CameraView({
  videoRef,
  roi,
  onROIChange,
  onFrame,
  triggerFlash,
  debugMode,
  diffScore,
  threshold,
}: CameraViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
  const [dragHandle, setDragHandle] = useState<DragHandle>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, roi: roi });

  // Handle resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Update video size when video loads
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateVideoSize = () => {
      setVideoSize({
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };

    video.addEventListener('loadedmetadata', updateVideoSize);
    video.addEventListener('resize', updateVideoSize);
    
    if (video.videoWidth > 0) {
      updateVideoSize();
    }

    return () => {
      video.removeEventListener('loadedmetadata', updateVideoSize);
      video.removeEventListener('resize', updateVideoSize);
    };
  }, [videoRef]);

  // Animation loop for frame processing
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let animationId: number;

    const processFrame = () => {
      if (video.readyState >= 2 && video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        onFrame(ctx, canvas.width, canvas.height);
      }
      animationId = requestAnimationFrame(processFrame);
    };

    animationId = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(animationId);
  }, [videoRef, onFrame]);

  // Draw ROI overlay
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay || containerSize.width === 0) return;

    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    overlay.width = containerSize.width;
    overlay.height = containerSize.height;

    // Calculate video display area (object-contain behavior)
    const videoAspect = videoSize.width / videoSize.height || 16/9;
    const containerAspect = containerSize.width / containerSize.height;
    
    let displayWidth: number, displayHeight: number, offsetX: number, offsetY: number;
    
    if (videoAspect > containerAspect) {
      displayWidth = containerSize.width;
      displayHeight = containerSize.width / videoAspect;
      offsetX = 0;
      offsetY = (containerSize.height - displayHeight) / 2;
    } else {
      displayHeight = containerSize.height;
      displayWidth = containerSize.height * videoAspect;
      offsetX = (containerSize.width - displayWidth) / 2;
      offsetY = 0;
    }

    // Clear canvas
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Draw ROI rectangle
    const roiX = offsetX + roi.x * displayWidth;
    const roiY = offsetY + roi.y * displayHeight;
    const roiW = roi.width * displayWidth;
    const roiH = roi.height * displayHeight;

    // Semi-transparent overlay outside ROI
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, overlay.width, overlay.height);
    ctx.clearRect(roiX, roiY, roiW, roiH);

    // ROI border
    ctx.strokeStyle = triggerFlash ? '#22c55e' : '#ef4444';
    ctx.lineWidth = triggerFlash ? 4 : 2;
    ctx.setLineDash([]);
    ctx.strokeRect(roiX, roiY, roiW, roiH);

    // Draw corner handles
    const handleSize = 16;
    const handles = [
      { x: roiX, y: roiY }, // nw
      { x: roiX + roiW, y: roiY }, // ne
      { x: roiX, y: roiY + roiH }, // sw
      { x: roiX + roiW, y: roiY + roiH }, // se
    ];

    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
    handles.forEach(h => {
      ctx.beginPath();
      ctx.arc(h.x, h.y, handleSize / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Draw trigger flash
    if (triggerFlash) {
      ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
      ctx.fillRect(roiX, roiY, roiW, roiH);
    }

    // Debug info
    if (debugMode) {
      // Draw threshold line bar
      const barWidth = 200;
      const barHeight = 20;
      const barX = 10;
      const barY = overlay.height - 40;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 30);
      
      // Background bar
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      // Score bar
      const scoreWidth = Math.min(1, diffScore / 100) * barWidth;
      const scoreColor = diffScore >= threshold ? '#22c55e' : '#ef4444';
      ctx.fillStyle = scoreColor;
      ctx.fillRect(barX, barY, scoreWidth, barHeight);
      
      // Threshold line
      const thresholdX = barX + (threshold / 100) * barWidth;
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(thresholdX, barY - 5);
      ctx.lineTo(thresholdX, barY + barHeight + 5);
      ctx.stroke();
      
      // Labels
      ctx.fillStyle = 'white';
      ctx.font = '12px JetBrains Mono';
      ctx.fillText(`Score: ${diffScore.toFixed(1)} | Threshold: ${threshold}`, barX, barY + barHeight + 18);
    }

  }, [roi, containerSize, videoSize, triggerFlash, debugMode, diffScore, threshold]);

  // Get coordinates relative to video display area
  const getRelativeCoords = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current || videoSize.width === 0) return null;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const videoAspect = videoSize.width / videoSize.height;
    const containerAspect = containerSize.width / containerSize.height;
    
    let displayWidth: number, displayHeight: number, offsetX: number, offsetY: number;
    
    if (videoAspect > containerAspect) {
      displayWidth = containerSize.width;
      displayHeight = containerSize.width / videoAspect;
      offsetX = 0;
      offsetY = (containerSize.height - displayHeight) / 2;
    } else {
      displayHeight = containerSize.height;
      displayWidth = containerSize.height * videoAspect;
      offsetX = (containerSize.width - displayWidth) / 2;
      offsetY = 0;
    }

    return {
      x: (x - offsetX) / displayWidth,
      y: (y - offsetY) / displayHeight,
      displayWidth,
      displayHeight,
      offsetX,
      offsetY,
    };
  }, [containerSize, videoSize]);

  // Determine which handle is being clicked
  const getHandle = useCallback((x: number, y: number): DragHandle => {
    const handleRadius = 0.03; // Relative to video size
    
    const corners = {
      nw: { x: roi.x, y: roi.y },
      ne: { x: roi.x + roi.width, y: roi.y },
      sw: { x: roi.x, y: roi.y + roi.height },
      se: { x: roi.x + roi.width, y: roi.y + roi.height },
    };

    for (const [key, corner] of Object.entries(corners)) {
      const dist = Math.sqrt((x - corner.x) ** 2 + (y - corner.y) ** 2);
      if (dist < handleRadius) {
        return key as DragHandle;
      }
    }

    // Check if inside ROI for move
    if (x >= roi.x && x <= roi.x + roi.width && y >= roi.y && y <= roi.y + roi.height) {
      return 'move';
    }

    return null;
  }, [roi]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const coords = getRelativeCoords(e.clientX, e.clientY);
    if (!coords) return;

    const handle = getHandle(coords.x, coords.y);
    if (handle) {
      setDragHandle(handle);
      setDragStart({ x: coords.x, y: coords.y, roi: { ...roi } });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  }, [getRelativeCoords, getHandle, roi]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragHandle) return;

    const coords = getRelativeCoords(e.clientX, e.clientY);
    if (!coords) return;

    const dx = coords.x - dragStart.x;
    const dy = coords.y - dragStart.y;
    const startROI = dragStart.roi;

    let newROI = { ...roi };

    switch (dragHandle) {
      case 'move':
        newROI.x = Math.max(0, Math.min(1 - roi.width, startROI.x + dx));
        newROI.y = Math.max(0, Math.min(1 - roi.height, startROI.y + dy));
        break;
      case 'nw':
        newROI.x = Math.max(0, Math.min(startROI.x + startROI.width - 0.05, startROI.x + dx));
        newROI.y = Math.max(0, Math.min(startROI.y + startROI.height - 0.05, startROI.y + dy));
        newROI.width = startROI.x + startROI.width - newROI.x;
        newROI.height = startROI.y + startROI.height - newROI.y;
        break;
      case 'ne':
        newROI.y = Math.max(0, Math.min(startROI.y + startROI.height - 0.05, startROI.y + dy));
        newROI.width = Math.max(0.05, Math.min(1 - startROI.x, startROI.width + dx));
        newROI.height = startROI.y + startROI.height - newROI.y;
        break;
      case 'sw':
        newROI.x = Math.max(0, Math.min(startROI.x + startROI.width - 0.05, startROI.x + dx));
        newROI.width = startROI.x + startROI.width - newROI.x;
        newROI.height = Math.max(0.05, Math.min(1 - startROI.y, startROI.height + dy));
        break;
      case 'se':
        newROI.width = Math.max(0.05, Math.min(1 - startROI.x, startROI.width + dx));
        newROI.height = Math.max(0.05, Math.min(1 - startROI.y, startROI.height + dy));
        break;
    }

    onROIChange(newROI);
  }, [dragHandle, dragStart, roi, getRelativeCoords, onROIChange]);

  const handlePointerUp = useCallback(() => {
    setDragHandle(null);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-black overflow-hidden touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        muted
        autoPlay
      />
      
      {/* Hidden canvas for frame processing */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Overlay canvas for ROI */}
      <canvas
        ref={overlayRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Trigger indicator */}
      {triggerFlash && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-racing-green px-4 py-2 rounded-lg font-racing text-white text-lg animate-pulse shadow-lg">
          TRIGGER!
        </div>
      )}
    </div>
  );
}
