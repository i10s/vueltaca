import { useState, useCallback, useEffect, useRef } from 'react';

export function useFullscreen(elementRef?: React.RefObject<HTMLElement>) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSupported] = useState(() => 
    document.fullscreenEnabled || 
    (document as any).webkitFullscreenEnabled ||
    (document as any).mozFullScreenEnabled
  );

  const getFullscreenElement = () => 
    document.fullscreenElement || 
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement;

  const enter = useCallback(async () => {
    const element = elementRef?.current || document.documentElement;
    
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen();
      }
    } catch (err) {
      console.warn('[Fullscreen] Failed to enter:', err);
    }
  }, [elementRef]);

  const exit = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      }
    } catch (err) {
      console.warn('[Fullscreen] Failed to exit:', err);
    }
  }, []);

  const toggle = useCallback(() => {
    if (getFullscreenElement()) {
      exit();
    } else {
      enter();
    }
  }, [enter, exit]);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!getFullscreenElement());
    };

    document.addEventListener('fullscreenchange', handleChange);
    document.addEventListener('webkitfullscreenchange', handleChange);
    document.addEventListener('mozfullscreenchange', handleChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
      document.removeEventListener('webkitfullscreenchange', handleChange);
      document.removeEventListener('mozfullscreenchange', handleChange);
    };
  }, []);

  return {
    isFullscreen,
    isSupported,
    enter,
    exit,
    toggle,
  };
}
