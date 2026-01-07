import React, { useState } from 'react';
import { Share2, Copy, Check, Download, X } from 'lucide-react';
import { LapData, LaneConfig, formatTimeShort, exportToCSV } from '@/lib/lapTimer';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface ShareResultsProps {
  laps: LapData[];
  lanes: LaneConfig[];
  raceDuration?: number;
}

export function ShareResults({ laps, lanes, raceDuration }: ShareResultsProps) {
  const [copied, setCopied] = useState(false);

  if (laps.length === 0) return null;

  // Calculate stats
  const lapsByLane: Record<number, LapData[]> = {};
  laps.forEach(lap => {
    if (!lapsByLane[lap.laneId]) lapsByLane[lap.laneId] = [];
    lapsByLane[lap.laneId].push(lap);
  });

  const generateShareText = (): string => {
    let text = '🏎️ Scalextric Lap Timer Results\n';
    text += '━━━━━━━━━━━━━━━━━━━━\n\n';

    const sortedLanes = Object.entries(lapsByLane)
      .map(([laneId, laneLaps]) => {
        const lane = lanes[parseInt(laneId)];
        const best = Math.min(...laneLaps.map(l => l.lapTime));
        return { lane, laneLaps, best };
      })
      .sort((a, b) => {
        // Sort by laps, then by best time
        if (b.laneLaps.length !== a.laneLaps.length) {
          return b.laneLaps.length - a.laneLaps.length;
        }
        return a.best - b.best;
      });

    sortedLanes.forEach(({ lane, laneLaps, best }, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      const avg = laneLaps.reduce((s, l) => s + l.lapTime, 0) / laneLaps.length;
      
      text += `${medal} ${lane?.name || `Lane ${parseInt(lane?.id?.toString() || '0') + 1}`}\n`;
      text += `   Laps: ${laneLaps.length}\n`;
      text += `   Best: ${formatTimeShort(best)}\n`;
      text += `   Avg:  ${formatTimeShort(avg)}\n\n`;
    });

    text += '━━━━━━━━━━━━━━━━━━━━\n';
    text += 'laptimer.lovable.app';

    return text;
  };

  const handleCopy = async () => {
    const text = generateShareText();
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Results copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    const text = generateShareText();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Scalextric Lap Timer Results',
          text,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          handleCopy(); // Fallback to copy
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="font-racing">Share Results</DialogTitle>
        </DialogHeader>

        {/* Preview */}
        <div className="bg-muted rounded-lg p-4 font-mono text-xs whitespace-pre-wrap max-h-64 overflow-y-auto">
          {generateShareText()}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => exportToCSV(laps, lanes)}>
            <Download className="w-4 h-4 mr-1" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <Check className="w-4 h-4 mr-1 text-racing-green" />
            ) : (
              <Copy className="w-4 h-4 mr-1" />
            )}
            Copy
          </Button>
          <Button size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-1" />
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
