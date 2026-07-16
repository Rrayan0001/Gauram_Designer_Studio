'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Kit'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="max-w-md mx-auto mt-16 bg-white border border-ink-100 p-8 rounded-2xl text-center space-y-4 shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)]">
      <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <h2 className="font-serif text-xl font-bold text-ink-900">Something went wrong</h2>
      <p className="text-sm text-ink-500 leading-relaxed">
        {error.message || 'An unexpected error occurred. You can try again or return to the dashboard.'}
      </p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
        <Button type="button" variant="ink" onClick={reset}>
          Try again
        </Button>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold px-4 py-2.5 text-sm min-h-[44px] border border-ink-100 text-ink-700 hover:bg-ink-100/30"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
