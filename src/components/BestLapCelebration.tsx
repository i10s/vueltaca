import React, { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { formatTimeShort } from '@/lib/lapTimer';

interface BestLapCelebrationProps {
  lapTime: number;
  laneName: string;
  laneColor: string;
  onComplete: () => void;
}

export function BestLapCelebration({ lapTime, laneName, laneColor, onComplete }: BestLapCelebrationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className={`
        fixed inset-0 z-40 flex items-center justify-center pointer-events-none
        transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* Background flash */}
      <div 
        className="absolute inset-0 animate-pulse"
        style={{ 
          background: `radial-gradient(circle at center, ${laneColor}30, transparent 70%)` 
        }}
      />
      
      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full animate-bounce"
            style={{
              backgroundColor: i % 2 === 0 ? laneColor : '#fbbf24',
              left: `${10 + Math.random() * 80}%`,
              top: `${Math.random() * 50}%`,
              animationDelay: `${Math.random() * 0.5}s`,
              animationDuration: `${0.5 + Math.random() * 0.5}s`,
            }}
          />
        ))}
      </div>
      
      {/* Main celebration card */}
      <div 
        className={`
          relative bg-card/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl
          border-2 animate-scale-in
        `}
        style={{ borderColor: laneColor }}
      >
        <div className="flex flex-col items-center gap-4">
          {/* Trophy icon with glow */}
          <div 
            className="p-4 rounded-full"
            style={{ 
              backgroundColor: `${laneColor}20`,
              boxShadow: `0 0 30px ${laneColor}60`,
            }}
          >
            <Trophy className="w-12 h-12 text-accent animate-bounce" />
          </div>
          
          {/* Text */}
          <div className="text-center">
            <h2 className="font-racing text-2xl text-accent mb-1">
              NEW BEST LAP!
            </h2>
            <p className="text-sm text-muted-foreground" style={{ color: laneColor }}>
              {laneName}
            </p>
          </div>
          
          {/* Time display */}
          <div 
            className="font-racing text-5xl font-bold"
            style={{ color: laneColor }}
          >
            {formatTimeShort(lapTime)}
          </div>
        </div>
      </div>
    </div>
  );
}
