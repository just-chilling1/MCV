'use client'

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  type SelectHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  options: SelectOption[]
  error?: string
}

type PanelPos = { top: number; left: number; width: number; maxHeight: number; place: 'above' | 'below' }

function optionLabel(options: SelectOption[], value: string | number | readonly string[] | undefined) {
  const v = value == null ? '' : String(value)
  return options.find((o) => o.value === v)?.label ?? ''
}

export default function Select({
  className = '',
  label,
  options,
  error,
  value,
  defaultValue,
  onChange,
  disabled,
  id,
  name,
  required,
}: SelectProps) {
  const autoId = useId()
  const triggerId = id ?? autoId
  const listId = `${triggerId}-listbox`
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [pos, setPos] = useState<PanelPos | null>(null)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [uncontrolled, setUncontrolled] = useState(() =>
    defaultValue == null ? '' : String(defaultValue)
  )

  const isControlled = value !== undefined
  const current = isControlled ? String(value ?? '') : uncontrolled
  const selectedLabel = optionLabel(options, current)
  const placeholder = options.find((o) => o.value === '')?.label
  const showPlaceholder = !current

  useEffect(() => setMounted(true), [])

  const commit = useCallback(
    (next: string) => {
      if (!isControlled) setUncontrolled(next)
      onChange?.({
        target: { value: next, name: name ?? '' },
        currentTarget: { value: next, name: name ?? '' },
      } as ChangeEvent<HTMLSelectElement>)
      setOpen(false)
    },
    [isControlled, name, onChange]
  )

  const updatePos = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const gap = 6
    const spaceBelow = window.innerHeight - r.bottom - gap - 12
    const spaceAbove = r.top - gap - 12
    const preferBelow = spaceBelow >= 160 || spaceBelow >= spaceAbove
    const maxHeight = Math.min(280, preferBelow ? spaceBelow : spaceAbove)
    setPos({
      top: preferBelow ? r.bottom + gap : r.top - gap,
      left: r.left,
      width: r.width,
      maxHeight: Math.max(120, maxHeight),
      place: preferBelow ? 'below' : 'above',
    })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    updatePos()
    const onScroll = () => updatePos()
    window.addEventListener('resize', updatePos)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('resize', updatePos)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open, updatePos])

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node
      if (rootRef.current?.contains(t) || listRef.current?.contains(t)) return
      setOpen(false)
    }
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const idx = Math.max(0, options.findIndex((o) => o.value === current))
    setActiveIndex(idx)
    requestAnimationFrame(() => {
      listRef.current
        ?.querySelector<HTMLElement>(`[data-index="${idx}"]`)
        ?.scrollIntoView({ block: 'nearest' })
    })
  }, [open, current, options])

  const moveActive = (delta: number) => {
    if (options.length === 0) return
    setActiveIndex((prev) => {
      const start = prev < 0 ? (delta > 0 ? -1 : 0) : prev
      const next = (start + delta + options.length) % options.length
      requestAnimationFrame(() => {
        listRef.current
          ?.querySelector<HTMLElement>(`[data-index="${next}"]`)
          ?.scrollIntoView({ block: 'nearest' })
      })
      return next
    })
  }

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!open) setOpen(true)
      else if (e.key === 'ArrowDown') moveActive(1)
      else if (activeIndex >= 0) commit(options[activeIndex].value)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) setOpen(true)
      else moveActive(-1)
    } else if (e.key === 'Home' && open) {
      e.preventDefault()
      setActiveIndex(0)
    } else if (e.key === 'End' && open) {
      e.preventDefault()
      setActiveIndex(options.length - 1)
    }
  }

  const panelStyle: CSSProperties | undefined = pos
    ? {
        position: 'fixed',
        left: pos.left,
        width: pos.width,
        maxHeight: pos.maxHeight,
        zIndex: 80,
        ...(pos.place === 'below'
          ? { top: pos.top }
          : { bottom: window.innerHeight - pos.top, top: 'auto' }),
      }
    : undefined

  const panel =
    open && mounted && pos
      ? createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-labelledby={triggerId}
            className="menu-select-panel"
            style={panelStyle}
          >
            {options.map((option, index) => {
              const selected = option.value === current
              const active = index === activeIndex
              const isEmpty = option.value === ''
              return (
                <li
                  key={option.value || '__empty'}
                  id={`${listId}-opt-${index}`}
                  role="option"
                  aria-selected={selected}
                  data-index={index}
                  className={clsx(
                    'menu-select-option',
                    isEmpty && 'menu-select-option--muted',
                    selected && 'is-selected',
                    active && 'is-active'
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    commit(option.value)
                  }}
                >
                  <span className="menu-select-option-label">{option.label}</span>
                  <span className="menu-select-option-check" aria-hidden>
                    {selected ? <Check size={14} strokeWidth={2.5} /> : null}
                  </span>
                </li>
              )
            })}
          </ul>,
          document.body
        )
      : null

  return (
    <div className="menu-select w-full" ref={rootRef}>
      {label ? (
        <label htmlFor={triggerId} className="menu-select-label">
          {label}
        </label>
      ) : null}

      <select
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        name={name}
        required={required}
        disabled={disabled}
        value={current}
        onChange={() => {}}
      >
        {options.map((option) => (
          <option key={option.value || '__empty'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        ref={triggerRef}
        type="button"
        id={triggerId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={Boolean(error) || undefined}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
        className={clsx(
          'menu-select-trigger',
          open && 'is-open',
          error && 'is-error',
          className
        )}
      >
        <span className={clsx('menu-select-value', showPlaceholder && 'is-placeholder')}>
          {showPlaceholder ? placeholder || 'Select…' : selectedLabel}
        </span>
        <span className={clsx('menu-select-chevron', open && 'is-open')} aria-hidden>
          <ChevronDown size={16} strokeWidth={2} />
        </span>
      </button>

      {panel}

      {error ? <p className="menu-select-error">{error}</p> : null}
    </div>
  )
}
