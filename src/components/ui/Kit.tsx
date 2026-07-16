'use client'

import React, { useEffect, useId, useRef } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/cn'
import { getInitials } from '@/lib/format'

// ── BUTTON ──
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ink' | 'gold' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export function Button({
  variant = 'ink',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold tracking-wide transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-600/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper'

  const variants = {
    ink: 'bg-ink-900 text-white hover:bg-ink-700 shadow-xs',
    gold: 'bg-gold-600 text-white hover:bg-gold-500 shadow-xs',
    outline: 'border border-ink-100 text-ink-700 hover:bg-ink-100/30 hover:border-ink-300 bg-white',
    ghost: 'text-ink-500 hover:bg-ink-100/30 hover:text-ink-900',
    danger: 'bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 shadow-xs',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs min-h-[36px]',
    md: 'px-4 py-2.5 text-sm min-h-[44px]',
    lg: 'px-6 py-3.5 text-base min-h-[48px]',
  }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Please wait…' : children}
    </button>
  )
}

// ── CARD ──
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'bg-white border border-ink-100 rounded-2xl p-5 shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)]',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between pb-3 border-b border-ink-100 mb-4', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('font-serif text-base font-bold text-ink-900', className)}>{children}</h3>
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}

// ── PAGE HEADER ──
export function PageHeader({
  title,
  description,
  action,
  className = '',
}: {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4', className)}>
      <div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink-900 tracking-tight text-balance">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-ink-500 mt-1 font-medium">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}

// ── STAT CARD ──
export function StatCard({
  label,
  value,
  sub,
  icon,
  className = '',
}: {
  label: string
  value: string
  sub?: string
  icon?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-ink-100 p-4 md:p-5 shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)] select-none',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <p className="text-[11px] font-bold text-ink-500 tracking-wide">{label}</p>
          <p className="text-lg md:text-xl font-bold text-ink-900 tracking-tight font-mono tabular-nums break-all">
            {value}
          </p>
          {sub && <p className="text-[11px] text-ink-500 font-medium leading-tight">{sub}</p>}
        </div>
        {icon && (
          <div className="p-2 md:p-2.5 bg-ink-100/60 border border-ink-100/40 rounded-xl flex-shrink-0 text-ink-700">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

// ── BADGE ──
export function Badge({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center bg-ink-100 border border-ink-100/30 text-ink-700 font-bold px-2 py-0.5 rounded-md text-[11px] tracking-wide uppercase',
        className
      )}
    >
      {children}
    </span>
  )
}

// ── AVATAR ──
export function Avatar({ name, size = 'md', className = '' }: { name: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = {
    sm: 'w-9 h-9 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-14 h-14 text-lg',
  }
  return (
    <div
      className={cn(
        'rounded-full bg-gold-100 border border-gold-600/15 flex items-center justify-center text-gold-600 font-serif font-bold flex-shrink-0 select-none',
        sizes[size],
        className
      )}
      aria-hidden
    >
      {getInitials(name)}
    </div>
  )
}

// ── FIELD / INPUT ──
const fieldLabelCls = 'text-[11px] font-bold text-ink-500 tracking-wide block mb-1.5'
const fieldInputCls =
  'w-full bg-white border border-ink-100 rounded-xl px-3.5 py-2.5 text-base md:text-sm text-ink-900 placeholder-ink-300 focus:outline-none focus:border-gold-600 focus:ring-2 focus:ring-gold-600/15 transition-all font-medium input-mobile-lg'

export function Field({
  label,
  error,
  hint,
  children,
  className = '',
}: {
  label?: string
  error?: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1', className)}>
      {label && <label className={fieldLabelCls}>{label}</label>}
      {children}
      {error && <p className="text-[11px] text-rose-600 font-medium mt-1">{error}</p>}
      {hint && !error && <p className="text-[11px] text-ink-500 font-medium mt-1">{hint}</p>}
    </div>
  )
}

export function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldInputCls, className)} {...props} />
}

export function Textarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(fieldInputCls, 'resize-none leading-relaxed', className)}
      {...props}
    />
  )
}

export { fieldLabelCls, fieldInputCls }

// ── SKELETON ──
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={cn('bg-ink-100 animate-pulse rounded-lg', className)} />
}

// ── EMPTY STATE ──
interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  icon?: React.ReactNode
}

export function EmptyState({ title, description, actionLabel, actionHref, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-ink-100 rounded-2xl bg-white/40">
      <div className="w-12 h-12 rounded-full bg-gold-100/50 border border-gold-600/10 flex items-center justify-center text-gold-600 mb-4">
        {icon || <ReceiptIcon />}
      </div>
      <h4 className="font-serif text-base font-bold text-ink-900">{title}</h4>
      <p className="text-sm text-ink-500 mt-1 max-w-sm leading-relaxed">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-4 inline-flex items-center gap-1.5 bg-ink-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-ink-700 transition-colors shadow-xs min-h-[44px]"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}

function ReceiptIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
      />
    </svg>
  )
}

// ── MODAL / CONFIRM ──
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  /** bottom sheet on mobile */
  sheet?: boolean
  className?: string
}

export function Modal({ open, onClose, title, children, sheet = false, className = '' }: ModalProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previouslyFocused.current = document.activeElement as HTMLElement
    const t = window.setTimeout(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      focusable?.focus()
    }, 20)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
      if (e.key === 'Tab' && panelRef.current) {
        const nodes = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const list = Array.from(nodes).filter((n) => !n.hasAttribute('disabled'))
        if (list.length === 0) return
        const first = list[0]
        const last = list[list.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      previouslyFocused.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex no-print">
      <div
        className="fixed inset-0 bg-ink-900/35 backdrop-blur-[2px] animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative z-10 bg-white border border-ink-100 shadow-xl outline-none',
          sheet
            ? 'mt-auto w-full rounded-t-2xl p-6 pb-safe animate-in slide-in-from-bottom duration-200 md:mt-auto md:mb-auto md:mx-auto md:max-w-md md:rounded-2xl md:animate-in md:zoom-in-95'
            : 'm-auto w-[90%] max-w-sm rounded-2xl p-6 animate-in zoom-in-95 duration-150',
          className
        )}
      >
        <h3 id={titleId} className="font-serif text-sm font-bold tracking-wide text-ink-900 mb-3">
          {title}
        </h3>
        {children}
      </div>
    </div>
  )
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  loading = false,
  danger = false,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: React.ReactNode
  confirmLabel?: string
  loading?: boolean
  danger?: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="text-sm text-ink-500 leading-relaxed mb-5">{description}</div>
      <div className="flex justify-end gap-2.5">
        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="button"
          variant={danger ? 'danger' : 'ink'}
          size="sm"
          loading={loading}
          onClick={onConfirm}
          className={danger ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700' : undefined}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
