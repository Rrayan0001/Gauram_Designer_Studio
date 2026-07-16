'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, PlusCircle, Users, BarChart3, Settings, Receipt, CornerDownLeft } from 'lucide-react'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const modalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const items = [
    { name: 'New Invoice / Create Bill', href: '/invoices/new', icon: PlusCircle, category: 'Actions' },
    { name: 'View Invoices List', href: '/', icon: Receipt, category: 'Pages' },
    { name: 'View Customers Ledger', href: '/customers', icon: Users, category: 'Pages' },
    { name: 'View Reports & Sales', href: '/reports', icon: BarChart3, category: 'Pages' },
    { name: 'Studio System Settings', href: '/settings', icon: Settings, category: 'Configuration' },
  ]

  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Handle key listeners inside palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % filtered.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selectedIndex]) {
          router.push(filtered[selectedIndex].href)
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, filtered, router, onClose])

  // Backdrop click listener
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-ink-900/40 backdrop-blur-xs select-none no-print"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-white rounded-2xl shadow-[0_20px_50px_rgba(26,24,20,0.15)] border border-ink-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Search header bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-ink-100">
          <Search className="w-5 h-5 text-ink-300" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search shortcut..."
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedIndex(0) }}
            className="flex-1 bg-transparent border-0 p-0 text-ink-900 placeholder-ink-300 text-sm focus:outline-none focus:ring-0"
          />
          <kbd className="text-[10px] bg-ink-100 border border-ink-300/20 text-ink-500 rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        {/* Results list */}
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="text-xs text-ink-300 text-center py-6">No matching actions found.</p>
          ) : (
            <div className="space-y-1">
              {filtered.map((item, idx) => {
                const Icon = item.icon
                const active = idx === selectedIndex
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => { router.push(item.href); onClose() }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                      active ? 'bg-gold-100/50 text-ink-900' : 'text-ink-700 hover:bg-ink-100/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${active ? 'text-gold-600' : 'text-ink-300'}`} />
                      <div>
                        <span className="text-xs font-semibold block">{item.name}</span>
                        <span className="text-[9px] text-ink-500 tracking-wider uppercase font-medium">{item.category}</span>
                      </div>
                    </div>
                    {active && (
                      <span className="flex items-center gap-0.5 text-[9px] text-gold-600 font-semibold bg-white border border-gold-600/20 px-1.5 py-0.5 rounded shadow-sm">
                        Go <CornerDownLeft className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Palette Footer help */}
        <div className="bg-ink-100/40 px-4 py-2 text-[10px] text-ink-500 flex justify-between border-t border-ink-100">
          <span>Use <kbd>↑</kbd> <kbd>↓</kbd> arrows to select</span>
          <span>Press <kbd>Enter</kbd> to execute</span>
        </div>
      </div>
    </div>
  )
}
