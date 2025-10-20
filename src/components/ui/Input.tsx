import React, { forwardRef, useState, useId } from 'react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  required?: boolean;
  validateOnChange?: boolean;
  validator?: (value: string) => string | null;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    variant = 'default',
    size = 'md',
    required = false,
    validateOnChange = false,
    validator,
    className,
    id,
    value,
    onChange,
    ...props
  }, ref) => {
    const [internalError, setInternalError] = useState<string | null>(null);
    const generatedId = useId();
    const inputId = id || `input-${generatedId}`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e);
      }

      if (validateOnChange && validator) {
        const validationError = validator(e.target.value);
        setInternalError(validationError);
      }
    };

    const displayError = error || internalError;

    const variantClasses = {
      default: 'border border-secondary-300 bg-white focus:border-primary-500 focus:ring-primary-500',
      filled: 'border-0 bg-secondary-100 focus:bg-white focus:ring-2 focus:ring-primary-500',
      outlined: 'border-2 bg-transparent focus:border-primary-500',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-3 py-2 text-base',
      lg: 'px-4 py-3 text-lg',
    };

    const iconSizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-secondary-700 mb-1"
          >
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className={cn('text-secondary-400', iconSizeClasses[size])}>
                {leftIcon}
              </span>
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'block w-full rounded-md shadow-sm placeholder-secondary-400 text-gray-900 focus:outline-none focus:ring-1 transition-colors',
              variantClasses[variant],
              sizeClasses[size],
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              displayError && 'border-error-300 focus:border-error-500 focus:ring-error-500',
              className
            )}
            onChange={handleChange}
            value={value}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className={cn('text-secondary-400', iconSizeClasses[size])}>
                {rightIcon}
              </span>
            </div>
          )}
        </div>
        {displayError && (
          <p className="mt-1 text-sm text-error-600 flex items-center">
            <svg
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {displayError}
          </p>
        )}
        {helperText && !displayError && (
          <p className="mt-1 text-sm text-secondary-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;