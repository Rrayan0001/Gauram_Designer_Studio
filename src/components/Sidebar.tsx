'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  PlusCircle,
  Users,
  BarChart3,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Keyboard,
  Search,
} from 'lucide-react'
import CommandPalette from './CommandPalette'
import { cn } from '@/lib/cn'
import { fmtDateIN } from '@/lib/format'

const links = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Create Bill', href: '/invoices/new', icon: PlusCircle },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
]

const mobileTabs = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Bill', href: '/invoices/new', icon: PlusCircle },
  { name: 'Clients', href: '/customers', icon: Users },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return localStorage.getItem('gds-sidebar-collapsed') === '1'
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [todayDate] = useState(() => fmtDateIN(new Date()))

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleGlobalKey)
    return () => window.removeEventListener('keydown', handleGlobalKey)
  }, [])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('gds-sidebar-collapsed', next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href))

  return (
    <>
      <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} />

      {/* Mobile header */}
      <header className="no-print md:hidden bg-white border-b border-ink-100 px-4 pt-safe pb-3 flex items-center justify-between sticky top-0 z-40 select-none">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gold-600/20 ring-1 ring-gold-100 p-0.5">
            <Image src="/logo.png" alt="Gauram Logo" fill className="object-contain" />
          </div>
          <div>
            <span className="font-serif font-bold text-sm text-ink-900 block leading-none">
              Gauram
            </span>
            <span className="text-[11px] text-ink-500 tracking-wide block mt-0.5 leading-none">
              Designer Studio
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="p-2.5 rounded-xl text-ink-700 hover:bg-ink-100/30 transition-colors flex items-center justify-center min-w-[44px] min-h-[44px] focus-visible:ring-2 focus-visible:ring-gold-600/40"
            aria-label="Search command palette"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2.5 -mr-2 rounded-xl text-ink-500 hover:bg-ink-100/30 transition-colors flex items-center justify-center min-w-[44px] min-h-[44px] focus-visible:ring-2 focus-visible:ring-gold-600/40"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="no-print md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-ink-900/30 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="relative flex flex-col w-64 max-w-xs bg-white h-full border-r border-ink-100 p-4 pt-safe pb-safe shadow-xl z-10 animate-in slide-in-from-left duration-200"
          >
            <div className="flex items-center justify-between pb-4 border-b border-ink-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gold-600/20 ring-1 ring-gold-100 p-0.5">
                  <Image src="/logo.png" alt="Gauram Logo" fill className="object-contain" />
                </div>
                <div>
                  <span className="font-serif font-bold text-sm text-ink-900 block leading-none">Gauram</span>
                  <span className="text-[11px] text-ink-500 block mt-0.5 leading-none">Designer Studio</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-ink-300 hover:text-ink-900 hover:bg-ink-100/30 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 space-y-1" aria-label="Main">
              {links.map(({ name, href, icon: Icon }) => {
                const active = isActive(href)
                return (
                  <Link
                    key={name}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors',
                      active
                        ? 'bg-gold-100 text-ink-900 border border-gold-600/20'
                        : 'text-ink-700 hover:bg-ink-100/40 hover:text-ink-900'
                    )}
                  >
                    <Icon className={cn('w-4 h-4', active ? 'text-gold-600' : 'text-ink-400')} />
                    <span>{name}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="border-t border-ink-100 pt-4 text-center text-[11px] text-ink-400 space-y-1">
              <p>© 2026 Gauram Studio</p>
              <p>Developed by <a href="https://kreosoftwares.in" target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:underline font-semibold">Kreo Software</a></p>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'no-print hidden md:flex flex-col min-h-screen bg-white border-r border-ink-100 select-none flex-shrink-0 transition-all duration-300',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        <Link
          href="/"
          className={cn(
            'flex items-center gap-3 px-3 py-5 border-b border-ink-100 hover:bg-ink-100/20 transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <div className="relative flex-shrink-0 w-9 h-9 rounded-lg overflow-hidden border border-gold-600/25 ring-1 ring-gold-100 p-0.5 bg-paper">
            <Image src="/logo.png" alt="Gauram Logo" fill className="object-contain" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-serif font-bold text-base text-ink-900 leading-none truncate">Gauram</p>
              <p className="text-[11px] text-ink-500 mt-1 truncate">Designer Studio</p>
            </div>
          )}
        </Link>

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-hidden" aria-label="Main">
          {links.map(({ name, href, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={name}
                href={href}
                title={collapsed ? name : undefined}
                className={cn(
                  'relative flex items-center gap-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150',
                  active
                    ? 'bg-gold-100/80 text-ink-900 pl-3.5'
                    : 'text-ink-500 hover:bg-ink-100/50 hover:text-ink-900 pl-3.5',
                  collapsed && 'justify-center pl-0'
                )}
              >
                {active && !collapsed && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r bg-gold-600" />
                )}
                <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-gold-600' : 'text-ink-400')} />
                {!collapsed && <span className="truncate">{name}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-ink-100">
          {!collapsed && (
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="w-[calc(100%-1rem)] px-3 py-2.5 mx-2 my-2 bg-ink-100/30 border border-ink-100 rounded-lg hover:bg-ink-100/60 cursor-pointer flex items-center justify-between text-[11px] text-ink-500 font-medium transition-colors text-left"
            >
              <span className="flex items-center gap-1.5">
                <Keyboard className="w-3.5 h-3.5 text-ink-300" /> Shortcuts
              </span>
              <span className="bg-white border border-ink-300/20 px-1.5 py-0.5 rounded shadow-xs font-mono text-[10px]">⌘K</span>
            </button>
          )}

          {!collapsed && (
            <div className="px-4 py-2 text-[11px] text-ink-400 font-medium space-y-0.5 border-t border-ink-100 bg-paper/50">
              <p className="truncate">Stylist: Gauram Counter</p>
              <p className="tabular-nums font-mono">{todayDate}</p>
            </div>
          )}

          <div className="px-2 py-3">
            <button
              type="button"
              onClick={toggleCollapsed}
              className={cn(
                'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-ink-400 hover:bg-ink-100/30 hover:text-ink-900 transition-colors min-h-[44px]',
                collapsed && 'justify-center'
              )}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4 flex-shrink-0" />
                  <span>Collapse</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav
        className="no-print md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-ink-100 bar-safe flex items-stretch justify-around shadow-[0_-4px_20px_rgba(26,24,20,0.06)]"
        aria-label="Primary"
      >
        {mobileTabs.map(({ name, href, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={name}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[52px] text-[11px] font-semibold transition-colors',
                active ? 'text-gold-600' : 'text-ink-400'
              )}
            >
              <Icon className={cn('w-5 h-5', active && 'text-gold-600')} />
              <span>{name}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
