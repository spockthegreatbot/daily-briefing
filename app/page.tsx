import { Suspense } from 'react'
import { Header } from './components/Header'
import { PulseTicker } from './components/PulseTicker'
import { MorningBrief } from './components/MorningBrief'
import { HeadlinesPanel } from './components/HeadlinesPanel'
import { MarketsPanel } from './components/MarketsPanel'
import { SignalsPanel } from './components/SignalsPanel'
import { RefreshProvider } from './components/RefreshProvider'

export const revalidate = 300

export default function Page() {
  return (
    <RefreshProvider>
      <div className="min-h-screen bg-[var(--bg-base)] text-[var(--fg)]">
        <Header />

        <Suspense fallback={null}>
          <PulseTicker />
        </Suspense>

        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-5">

          {/* Morning Brief — always on top */}
          <Suspense fallback={
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderLeft: '3px solid #E8C96E',
              padding: '20px 24px',
              marginBottom: 24,
            }}>
              <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 12, color: 'var(--muted)' }}>
                Loading morning brief...
              </p>
            </div>
          }>
            <MorningBrief />
          </Suspense>

          {/* 3-column grid */}
          <div className="hub-grid grid gap-5 items-start" style={{
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)',
          }}>
            {/* Col 1 — Headlines */}
            <HeadlinesPanel />

            {/* Col 2 — Markets */}
            <MarketsPanel />

            {/* Col 3 — Signals */}
            <SignalsPanel />
          </div>

        </main>

        <footer className="border-t border-white/[0.06] px-6 py-4 text-center font-mono text-[10px] text-[var(--muted)] tracking-widest mt-8">
          DAILY BRIEFING · AUTO-REFRESH 5MIN · GUARDIAN · NEWSAPI · COINGECKO · ALTERNATIVE.ME · REDDIT · HACKERNEWS
        </footer>
      </div>
    </RefreshProvider>
  )
}
