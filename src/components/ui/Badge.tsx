'use client'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'blue' | 'purple' | 'magenta' | 'violet' | 'success' | 'warning' | 'error'
  className?: string
}

export default function Badge({ children, variant = 'blue', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-brass-100 text-ink-2 border-border-dim',
    blue: 'bg-brass-100 text-info border-border-dim',
    purple: 'bg-silver-100 text-silver-700 border-border-dim',
    magenta: 'bg-silver-100 text-silver-700 border-border-dim',
    violet: 'bg-silver-100 text-silver-700 border-border-dim',
    success: 'bg-brass-100 text-success border-border-dim',
    warning: 'bg-brass-100 text-warning border-border-dim',
    error: 'bg-brass-100 text-error border-border-dim',
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
