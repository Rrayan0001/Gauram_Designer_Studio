import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto mt-16 bg-white border border-ink-100 p-8 rounded-2xl text-center space-y-4 shadow-[0_1px_3px_rgba(26,24,20,0.02),0_8px_24px_-12px_rgba(26,24,20,0.05)]">
      <p className="text-[11px] font-bold text-gold-600 tracking-widest uppercase">404</p>
      <h2 className="font-serif text-2xl font-bold text-ink-900">Page not found</h2>
      <p className="text-sm text-ink-500 leading-relaxed">
        That route doesn&apos;t exist in the studio ledger. Head back to the dashboard to continue billing.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold px-4 py-2.5 text-sm min-h-[44px] bg-ink-900 text-white hover:bg-ink-700"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
