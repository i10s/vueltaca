import React, { useState, useEffect } from 'react';

interface CountdownOverlayProps {
  onComplete: () => void;
  onTick?: (count: number) => void;
  onGo?: () => void;
}

export function CountdownOverlay({ onComplete, onTick, onGo }: CountdownOverlayProps) {
  const [count, setCount] = useState(3);
  const [isGo, setIsGo] = useState(false);

  useEffect(() => {
    if (count > 0) {
      onTick?.(count);
      const timer = setTimeout(() => setCount(count - 1), 1000);
      return () => clearTimeout(timer);
    } else if (count === 0 && !isGo) {
      setIsGo(true);
      onGo?.();
      const timer = setTimeout(() => {
        onComplete();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [count, isGo, onComplete, onTick, onGo]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative">
        {/* Animated rings */}
        <div 
          className={`absolute inset-0 rounded-full border-4 ${isGo ? 'border-racing-green' : 'border-primary'} animate-ping opacity-75`}
          style={{ width: '200px', height: '200px', margin: 'auto', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        
        {/* Main number/GO display */}
        <div 
          className={`
            w-48 h-48 rounded-full flex items-center justify-center
            ${isGo 
              ? 'bg-racing-green shadow-[0_0_60px_rgba(34,197,94,0.5)]' 
              : 'bg-gradient-to-br from-primary to-primary/70 shadow-[0_0_60px_rgba(239,68,68,0.5)]'
            }
            transition-all duration-300
          `}
        >
          <span 
            className={`
              font-racing font-bold text-white
              ${isGo ? 'text-5xl' : 'text-8xl'}
              animate-scale-in
            `}
            key={isGo ? 'go' : count}
          >
            {isGo ? 'GO!' : count}
          </span>
        </div>
      </div>
    </div>
  );
}
