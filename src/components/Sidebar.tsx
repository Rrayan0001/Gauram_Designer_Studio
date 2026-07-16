'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  PlusCircle,
  Users,
  BarChart3,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react'

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

  // Helper to close mobile menu when link is clicked
  const handleLinkClick = () => {
    setMobileOpen(false)
  }

  return (
    <>
      {/* ── MOBILE HEADER (Hidden on Desktop) ── */}
      <header className="no-print md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 select-none">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-200">
            <Image src="/logo.png" alt="Gauram Logo" fill className="object-contain" />
          </div>
          <div>
            <span className="font-serif font-bold text-xs text-gray-900 uppercase tracking-wider block leading-none">
              Gauram
            </span>
            <span className="text-[9px] text-gray-400 tracking-widest uppercase block mt-0.5 leading-none">
              Designer Studio
            </span>
          </div>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 -mr-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* ── MOBILE SLIDE-OUT DRAWER OVERLAY ── */}
      {mobileOpen && (
        <div className="no-print md:hidden fixed inset-0 z-50 flex">
          {/* Background backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer content panel */}
          <div className="relative flex flex-col w-64 max-w-xs bg-white h-full border-r border-gray-200 p-4 shadow-xl z-10 animate-fade-in">
            {/* Header / Brand in Drawer */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-200">
                  <Image src="/logo.png" alt="Gauram Logo" fill className="object-contain" />
                </div>
                <div>
                  <span className="font-serif font-bold text-xs text-gray-900 uppercase tracking-wider block leading-none">
                    Gauram
                  </span>
                  <span className="text-[9px] text-gray-400 tracking-widest uppercase block mt-0.5 leading-none">
                    Designer Studio
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
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
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-400'}`} />
                    <span>{name}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Footer */}
            <div className="border-t border-gray-100 pt-4 text-center text-[10px] text-gray-300">
              <p>© 2026 Gauram Studio</p>
            </div>
          </div>
        </div>
      )}

      {/* ── DESKTOP SIDEBAR (Hidden on Mobile) ── */}
      <aside
        className={`no-print hidden md:flex flex-col min-h-screen bg-white border-r border-gray-200 select-none flex-shrink-0 transition-all duration-300 ${
          collapsed ? 'w-[60px]' : 'w-[220px]'
        }`}
      >
        {/* Brand */}
        <div className={`flex items-center gap-3 px-3 py-4 border-b border-gray-100 ${collapsed ? 'justify-center' : ''}`}>
          <div className="relative flex-shrink-0 w-9 h-9 rounded-lg overflow-hidden border border-gray-200">
            <Image src="/logo.png" alt="Gauram Logo" fill className="object-contain" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-serif font-bold text-[13px] text-gray-900 tracking-wider uppercase leading-none truncate">
                Gauram
              </p>
              <p className="text-[10px] text-gray-400 tracking-widest uppercase mt-0.5 truncate">
                Designer Studio
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-hidden">
          {links.map(({ name, href, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={name}
                href={href}
                title={collapsed ? name : undefined}
                className={`flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  active
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-gray-400'}`} />
                {!collapsed && <span className="truncate">{name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="px-2 py-3 border-t border-gray-100">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4 flex-shrink-0" />
              : <><ChevronLeft className="w-4 h-4 flex-shrink-0" /><span>Collapse</span></>
            }
          </button>
        </div>
      </aside>
    </>
  )
}
