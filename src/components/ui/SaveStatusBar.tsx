'use client'

type Status = 'idle' | 'saving' | 'saved' | 'error'

export interface SaveStatusBarProps {
  status: Status
  savedAt?: Date | null
  errorMessage?: string | null
  onRetry?: () => void
  className?: string
}

export function SaveStatusBar({
  status,
  savedAt,
  errorMessage,
  onRetry,
  className = '',
}: SaveStatusBarProps) {
  if (status === 'idle') return null

  const time =
    savedAt &&
    savedAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-dim bg-[rgb(8,11,18)]/90 px-3 py-2 text-xs backdrop-blur-md sm:text-sm ${className}`}
      role="status"
      aria-live="polite"
    >
      {status === 'saving' && (
        <span className="font-medium text-warning">Saving…</span>
      )}
      {status === 'saved' && time && (
        <span className="font-medium text-success">Saved at {time}</span>
      )}
      {status === 'error' && (
        <>
          <span className="font-medium text-error">
            {errorMessage || 'Could not save. Try again.'}
          </span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-md border border-white/15 bg-field px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white hover:bg-raised"
            >
              Retry
            </button>
          )}
        </>
      )}
    </div>
  )
}
