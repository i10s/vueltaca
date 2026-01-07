import React, { useState } from 'react';
import { Palette, X, Check } from 'lucide-react';
import { LaneConfig, LANE_COLORS } from '@/lib/lapTimer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface LaneCustomizerProps {
  lane: LaneConfig;
  onUpdate: (updates: Partial<LaneConfig>) => void;
}

const PRESET_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#eab308', // Yellow
  '#84cc16', // Lime
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#d946ef', // Fuchsia
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#ffffff', // White
];

export function LaneCustomizer({ lane, onUpdate }: LaneCustomizerProps) {
  const [open, setOpen] = useState(false);
  const [tempName, setTempName] = useState(lane.name);
  const [tempColor, setTempColor] = useState(lane.color);

  const handleSave = () => {
    onUpdate({ name: tempName, color: tempColor });
    setOpen(false);
  };

  const handleCancel = () => {
    setTempName(lane.name);
    setTempColor(lane.color);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 gap-1 hover:bg-muted"
        >
          <Palette className="w-3 h-3" />
          <span className="text-xs">Edit</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[320px]">
        <DialogHeader>
          <DialogTitle className="font-racing">Customize Lane</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {/* Name input */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Lane Name</label>
            <Input
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              maxLength={12}
              placeholder="Lane name..."
              className="h-9"
            />
          </div>

          {/* Color picker */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Color</label>
            <div className="grid grid-cols-8 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setTempColor(color)}
                  className={`
                    w-7 h-7 rounded-full transition-transform hover:scale-110
                    ${tempColor === color ? 'ring-2 ring-offset-2 ring-offset-background ring-primary' : ''}
                  `}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Preview</label>
            <div 
              className="flex items-center gap-3 p-3 rounded-lg border"
              style={{ borderColor: tempColor, background: `${tempColor}15` }}
            >
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: tempColor }}
              />
              <span 
                className="font-racing text-sm"
                style={{ color: tempColor }}
              >
                {tempName || 'Lane Name'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Check className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
