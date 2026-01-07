import { useState, useRef, useCallback, useEffect } from 'react';

export type CameraFacing = 'environment' | 'user';

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  error: string | null;
  isLoading: boolean;
  facing: CameraFacing;
  hasMultipleCameras: boolean;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  flipCamera: () => Promise<void>;
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [facing, setFacing] = useState<CameraFacing>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Check for multiple cameras
  useEffect(() => {
    console.log('[Camera] Checking for available cameras...');
    
    if (!navigator.mediaDevices) {
      console.error('[Camera] mediaDevices API not available');
      setError('Camera API not available. Please use HTTPS or localhost.');
      return;
    }

    navigator.mediaDevices.enumerateDevices().then(devices => {
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      console.log('[Camera] Found cameras:', videoInputs.length, videoInputs);
      setHasMultipleCameras(videoInputs.length > 1);
    }).catch((err) => {
      console.error('[Camera] Error enumerating devices:', err);
      setHasMultipleCameras(false);
    });
  }, []);

  const stopCamera = useCallback(() => {
    console.log('[Camera] Stopping camera...');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log('[Camera] Stopping track:', track.kind, track.label);
        track.stop();
      });
      streamRef.current = null;
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async (facingMode: CameraFacing = 'environment') => {
    console.log('[Camera] Starting camera with facing:', facingMode);
    setIsLoading(true);
    setError(null);

    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not available. Use HTTPS or localhost.');
      }

      // Stop existing stream
      if (streamRef.current) {
        console.log('[Camera] Stopping existing stream...');
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      console.log('[Camera] Requesting getUserMedia with constraints:', constraints);
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('[Camera] Got stream:', newStream.id, 'tracks:', newStream.getTracks().length);
      
      streamRef.current = newStream;
      
      // Wait a tick for video element to be available if needed
      await new Promise(resolve => setTimeout(resolve, 50));
      
      if (videoRef.current) {
        console.log('[Camera] Attaching stream to video element...');
        videoRef.current.srcObject = newStream;
        
        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          const video = videoRef.current!;
          
          const onCanPlay = () => {
            console.log('[Camera] Video can play:', video.videoWidth, 'x', video.videoHeight);
            video.removeEventListener('canplay', onCanPlay);
            resolve();
          };
          
          // If already ready
          if (video.readyState >= 3) {
            console.log('[Camera] Video already ready');
            resolve();
            return;
          }
          
          video.addEventListener('canplay', onCanPlay);
          
          // Timeout fallback
          setTimeout(() => {
            console.log('[Camera] Video ready via timeout, readyState:', video.readyState);
            video.removeEventListener('canplay', onCanPlay);
            resolve();
          }, 3000);
        });
        
        console.log('[Camera] Playing video...');
        await videoRef.current.play();
        console.log('[Camera] Video playing successfully');
      } else {
        console.warn('[Camera] videoRef.current is null, will retry...');
        // Store stream but don't set error - the component will attach it when ready
      }
      
      setStream(newStream);
      setFacing(facingMode);
      console.log('[Camera] Camera started successfully');
    } catch (err) {
      console.error('[Camera] Error starting camera:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      const name = err instanceof Error ? err.name : '';
      
      if (name === 'NotAllowedError' || message.includes('Permission')) {
        setError('Camera permission denied. Please allow camera access.');
      } else if (name === 'NotFoundError' || message.includes('DevicesNotFoundError')) {
        setError('No camera found on this device.');
      } else if (name === 'NotReadableError' || message.includes('TrackStartError')) {
        setError('Camera is being used by another application.');
      } else if (name === 'OverconstrainedError') {
        setError('Camera does not support the requested configuration.');
      } else {
        setError(`Camera error: ${message}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const flipCamera = useCallback(async () => {
    const newFacing = facing === 'environment' ? 'user' : 'environment';
    await startCamera(newFacing);
  }, [facing, startCamera]);

  // Attach stream to video element if it becomes available later
  useEffect(() => {
    if (streamRef.current && videoRef.current && !videoRef.current.srcObject) {
      console.log('[Camera] Late-attaching stream to video element');
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(console.error);
    }
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    videoRef,
    stream,
    error,
    isLoading,
    facing,
    hasMultipleCameras,
    startCamera: () => startCamera(facing),
    stopCamera,
    flipCamera,
  };
}
