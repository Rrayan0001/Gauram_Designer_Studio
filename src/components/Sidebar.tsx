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

  return (
    <aside
      className={`no-print flex flex-col min-h-screen bg-white border-r border-gray-200 select-none flex-shrink-0 transition-all duration-300 ${
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
            <p className="font-cinzel font-bold text-[13px] text-gray-900 tracking-wider uppercase leading-none truncate">
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
  )
}
