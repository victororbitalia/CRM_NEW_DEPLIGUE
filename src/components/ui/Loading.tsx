import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
  text?: string;
  overlay?: boolean;
}

export default function Loading({
  size = 'md',
  color = 'primary',
  className,
  text,
  overlay = false,
}: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const colorClasses = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    success: 'text-success-600',
    warning: 'text-warning-600',
    error: 'text-error-600',
  };

  const spinnerSize = {
    sm: 'border-2',
    md: 'border-2',
    lg: 'border-3',
    xl: 'border-4',
  };

  const LoadingSpinner = () => (
    <svg
      className={cn(
        'animate-spin rounded-full border-solid border-current border-t-transparent',
        sizeClasses[size],
        colorClasses[color],
        spinnerSize[size],
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner />
          {text && (
            <p className="text-sm font-medium text-secondary-700">{text}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <div className={cn('flex flex-col items-center space-y-2', className)}>
        <LoadingSpinner />
        {text && (
          <p className="text-sm font-medium text-secondary-700">{text}</p>
        )}
      </div>
    </div>
  );
}

export interface LoadingDotsProps {
  className?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingDots({ className, color = 'primary', size = 'md' }: LoadingDotsProps) {
  const sizeClasses = {
    sm: 'h-1 w-1',
    md: 'h-2 w-2',
    lg: 'h-3 w-3',
  };

  const colorClasses = {
    primary: 'bg-primary-600',
    secondary: 'bg-secondary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    error: 'bg-error-600',
  };

  return (
    <div className={cn('flex space-x-1', className)}>
      <div
        className={cn(
          'rounded-full animate-pulse',
          sizeClasses[size],
          colorClasses[color]
        )}
        style={{ animationDelay: '0ms' }}
      />
      <div
        className={cn(
          'rounded-full animate-pulse',
          sizeClasses[size],
          colorClasses[color]
        )}
        style={{ animationDelay: '150ms' }}
      />
      <div
        className={cn(
          'rounded-full animate-pulse',
          sizeClasses[size],
          colorClasses[color]
        )}
        style={{ animationDelay: '300ms' }}
      />
    </div>
  );
}

export interface LoadingSkeletonProps {
  className?: string;
  count?: number;
  height?: string;
  width?: string;
  circle?: boolean;
}

export function LoadingSkeleton({
  className,
  count = 1,
  height = 'h-4',
  width = 'w-full',
  circle = false,
}: LoadingSkeletonProps) {
  const skeletonClass = cn(
    'animate-pulse bg-secondary-200 rounded',
    circle ? 'rounded-full' : 'rounded',
    height,
    width,
    className
  );

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={skeletonClass} />
      ))}
    </div>
  );
}

export interface LoadingBarProps {
  className?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  height?: string;
  progress?: number;
  indeterminate?: boolean;
}

export function LoadingBar({
  className,
  color = 'primary',
  height = 'h-1',
  progress = 0,
  indeterminate = true,
}: LoadingBarProps) {
  const colorClasses = {
    primary: 'bg-primary-600',
    secondary: 'bg-secondary-600',
    success: 'bg-success-600',
    warning: 'bg-warning-600',
    error: 'bg-error-600',
  };

  if (indeterminate) {
    return (
      <div className={cn('w-full bg-secondary-200 rounded-full overflow-hidden', height, className)}>
        <div
          className={cn(
            'h-full bg-current rounded-full',
            colorClasses[color],
            'animate-pulse'
          )}
        />
      </div>
    );
  }

  return (
    <div className={cn('w-full bg-secondary-200 rounded-full overflow-hidden', height, className)}>
      <div
        className={cn(
          'h-full bg-current rounded-full transition-all duration-300 ease-out',
          colorClasses[color]
        )}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}