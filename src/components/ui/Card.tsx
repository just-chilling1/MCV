'use client'

import { HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glow' | 'glass'
  hover?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', hover = true, children, ...props }, ref) => {
    const variants = {
      default: 'card',
      glow: 'card card-glow',
      glass: 'glass-strong',
    }

    return (
      <div
        ref={ref}
        className={`
          rounded-3xl p-6 transition-all duration-300
          ${variants[variant]}
          ${hover ? '' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export default Card
