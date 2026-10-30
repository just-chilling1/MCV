'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { X } from 'lucide-react'
import { newId } from '@/lib/id'

export type ToastVariant = 'default' | 'success' | 'error' | 'info'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastItem {
  id: string
  message: string
  variant?: ToastVariant
  durationMs?: number
  action?: ToastAction
}

interface ToastContextValue {
  toast: (message: string, opts?: Partial<Omit<ToastItem, 'id' | 'message'>>) => string
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, opts?: Partial<Omit<ToastItem, 'id' | 'message'>>) => {
      const id = newId()
      const item: ToastItem = {
        id,
        message,
        variant: opts?.variant ?? 'default',
        durationMs: opts?.durationMs ?? 5000,
        action: opts?.action,
      }
      setItems((prev) => [...prev, item])
      const ms = item.durationMs ?? 5000
      if (ms > 0) {
        window.setTimeout(() => dismiss(id), ms)
      }
      return id
    },
    [dismiss]
  )

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-6 z-[200] flex max-w-sm flex-col gap-2 sm:inset-x-auto sm:right-6 sm:max-w-md"
        aria-live="polite"
        aria-relevant="additions"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={`
              pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg
              ${
                t.variant === 'error'
                  ? 'border-error bg-surface text-error'
                  : t.variant === 'success'
                    ? 'border-success bg-raised text-success'
                    : t.variant === 'info'
                      ? 'border-info bg-raised text-info'
                      : 'border-[var(--mcv-line-strong)] bg-raised text-ink'
              }
            `}
            role="status"
          >
            <p className="min-w-0 flex-1 text-sm font-medium leading-snug">{t.message}</p>
            <div className="flex shrink-0 items-center gap-1">
              {t.action && (
                <button
                  type="button"
                  onClick={() => {
                    t.action?.onClick()
                    dismiss(t.id)
                  }}
                  className="rounded-lg px-2 py-1 text-xs font-bold uppercase tracking-wide text-brass-700 hover:bg-brass-100"
                >
                  {t.action.label}
                </button>
              )}
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="rounded-lg p-1 text-ink-4 hover:bg-brass-100 hover:text-ink"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
