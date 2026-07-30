'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { ToastProvider } from '@/components/ui/Toast'
import { isAuthenticated } from '@/lib/auth'

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [authed, setAuthed] = useState(false)
  const isLoginPage = pathname === '/login'

  useEffect(() => {
    const isAuth = isAuthenticated()
    setAuthed(isAuth)
    setMounted(true)

    if (!isAuth && !isLoginPage) {
      router.replace('/login')
    } else if (isAuth && isLoginPage) {
      router.replace('/')
    }
  }, [isLoginPage, router, pathname])

  useEffect(() => {
    const handleAuthChange = () => {
      const isAuth = isAuthenticated()
      setAuthed(isAuth)
      if (!isAuth && !isLoginPage) {
        router.replace('/login')
      }
    }
    window.addEventListener('gds-auth-change', handleAuthChange)
    return () => window.removeEventListener('gds-auth-change', handleAuthChange)
  }, [isLoginPage, router])

  if (isLoginPage) {
    return (
      <ToastProvider>
        <div className="min-h-screen w-full flex-1 flex flex-col bg-[#14120e]">
          {children}
        </div>
      </ToastProvider>
    )
  }

  // Prevent flash of protected UI while checking client auth
  if (!mounted || !authed) {
    return (
      <ToastProvider>
        <div className="min-h-screen w-full flex-1 bg-[#14120e] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#b08d3f] border-t-transparent rounded-full animate-spin" />
        </div>
      </ToastProvider>
    )
  }

  return (
    <ToastProvider>
      <div className="min-h-screen w-full flex-1 flex flex-col md:flex-row bg-paper antialiased">
        <Sidebar />
        <main id="main" tabIndex={-1} className="flex-1 overflow-auto bg-paper md:min-h-screen outline-none flex flex-col">
          <div className="p-4 md:p-8 pb-24 md:pb-8 flex-1">
            {children}
          </div>
          <footer className="no-print text-center text-[11px] text-ink-400 pt-4 pb-24 md:pb-4 border-t border-ink-100 select-none bg-white/20">
            <p>Developed by <a href="https://kreosoftwares.in" target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:underline font-semibold">Kreo Software</a></p>
          </footer>
        </main>
      </div>
    </ToastProvider>
  )
}
