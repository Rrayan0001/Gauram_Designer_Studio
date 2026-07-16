'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  PlusCircle,
  Users,
  BarChart3,
  Settings,
  Receipt,
  CornerDownLeft,
  User,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { fmtINR, fmtPhone } from '@/lib/format'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

type PaletteItem = {
  id: string
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  category: string
  subtitle?: string
}

const STATIC_ITEMS: PaletteItem[] = [
  { id: 'new', name: 'New Invoice / Create Bill', href: '/invoices/new', icon: PlusCircle, category: 'Actions' },
  { id: 'invoices', name: 'View Invoices List', href: '/', icon: Receipt, category: 'Pages' },
  { id: 'customers', name: 'View Customers Ledger', href: '/customers', icon: Users, category: 'Pages' },
  { id: 'reports', name: 'View Reports & Sales', href: '/reports', icon: BarChart3, category: 'Pages' },
  { id: 'settings', name: 'Studio System Settings', href: '/settings', icon: Settings, category: 'Configuration' },
]

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [liveItems, setLiveItems] = useState<PaletteItem[]>([])
  const [loadingLive, setLoadingLive] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const staticFiltered = useMemo(
    () =>
      STATIC_ITEMS.filter(
        (item) =>
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.category.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  )

  const items = useMemo(
    () => (search.trim().length >= 2 ? [...liveItems, ...staticFiltered] : staticFiltered),
    [search, liveItems, staticFiltered]
  )

  const go = useCallback(
    (href: string) => {
      router.push(href)
      onClose()
    },
    [router, onClose]
  )

  // Reset + focus when opened (defer setState to avoid sync-in-effect lint)
  useEffect(() => {
    if (!isOpen) return
    const t = window.setTimeout(() => {
      setSearch('')
      setSelectedIndex(0)
      setLiveItems([])
      inputRef.current?.focus()
    }, 0)
    return () => window.clearTimeout(t)
  }, [isOpen])

  // Live search customers + invoices
  useEffect(() => {
    if (!isOpen || search.trim().length < 2) {
      const t = window.setTimeout(() => setLiveItems([]), 0)
      return () => window.clearTimeout(t)
    }

    const q = search.trim()
    const controller = new AbortController()
    const t = window.setTimeout(async () => {
      setLoadingLive(true)
      try {
        const [custRes, invRes] = await Promise.all([
          fetch(`/api/customers?query=${encodeURIComponent(q)}`, { signal: controller.signal }),
          fetch(`/api/invoices?search=${encodeURIComponent(q)}`, { signal: controller.signal }),
        ])
        const customers = custRes.ok ? await custRes.json() : []
        const invoices = invRes.ok ? await invRes.json() : []

        const next: PaletteItem[] = []
        if (Array.isArray(customers)) {
          customers.slice(0, 5).forEach((c: { id: string; name: string; phone: string }) => {
            next.push({
              id: `c-${c.id}`,
              name: c.name,
              subtitle: fmtPhone(c.phone),
              href: `/customers/${c.id}`,
              icon: User,
              category: 'Customers',
            })
          })
        }
        if (Array.isArray(invoices)) {
          invoices.slice(0, 5).forEach(
            (inv: {
              id: string
              orderId: string | null
              totalAmount: number
              customer?: { name: string }
            }) => {
              next.push({
                id: `i-${inv.id}`,
                name: inv.orderId || 'Draft invoice',
                subtitle: `${inv.customer?.name || 'Client'} · ${fmtINR(inv.totalAmount || 0)}`,
                href: `/invoices/${inv.id}`,
                icon: FileText,
                category: 'Invoices',
              })
            }
          )
        }
        setLiveItems(next)
        setSelectedIndex(0)
      } catch {
        /* aborted or network */
      } finally {
        setLoadingLive(false)
      }
    }, 220)

    return () => {
      controller.abort()
      window.clearTimeout(t)
    }
  }, [search, isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (items.length ? (prev + 1) % items.length : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (items.length ? (prev - 1 + items.length) % items.length : 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (items[selectedIndex]) go(items[selectedIndex].href)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, items, go, onClose])

  if (!isOpen) return null

  return (
    <div
      onClick={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose()
      }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-ink-900/40 backdrop-blur-[2px] select-none no-print"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-lg bg-white rounded-2xl shadow-[0_20px_50px_rgba(26,24,20,0.15)] border border-ink-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-ink-100">
          <Search className="w-5 h-5 text-ink-300" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search clients, invoices, or jump to a page…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-0 p-0 text-ink-900 placeholder-ink-400 text-sm focus:outline-none focus:ring-0"
            aria-autocomplete="list"
            aria-controls="command-list"
          />
          <kbd className="text-[11px] bg-ink-100 border border-ink-300/20 text-ink-500 rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        <div id="command-list" role="listbox" className="max-h-80 overflow-y-auto p-2">
          {loadingLive && search.trim().length >= 2 && (
            <p className="text-[11px] text-ink-400 text-center py-2">Searching…</p>
          )}
          {items.length === 0 ? (
            <p className="text-sm text-ink-400 text-center py-6">No matching actions found.</p>
          ) : (
            <div className="space-y-1">
              {items.map((item, idx) => {
                const Icon = item.icon
                const active = idx === selectedIndex
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => go(item.href)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all',
                      active ? 'bg-gold-100/70 text-ink-900' : 'text-ink-700 hover:bg-ink-100/30'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-gold-600' : 'text-ink-300')} />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold block truncate">{item.name}</span>
                        <span className="text-[11px] text-ink-500 tracking-wide font-medium">
                          {item.subtitle || item.category}
                        </span>
                      </div>
                    </div>
                    {active && (
                      <span className="flex items-center gap-0.5 text-[11px] text-ink-700 font-semibold bg-white border border-ink-300/35 px-1.5 py-0.5 rounded shadow-sm flex-shrink-0">
                        Go <CornerDownLeft className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-ink-100/40 px-4 py-2 text-[11px] text-ink-500 flex justify-between border-t border-ink-100">
          <span>
            Use <kbd className="font-mono">↑</kbd> <kbd className="font-mono">↓</kbd> to select
          </span>
          <span>
            <kbd className="font-mono">Enter</kbd> to open
          </span>
        </div>
      </div>
    </div>
  )
}
