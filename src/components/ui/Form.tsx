import { ReactNode, forwardRef, FormEvent } from 'react';
import { cn } from '@/lib/utils';

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: ReactNode;
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
}

const Form = forwardRef<HTMLFormElement, FormProps>(
  ({ className, children, onSubmit, ...props }, ref) => {
    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (onSubmit) {
        onSubmit(e);
      }
    };

    return (
      <form
        ref={ref}
        className={cn('space-y-6', className)}
        onSubmit={handleSubmit}
        {...props}
      >
        {children}
      </form>
    );
  }
);

Form.displayName = 'Form';

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  error?: string;
  required?: boolean;
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, children, error, required = false, ...props }, ref) => (
    <div ref={ref} className={cn('space-y-2', className)} {...props}>
      {children}
      {error && (
        <p className="text-sm text-error-600 flex items-center mt-1">
          <svg
            className="w-4 h-4 mr-1"
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
          {error}
        </p>
      )}
    </div>
  )
);

FormField.displayName = 'FormField';

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
  required?: boolean;
}

export const FormLabel = forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, children, required = false, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'block text-sm font-medium text-secondary-700',
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="text-error-500 ml-1" aria-label="Requerido">
          *
        </span>
      )}
    </label>
  )
);

FormLabel.displayName = 'FormLabel';

export interface FormDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export const FormDescription = forwardRef<HTMLParagraphElement, FormDescriptionProps>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-secondary-500', className)}
      {...props}
    >
      {children}
    </p>
  )
);

FormDescription.displayName = 'FormDescription';

export interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
  variant?: 'error' | 'success' | 'warning';
}

export const FormMessage = forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ className, children, variant = 'error', ...props }, ref) => {
    const variantClasses = {
      error: 'text-error-600',
      success: 'text-success-600',
      warning: 'text-warning-600',
    };

    return (
      <p
        ref={ref}
        className={cn('text-sm flex items-center', variantClasses[variant], className)}
        {...props}
      >
        {variant === 'error' && (
          <svg
            className="w-4 h-4 mr-1 flex-shrink-0"
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
        )}
        {variant === 'success' && (
          <svg
            className="w-4 h-4 mr-1 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
        {variant === 'warning' && (
          <svg
            className="w-4 h-4 mr-1 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        )}
        {children}
      </p>
    );
  }
);

FormMessage.displayName = 'FormMessage';

export interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const FormItem = forwardRef<HTMLDivElement, FormItemProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('space-y-2', className)} {...props}>
      {children}
    </div>
  )
);

FormItem.displayName = 'FormItem';

export interface FormActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  align?: 'left' | 'center' | 'right' | 'between';
}

export const FormActions = forwardRef<HTMLDivElement, FormActionsProps>(
  ({ className, children, align = 'right', ...props }, ref) => {
    const alignClasses = {
      left: 'justify-start',
      center: 'justify-center',
      right: 'justify-end',
      between: 'justify-between',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex gap-3 pt-4',
          alignClasses[align],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

FormActions.displayName = 'FormActions';

export default Form;