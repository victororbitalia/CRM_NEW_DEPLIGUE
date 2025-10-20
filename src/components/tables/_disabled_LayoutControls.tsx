'use client';

import React, { useState, useRef, useEffect } from 'react';
import Button from '@/components/ui/Button';

export type InteractionMode = 'navigate' | 'move';

interface LayoutControlsProps {
  scale: number;
  onScaleChange: (scale: number) => void;
  onReset: () => void;
  onFitToScreen: () => void;
  interactionMode: InteractionMode;
  onInteractionModeChange: (mode: InteractionMode) => void;
  areas: Array<{ id: string; name: string }>;
  onCenterArea: (areaId: string) => void;
  className?: string;
}

export default function LayoutControls({
  scale,
  onScaleChange,
  onReset,
  onFitToScreen,
  interactionMode,
  onInteractionModeChange,
  areas,
  onCenterArea,
  className = '',
}: LayoutControlsProps) {
  const [isMinimapOpen, setIsMinimapOpen] = useState(false);
  const scaleSliderRef = useRef<HTMLInputElement>(null);

  // Handle zoom with buttons
  const handleZoomIn = () => {
    const newScale = Math.min(scale * 1.2, 3);
    onScaleChange(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale * 0.8, 0.5);
    onScaleChange(newScale);
  };

  // Handle zoom with slider
  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onScaleChange(parseFloat(e.target.value));
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          handleZoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          handleZoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          onReset();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scale]);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Interaction Mode Toggle */}
      <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
        <Button
          variant={interactionMode === 'navigate' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => onInteractionModeChange('navigate')}
          className="flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Navegar
        </Button>
        <Button
          variant={interactionMode === 'move' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => onInteractionModeChange('move')}
          className="flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          Mover Mesas
        </Button>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomOut}
          disabled={scale <= 0.5}
          className="w-8 h-8 p-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </Button>
        
        <div className="flex-1 px-2">
          <input
            ref={scaleSliderRef}
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={scale}
            onChange={handleScaleChange}
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomIn}
          disabled={scale >= 3}
          className="w-8 h-8 p-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Button>
        
        <span className="text-xs text-gray-600 min-w-[3rem] text-center">
          {Math.round(scale * 100)}%
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onFitToScreen}
          className="flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          Ajustar
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMinimapOpen(!isMinimapOpen)}
          className="flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Minimapa
        </Button>
      </div>

      {/* Area Navigation */}
      {areas.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {areas.map(area => (
            <Button
              key={area.id}
              variant="outline"
              size="sm"
              onClick={() => onCenterArea(area.id)}
              className="text-xs"
            >
              {area.name}
            </Button>
          ))}
        </div>
      )}

      {/* Status Bar */}
      <div className="text-xs text-gray-600 bg-gray-100 rounded px-2 py-1">
        Modo: {interactionMode === 'navigate' ? '🖱️ Navegando' : '📦 Moviendo mesas'}
      </div>

      {/* Minimap (simplified version) */}
      {isMinimapOpen && (
        <div className="absolute top-0 right-0 w-48 h-32 bg-white border border-gray-300 rounded shadow-lg z-10 p-2">
          <div className="text-xs font-medium mb-1">Vista General</div>
          <div className="relative w-full h-20 bg-gray-100 rounded">
            {/* Simplified minimap content would go here */}
            <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
              Minimapa
            </div>
          </div>
        </div>
      )}
    </div>
  );
}