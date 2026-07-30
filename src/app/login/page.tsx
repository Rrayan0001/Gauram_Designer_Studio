'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { AUTH_CREDENTIALS, setSessionCookie, isAuthenticated } from '@/lib/auth'
import { Eye, EyeOff, Lock, User, ArrowRight, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace(redirect)
    }
  }, [router, redirect])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError('Please enter both username and password.')
      return
    }

    setLoading(true)

    setTimeout(() => {
      if (
        username.trim() === AUTH_CREDENTIALS.username &&
        password === AUTH_CREDENTIALS.password
      ) {
        setSessionCookie()
        window.dispatchEvent(new Event('gds-auth-change'))
        router.replace(redirect)
      } else {
        setError('Invalid username or password. Please try again.')
        setLoading(false)
      }
    }, 400)
  }

  return (
    <div className="w-full min-h-screen bg-[#14120e] text-[#ece7df] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-[#b08d3f]/20 via-[#b08d3f]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[450px] h-[450px] bg-[#b08d3f]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[450px] h-[450px] bg-[#c9a961]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6 my-auto">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-2 rounded-2xl bg-[#1e1a14] border border-[#b08d3f]/30 shadow-2xl shadow-[#b08d3f]/10 ring-1 ring-[#b08d3f]/20">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-white/5">
              <Image
                src="/logo-v2.png"
                alt="Gauram Logo"
                fill
                priority
                className="object-contain p-1"
              />
            </div>
          </div>

          <div>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl tracking-wide text-white">
              GAURAM
            </h1>
            <p className="text-xs sm:text-sm font-medium tracking-[0.25em] text-[#c9a961] uppercase mt-0.5">
              Designer Studio
            </p>
            <p className="text-xs text-[#8a8175] mt-1">
              Boutique Billing & Management System
            </p>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-[#1a1814] border border-[#ece7df]/10 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-md">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-xs font-semibold text-[#b5ada1] uppercase tracking-wider">
                Username
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-[#8a8175] z-10">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  autoComplete="username"
                  style={{ backgroundColor: '#12100c', color: '#ffffff', paddingLeft: '2.75rem', paddingRight: '1rem' }}
                  className="w-full py-2.5 bg-[#12100c] text-white border border-[#ece7df]/15 rounded-xl placeholder-[#6b6359] focus:outline-none focus:border-[#b08d3f] focus:ring-2 focus:ring-[#b08d3f]/20 text-sm transition-all"
                />
              </div>
            </div>

            {/* Password Input with Show Password Feature */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-semibold text-[#b5ada1] uppercase tracking-wider">
                Password
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-[#8a8175] z-10">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  autoComplete="current-password"
                  style={{ backgroundColor: '#12100c', color: '#ffffff', paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                  className="w-full py-2.5 bg-[#12100c] text-white border border-[#ece7df]/15 rounded-xl placeholder-[#6b6359] focus:outline-none focus:border-[#b08d3f] focus:ring-2 focus:ring-[#b08d3f]/20 text-sm transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center text-[#8a8175] hover:text-[#c9a961] focus:text-[#c9a961] transition-colors cursor-pointer z-10 p-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-[#c9a961]" />
                  ) : (
                    <Eye className="w-4 h-4 text-[#8a8175]" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#b08d3f] to-[#c9a961] hover:from-[#c9a961] hover:to-[#b08d3f] text-[#1a1814] font-bold text-sm rounded-xl shadow-lg shadow-[#b08d3f]/20 hover:shadow-[#b08d3f]/40 transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 cursor-pointer mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#1a1814] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Studio</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-[#6b6359]">
          Developed by{' '}
          <a
            href="https://kreosoftwares.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#c9a961] hover:underline font-semibold"
          >
            Kreo Software
          </a>
        </p>
      </div>
    </div>
  )
}
