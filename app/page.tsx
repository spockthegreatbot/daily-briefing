import { Suspense } from 'react'
import { Header } from './components/Header'
import { PulseTicker } from './components/PulseTicker'
import { NewsPanel } from './components/NewsPanel'
import { SocialTrends } from './components/SocialTrends'
import { CryptoPanel } from './components/CryptoPanel'
import { PulsePanel } from './components/PulsePanel'
import { RefreshProvider } from './components/RefreshProvider'

export const revalidate = 300

function LoadingBox({ text }: { text: string }) {
  return (
    <div
      style={{
        fontFamily: "ui-monospace, 'SF Mono', monospace",
        fontSize: 11,
        color: '#403830',
        padding: '20px 0',
      }}
    >
      {text}
    </div>
  )
}

export default async function Page() {
  return (
    <RefreshProvider>
      <div style={{ minHeight: '100vh', backgroundColor: '#16161A', color: '#F0EDE8' }}>
        <Header />

        <Suspense fallback={null}>
          <PulseTicker />
        </Suspense>

        <main style={{ maxWidth: 1600, margin: '0 auto', padding: '20px 24px' }}>
          <div
            className="hub-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'clamp(280px, 32%, 480px) 1fr clamp(260px, 30%, 420px)',
              gap: 16,
              alignItems: 'start',
            }}
          >
            {/* Col 1 — World News */}
            <NewsPanel />

            {/* Col 2 — Social Trends */}
            <SocialTrends />

            {/* Col 3 — Crypto + Pulse */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Suspense fallback={<LoadingBox text="Loading crypto data..." />}>
                <CryptoPanel />
              </Suspense>
              <PulsePanel />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer
          style={{
            borderTop: '1px solid rgba(240,237,232,0.06)',
            padding: '16px 24px',
            textAlign: 'center',
            fontFamily: "ui-monospace, 'SF Mono', monospace",
            fontSize: 10,
            color: '#403830',
            letterSpacing: '0.1em',
            marginTop: 32,
          }}
        >
          縁人 ENJIN INTELLIGENCE · Refreshes every 5 min · Guardian + Reddit + CoinGecko
        </footer>
      </div>
    </RefreshProvider>
  )
}
