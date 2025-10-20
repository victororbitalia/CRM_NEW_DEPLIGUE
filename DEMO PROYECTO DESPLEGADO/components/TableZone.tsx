'use client';

import { Zone } from '@/types';

interface TableZoneProps {
  zone: Zone;
  isSelected?: boolean;
  onZoneClick?: (zone: Zone) => void;
  children?: React.ReactNode;
}

export default function TableZone({
  zone,
  isSelected = false,
  onZoneClick,
  children,
}: TableZoneProps) {
  const getZoneStyle = () => {
    const style: React.CSSProperties = {
      backgroundColor: zone.color,
      position: 'absolute',
    };

    if (zone.boundaryX !== undefined) {
      style.left = `${zone.boundaryX}%`;
    }
    if (zone.boundaryY !== undefined) {
      style.top = `${zone.boundaryY}%`;
    }
    if (zone.width !== undefined) {
      style.width = `${zone.width}%`;
    }
    if (zone.height !== undefined) {
      style.height = `${zone.height}%`;
    }

    return style;
  };

  return (
    <div
      className={`
        border-2 border-dashed rounded-lg overflow-hidden
        ${isSelected ? 'border-blue-500 border-solid' : 'border-gray-400'}
        ${onZoneClick ? 'cursor-pointer hover:border-gray-600' : ''}
        transition-all duration-200
      `}
      style={getZoneStyle()}
      onClick={() => onZoneClick?.(zone)}
    >
      <div className="p-2 h-full flex flex-col">
        <div className="text-sm font-semibold text-gray-700 mb-1">
          {zone.displayName}
        </div>
        <div className="flex-1 relative">
          {children}
        </div>
      </div>
    </div>
  );
}