import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { LaneConfig } from '@/lib/lapTimer';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  lanes: LaneConfig[];
  selectedLane: number;
  onLaneROIChange: (laneId: number, roi: LaneConfig['roi']) => void;
  onFrame: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  triggerFlashes: boolean[];
  debugMode: boolean;
  diffScores: number[];
  threshold: number;
}

type DragHandle = 'move' | 'nw' | 'ne' | 'sw' | 'se' | null;

export function CameraView({
  videoRef,
  lanes,
  selectedLane,
  onLaneROIChange,
  onFrame,
  triggerFlashes,
  debugMode,
  diffScores,
  threshold,
}: CameraViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });
  const [dragHandle, setDragHandle] = useState<DragHandle>(null);
  const [dragLane, setDragLane] = useState<number>(-1);
  const dragStartRef = useRef({ x: 0, y: 0, roi: lanes[0]?.roi });

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Update video size when video loads
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateVideoSize = () => {
      if (video.videoWidth > 0) {
        setVideoSize({
          width: video.videoWidth,
          height: video.videoHeight,
        });
      }
    };

    video.addEventListener('loadedmetadata', updateVideoSize);
    video.addEventListener('resize', updateVideoSize);
    updateVideoSize();

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
    let lastFrameTime = 0;
    const targetFPS = 30; // Limit to 30fps for performance
    const frameInterval = 1000 / targetFPS;

    const processFrame = (timestamp: number) => {
      if (timestamp - lastFrameTime >= frameInterval) {
        if (video.readyState >= 2 && video.videoWidth > 0) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
          ctx.drawImage(video, 0, 0);
          onFrame(ctx, canvas.width, canvas.height);
        }
        lastFrameTime = timestamp;
      }
      animationId = requestAnimationFrame(processFrame);
    };

    animationId = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(animationId);
  }, [videoRef, onFrame]);

  // Calculate video display bounds
  const displayBounds = useMemo(() => {
    if (containerSize.width === 0 || videoSize.width === 0) {
      return { width: 0, height: 0, offsetX: 0, offsetY: 0 };
    }

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

    return { width: displayWidth, height: displayHeight, offsetX, offsetY };
  }, [containerSize, videoSize]);

  // Draw overlay
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay || displayBounds.width === 0) return;

    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    overlay.width = containerSize.width;
    overlay.height = containerSize.height;

    const { width: dw, height: dh, offsetX, offsetY } = displayBounds;

    // Clear
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Draw darkened area outside video
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, overlay.width, overlay.height);
    ctx.clearRect(offsetX, offsetY, dw, dh);

    // Draw each lane ROI
    lanes.forEach((lane, index) => {
      if (!lane.enabled) return;

      const roi = lane.roi;
      const roiX = offsetX + roi.x * dw;
      const roiY = offsetY + roi.y * dh;
      const roiW = roi.width * dw;
      const roiH = roi.height * dh;

      const isFlashing = triggerFlashes[index];
      const isSelected = index === selectedLane;

      // ROI fill on flash
      if (isFlashing) {
        ctx.fillStyle = `${lane.color}40`;
        ctx.fillRect(roiX, roiY, roiW, roiH);
      }

      // ROI border
      ctx.strokeStyle = lane.color;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.setLineDash(isSelected ? [] : [5, 5]);
      ctx.strokeRect(roiX, roiY, roiW, roiH);

      // Lane label
      ctx.fillStyle = lane.color;
      ctx.font = 'bold 12px JetBrains Mono';
      ctx.fillText(lane.name, roiX + 4, roiY - 6);

      // Draw handles only for selected lane
      if (isSelected) {
        const handleSize = 12;
        const handles = [
          { x: roiX, y: roiY },
          { x: roiX + roiW, y: roiY },
          { x: roiX, y: roiY + roiH },
          { x: roiX + roiW, y: roiY + roiH },
        ];

        ctx.shadowColor = lane.color;
        ctx.shadowBlur = 8;
        handles.forEach(h => {
          ctx.fillStyle = lane.color;
          ctx.beginPath();
          ctx.arc(h.x, h.y, handleSize / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(h.x, h.y, handleSize / 3, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.shadowBlur = 0;
      }
    });

    // Debug overlay
    if (debugMode) {
      const barWidth = 180;
      const barHeight = 14;
      const padding = 8;
      const startY = containerSize.height - padding - (lanes.length * (barHeight + 6));

      lanes.forEach((lane, i) => {
        if (!lane.enabled) return;
        
        const y = startY + i * (barHeight + 6);
        const score = diffScores[i] || 0;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(padding - 4, y - 2, barWidth + 8, barHeight + 4);
        
        // Track
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(padding, y, barWidth, barHeight);
        
        // Score bar
        const scoreWidth = Math.min(1, score / 100) * barWidth;
        ctx.fillStyle = score >= threshold ? '#22c55e' : lane.color;
        ctx.fillRect(padding, y, scoreWidth, barHeight);
        
        // Threshold line
        const thresholdX = padding + (threshold / 100) * barWidth;
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(thresholdX, y - 2);
        ctx.lineTo(thresholdX, y + barHeight + 2);
        ctx.stroke();
        
        // Label
        ctx.fillStyle = 'white';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText(`${lane.name}: ${score.toFixed(1)}`, padding + barWidth + 8, y + 11);
      });
    }
  }, [lanes, selectedLane, containerSize, displayBounds, triggerFlashes, debugMode, diffScores, threshold]);

  // Get coordinates relative to video display area
  const getRelativeCoords = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current || displayBounds.width === 0) return null;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const { width: dw, height: dh, offsetX, offsetY } = displayBounds;

    return {
      x: (x - offsetX) / dw,
      y: (y - offsetY) / dh,
    };
  }, [displayBounds]);

  // Determine which handle is being clicked
  const getHandle = useCallback((x: number, y: number, laneIndex: number): DragHandle => {
    const lane = lanes[laneIndex];
    if (!lane) return null;

    const roi = lane.roi;
    const handleRadius = 0.03;
    
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

    if (x >= roi.x && x <= roi.x + roi.width && y >= roi.y && y <= roi.y + roi.height) {
      return 'move';
    }

    return null;
  }, [lanes]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const coords = getRelativeCoords(e.clientX, e.clientY);
    if (!coords) return;

    // Check selected lane first, then others
    const lanesToCheck = [selectedLane, ...lanes.map((_, i) => i).filter(i => i !== selectedLane)];
    
    for (const laneIndex of lanesToCheck) {
      const lane = lanes[laneIndex];
      if (!lane?.enabled) continue;

      const handle = getHandle(coords.x, coords.y, laneIndex);
      if (handle) {
        setDragHandle(handle);
        setDragLane(laneIndex);
        dragStartRef.current = { x: coords.x, y: coords.y, roi: { ...lane.roi } };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }
    }
  }, [getRelativeCoords, getHandle, selectedLane, lanes]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragHandle || dragLane < 0) return;

    const coords = getRelativeCoords(e.clientX, e.clientY);
    if (!coords) return;

    const dx = coords.x - dragStartRef.current.x;
    const dy = coords.y - dragStartRef.current.y;
    const startROI = dragStartRef.current.roi;
    const lane = lanes[dragLane];
    if (!lane) return;

    let newROI = { ...lane.roi };

    switch (dragHandle) {
      case 'move':
        newROI.x = Math.max(0, Math.min(1 - lane.roi.width, startROI.x + dx));
        newROI.y = Math.max(0, Math.min(1 - lane.roi.height, startROI.y + dy));
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

    onLaneROIChange(dragLane, newROI);
  }, [dragHandle, dragLane, lanes, getRelativeCoords, onLaneROIChange]);

  const handlePointerUp = useCallback(() => {
    setDragHandle(null);
    setDragLane(-1);
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
      
      <canvas ref={canvasRef} className="hidden" />
      <canvas
        ref={overlayRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Trigger indicators */}
      {lanes.map((lane, i) => 
        triggerFlashes[i] && lane.enabled && (
          <div
            key={lane.id}
            className="absolute top-4 px-3 py-1 rounded-lg font-racing text-white text-sm shadow-lg animate-pulse"
            style={{ 
              left: `${20 + i * 25}%`,
              backgroundColor: lane.color,
              boxShadow: `0 0 20px ${lane.color}`,
            }}
          >
            {lane.name}
          </div>
        )
      )}
    </div>
  );
}
