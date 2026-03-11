import { Suspense } from 'react'
import { Header } from './components/Header'
import { PulseTicker } from './components/PulseTicker'
import { NewsPanel } from './components/NewsPanel'
import { SocialTrends } from './components/SocialTrends'
import { CryptoPanel } from './components/CryptoPanel'
import { PulsePanel } from './components/PulsePanel'
import { RefreshProvider } from './components/RefreshProvider'

export const revalidate = 300

export default async function Page() {
  return (
    <RefreshProvider>
      <div className="min-h-screen bg-[var(--bg-base)] text-[var(--fg)]">
        <Header />

        <Suspense fallback={null}>
          <PulseTicker />
        </Suspense>

        <main className="max-w-[1600px] mx-auto px-6 py-5">
          <div className="hub-grid grid gap-7 items-start"
            style={{ gridTemplateColumns: 'clamp(260px, 28%, 420px) minmax(0, 1fr) clamp(240px, 26%, 380px)' }}>

            {/* Col 1 — World News */}
            <NewsPanel />

            {/* Col 2 — Viral / Social */}
            <div className="min-w-0">
              <SocialTrends />
            </div>

            {/* Col 3 — Crypto + Pulse */}
            <div className="flex flex-col gap-4">
              <Suspense fallback={<p className="font-mono text-xs text-[var(--muted)] py-5">Loading…</p>}>
                <CryptoPanel />
              </Suspense>
              <PulsePanel />
            </div>

          </div>
        </main>

        <footer className="border-t border-white/[0.06] px-6 py-4 text-center font-mono text-[10px] text-[var(--muted)] tracking-widest mt-8">
          DAILY BRIEFING · AUTO-REFRESH 5MIN · GUARDIAN · NEWSAPI · REDDIT · GOOGLE TRENDS · COINGECKO
        </footer>
      </div>
    </RefreshProvider>
  )
}
