'use client'

import React, { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/cn'

type ToastKind = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

interface ToastApi {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

let idSeq = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = ++idSeq
    setToasts((prev) => [...prev, { id, kind, message }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3200)
  }, [])

  const api: ToastApi = {
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  }

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)] pointer-events-none no-print"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              'pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3.5 py-3 shadow-[0_8px_24px_-8px_rgba(26,24,20,0.18)] bg-white animate-in slide-in-from-bottom-2 fade-in duration-200',
              t.kind === 'success' && 'border-emerald-200',
              t.kind === 'error' && 'border-rose-200',
              t.kind === 'info' && 'border-ink-100'
            )}
          >
            {t.kind === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />}
            {t.kind === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />}
            {t.kind === 'info' && <AlertCircle className="w-4 h-4 text-ink-500 flex-shrink-0 mt-0.5" />}
            <p className="flex-1 text-xs font-semibold text-ink-900 leading-relaxed">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="p-1 rounded-lg text-ink-300 hover:text-ink-900 hover:bg-ink-100/40 transition-colors pointer-events-auto"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Fallback for pages rendered without provider (shouldn't happen)
    return {
      success: (m) => console.info('[toast]', m),
      error: (m) => console.error('[toast]', m),
      info: (m) => console.info('[toast]', m),
    }
  }
  return ctx
}
