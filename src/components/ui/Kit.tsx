'use client'

import React from 'react'

// ── BUTTON COMPONENT ──
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ink' | 'gold' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function Button({ variant = 'ink', size = 'md', children, className = '', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold tracking-wide transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none'
  
  const variants = {
    ink: 'bg-ink-900 text-white hover:bg-ink-700 shadow-xs',
    gold: 'bg-gold-600 text-white hover:bg-gold-500 shadow-xs',
    outline: 'border border-ink-100 text-ink-700 hover:bg-ink-100/30 hover:border-ink-300',
    ghost: 'text-ink-500 hover:bg-ink-100/30 hover:text-ink-900',
    danger: 'bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 shadow-xs'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4.5 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base'
  }

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}

// ── CARD COMPONENTS ──
export function Card({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-white border border-ink-100 rounded-2xl p-5 shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)] ${className}`}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <div className={`flex items-center justify-between pb-3 border-b border-ink-100 mb-4 ${className}`}>{children}</div>
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <h3 className={`font-serif text-base font-bold text-ink-900 ${className}`}>{children}</h3>
}

export function CardContent({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <div className={className}>{children}</div>
}

// ── SKELETON LOADER ──
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-ink-100 animate-pulse rounded-lg ${className}`} />
}

// ── EMPTY STATE COMPONENT ──
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
      <p className="text-xs text-ink-500 mt-1 max-w-sm leading-relaxed">{description}</p>
      {actionLabel && actionHref && (
        <a href={actionHref} className="mt-4 inline-flex items-center gap-1.5 bg-ink-900 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-ink-700 transition-colors shadow-xs">
          {actionLabel}
        </a>
      )}
    </div>
  )
}

function ReceiptIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}
