/**
 * Componente Input
 * Input reutilizable con label, error y helper text
 */

import { cn } from '@/lib/utils/cn';
import { InputHTMLAttributes, ReactNode, forwardRef, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className, ...props }, ref) => {
    const autoId = useId();
    const id = props.id ?? autoId;
    const descriptionId = error || helperText ? `${id}-description` : undefined;
    return (
      <div className="w-full space-y-2">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-forest">
            {label}
            {props.required && <span className="text-error ml-1" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            className={cn(
              'w-full px-4 py-3 rounded-md border-2 transition-all duration-200',
              'font-sans text-base text-forest placeholder:text-gray',
              'focus:outline-none focus:ring-2 focus:ring-musgo focus:ring-offset-2 focus:border-musgo',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray/10',
              error
                ? 'border-error focus:ring-error focus:border-error'
                : 'border-gray',
              icon && 'pl-10',
              className
            )}
            {...props}
            id={id}
            aria-invalid={error ? true : props['aria-invalid']}
            aria-describedby={[descriptionId, props['aria-describedby']].filter(Boolean).join(' ') || undefined}
          />
        </div>

        {error && (
          <p id={descriptionId} className="text-sm text-error flex items-center gap-1">
            <span aria-hidden="true">⚠</span>
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={descriptionId} className="text-sm text-gray">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

