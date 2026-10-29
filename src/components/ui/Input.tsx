'use client'

import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  rightElement?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, icon, rightElement, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-bp-text mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-bp-muted">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              input-base w-full rounded-xl py-3 text-sm
              ${icon ? 'pl-10' : ''}
              ${rightElement ? 'pr-10' : ''}
              ${error ? 'border-error' : ''}
              ${className}
            `}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-bp-muted cursor-pointer hover:text-brass-700 transition-colors flex items-center justify-center">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-bp-error">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
