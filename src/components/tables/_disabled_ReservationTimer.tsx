'use client';

import React, { useState, useEffect } from 'react';

interface ReservationTimerProps {
  endTime: string;
  className?: string;
}

export default function ReservationTimer({ endTime, className = '' }: ReservationTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const end = new Date();
      
      // Parse the end time (format: "HH:MM")
      const [hours, minutes] = endTime.split(':').map(Number);
      end.setHours(hours, minutes, 0, 0);
      
      // If end time is earlier than now, assume it's for the next day
      if (end.getTime() <= now.getTime()) {
        end.setDate(end.getDate() + 1);
      }
      
      const remaining = end.getTime() - now.getTime();
      
      if (remaining <= 0) {
        setIsExpired(true);
        return 0;
      }
      
      setIsExpired(false);
      return remaining;
    };

    // Initial calculation
    setTimeRemaining(calculateTimeRemaining());

    // Update every second
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getTimerColor = () => {
    if (isExpired) return 'text-red-600';
    
    const totalMinutes = Math.floor(timeRemaining / 60000);
    
    if (totalMinutes < 15) return 'text-red-600';
    if (totalMinutes < 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getTimerIcon = () => {
    if (isExpired) {
      return (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    
    return (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  return (
    <div className={`flex items-center gap-1 ${getTimerColor()} ${className}`}>
      {getTimerIcon()}
      <span className="text-xs font-medium">
        {isExpired ? 'Expirado' : formatTime(timeRemaining)}
      </span>
    </div>
  );
}