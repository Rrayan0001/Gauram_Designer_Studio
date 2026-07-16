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
  Search
} from 'lucide-react'
import CommandPalette from './CommandPalette'

const links = [
  { name: 'Dashboard',   href: '/',             icon: LayoutDashboard },
  { name: 'Create Bill', href: '/invoices/new', icon: PlusCircle },
  { name: 'Customers',   href: '/customers',    icon: Users },
  { name: 'Reports',     href: '/reports',      icon: BarChart3 },
  { name: 'Settings',    href: '/settings',     icon: SettingsIcon },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [todayDate, setTodayDate] = useState('')

  // Load date safely in client
  useEffect(() => {
    setTodayDate(
      new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    )
  }, [])

  // Listen for global Cmd+K shortcut
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleGlobalKey)
    return () => window.removeEventListener('keydown', handleGlobalKey)
  }, [])

  const handleLinkClick = () => {
    setMobileOpen(false)
  }

  return (
    <>
      <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} />

      {/* ── MOBILE HEADER (Hidden on Desktop) ── */}
      <header className="no-print md:hidden bg-white border-b border-ink-100 px-4 pt-safe pb-3 flex items-center justify-between sticky top-0 z-40 select-none">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-ink-100 ring-1 ring-gold-600/20 p-0.5">
            <Image src="/logo.png" alt="Gauram Logo" fill className="object-contain" />
          </div>
          <div>
            <span className="font-serif font-bold text-xs text-ink-900 uppercase tracking-wider block leading-none">
              Gauram
            </span>
            <span className="text-[9px] text-ink-500 tracking-widest uppercase block mt-0.5 leading-none">
              Designer Studio
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCommandOpen(true)}
            className="p-2.5 rounded-xl text-ink-500 hover:bg-ink-100/30 transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]"
            aria-label="Search command palette"
          >
            <Search className="w-5 h-5 text-gold-600" />
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2.5 -mr-2 rounded-xl text-ink-500 hover:bg-ink-100/30 transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ── MOBILE SLIDE-OUT DRAWER OVERLAY ── */}
      {mobileOpen && (
        <div className="no-print md:hidden fixed inset-0 z-50 flex">
          {/* Background backdrop overlay */}
          <div
            className="fixed inset-0 bg-ink-900/30 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer content panel */}
          <div className="relative flex flex-col w-64 max-w-xs bg-white h-full border-r border-ink-100 p-4 pt-safe pb-safe shadow-xl z-10 animate-in slide-in-from-left duration-200">
            {/* Header / Brand in Drawer */}
            <div className="flex items-center justify-between pb-4 border-b border-ink-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-ink-100 ring-1 ring-gold-600/20 p-0.5">
                  <Image src="/logo.png" alt="Gauram Logo" fill className="object-contain" />
                </div>
                <div>
                  <span className="font-serif font-bold text-xs text-ink-900 uppercase tracking-wider block leading-none">
                    Gauram
                  </span>
                  <span className="text-[9px] text-ink-500 tracking-widest uppercase block mt-0.5 leading-none">
                    Designer Studio
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-ink-300 hover:text-ink-900 hover:bg-ink-100/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav list */}
            <nav className="flex-1 space-y-1">
              {links.map(({ name, href, icon: Icon }) => {
                const active = pathname === href || (href !== '/' && pathname.startsWith(href))
                return (
                  <Link
                    key={name}
                    href={href}
                    onClick={handleLinkClick}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-gold-100 text-gold-600 font-bold border-l-3 border-gold-600'
                        : 'text-ink-700 hover:bg-ink-100/30 hover:text-ink-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-gold-600' : 'text-ink-300'}`} />
                    <span>{name}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Footer */}
            <div className="border-t border-ink-100 pt-4 text-center text-[10px] text-ink-300">
              <p>© 2026 Gauram Studio</p>
            </div>
          </div>
        </div>
      )}

      {/* ── DESKTOP SIDEBAR (Hidden on Mobile) ── */}
      <aside
        className={`no-print hidden md:flex flex-col min-h-screen bg-white border-r border-ink-100 select-none flex-shrink-0 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Brand Header */}
        <Link 
          href="/" 
          className={`flex items-center gap-3 px-3 py-5 border-b border-ink-100 hover:bg-ink-100/20 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <div className="relative flex-shrink-0 w-9 h-9 rounded-lg overflow-hidden border border-ink-100 ring-1 ring-gold-600/30 p-0.5 bg-paper">
            <Image src="/logo.png" alt="Gauram Logo" fill className="object-contain" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-serif font-bold text-[13px] text-ink-900 tracking-wider uppercase leading-none truncate">
                Gauram
              </p>
              <p className="text-[9px] text-ink-500 tracking-widest uppercase mt-1.5 truncate">
                Designer Studio
              </p>
            </div>
          )}
        </Link>

        {/* Nav Links */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-hidden">
          {links.map(({ name, href, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={name}
                href={href}
                title={collapsed ? name : undefined}
                className={`flex items-center gap-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 ${
                  active
                    ? 'border-l-3 border-gold-600 bg-gold-100/30 text-ink-900 pl-2'
                    : 'text-ink-500 hover:bg-ink-100/10 hover:text-ink-900 pl-3'
                } ${collapsed ? 'justify-center pl-0!' : ''}`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-gold-600' : 'text-ink-300'}`} />
                {!collapsed && <span className="truncate">{name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Footer Status Panel */}
        <div className="border-t border-ink-100">
          {!collapsed && (
            <div
              onClick={() => setCommandOpen(true)}
              className="px-3 py-2.5 mx-2 my-2 bg-ink-100/30 border border-ink-100 rounded-lg hover:bg-gold-100/20 cursor-pointer flex items-center justify-between text-[10px] text-ink-500 font-medium transition-colors"
              title="Click to search action shortcuts"
            >
              <span className="flex items-center gap-1.5">
                <Keyboard className="w-3.5 h-3.5 text-ink-300" /> Shortcuts
              </span>
              <span className="bg-white border border-ink-300/20 px-1 py-0.5 rounded shadow-xs font-mono">⌘K</span>
            </div>
          )}

          {!collapsed && (
            <div className="px-4 py-2 text-[9px] text-ink-300 font-medium tracking-wider space-y-0.5 border-t border-ink-100 bg-paper/50">
              <p className="truncate">Stylist: Gauram Counter</p>
              <p className="tabular-nums font-mono">{todayDate}</p>
            </div>
          )}

          {/* Collapse toggle */}
          <div className="px-2 py-3">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-ink-300 hover:bg-ink-100/30 hover:text-ink-900 transition-colors ${
                collapsed ? 'justify-center' : ''
              }`}
            >
              {collapsed
                ? <ChevronRight className="w-4 h-4 flex-shrink-0" />
                : <><ChevronLeft className="w-4 h-4 flex-shrink-0" /><span>Collapse Sidebar</span></>
              }
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
