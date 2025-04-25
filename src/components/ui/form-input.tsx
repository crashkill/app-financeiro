import React from 'react';
import { Input } from './input';

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    return (
      <div className="input-group space-y-2">
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 transition-colors"
        >
          {label}
        </label>
        <Input
          id={id}
          ref={ref}
          className={`w-full transition-all duration-200 ${
            error ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
          } ${className}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        {error && (
          <p 
            id={`${id}-error`} 
            className="text-sm text-red-500 mt-1 animate-fadeIn" 
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';