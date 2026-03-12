import { Suspense } from 'react'
import { Header } from './components/Header'
import { PulseTicker } from './components/PulseTicker'
import { NewsPanel } from './components/NewsPanel'
import { SocialTrends } from './components/SocialTrends'
import { CryptoPanel } from './components/CryptoPanel'
import { PulsePanel } from './components/PulsePanel'
import { RefreshProvider } from './components/RefreshProvider'
import { AlphaPanel } from './components/AlphaPanel'

export const revalidate = 300

export default function Page() {
  return (
    <RefreshProvider>
      <div className="min-h-screen bg-[var(--bg-base)] text-[var(--fg)]">
        <Header />

        <Suspense fallback={null}>
          <PulseTicker />
        </Suspense>

        <main className="max-w-[1800px] mx-auto px-6 py-5">

          {/* 4-column hub */}
          <div
            className="grid gap-7 items-start"
            style={{ gridTemplateColumns: 'clamp(220px, 22%, 340px) minmax(0, 1fr) clamp(200px, 20%, 320px) clamp(220px, 24%, 360px)' }}
          >
            {/* Col 1 — World News */}
            <NewsPanel />

            {/* Col 2 — Viral / Social */}
            <div className="min-w-0">
              <SocialTrends />
            </div>

            {/* Col 3 — Crypto */}
            <CryptoPanel />

            {/* Col 4 — Alpha */}
            <AlphaPanel />
          </div>

          {/* Full-width Pulse strip */}
          <PulsePanel />

        </main>

        <footer className="border-t border-white/[0.06] px-6 py-4 text-center font-mono text-[10px] text-[var(--muted)] tracking-widest mt-8">
          DAILY BRIEFING · AUTO-REFRESH 5MIN · GUARDIAN · NEWSAPI · COINGECKO · ALTERNATIVE.ME · REDDIT · HACKERNEWS · DEXSCREENER · PUMP.FUN · 4CHAN
        </footer>
      </div>
    </RefreshProvider>
  )
}
