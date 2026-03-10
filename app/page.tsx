import { TrendingCoins, MarketPrices } from './components/CoinGecko'

export const revalidate = 300 // 5 min cache

export default function BriefingPage() {
  const tier1Sources = [
    { name: 'Glassnode Alerts', desc: 'Exchange inflows, NUPL, SOPR flips' },
    { name: 'Nansen / Lookonchain', desc: 'Smart money wallet moves' },
    { name: 'Whale Alert', desc: '>$50M transfers to/from exchanges' },
    { name: 'Newsquawk', desc: 'Fed, CPI, macro surprises — pre-price' },
    { name: '@WuBlockchain', desc: 'China regulatory, Asia news first' },
    { name: '@saylor', desc: 'BTC buy announcements — institutional demand' },
    { name: 'The Block (breaking)', desc: 'Exchange hacks, regulatory actions, exploits' },
  ]

  return (
    <div className="min-h-screen bg-[#080808] text-white font-mono">
      {/* Header */}
      <header className="border-b border-[#1a1a1a] px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-[#666] text-[10px] uppercase tracking-[0.15em]">RYOJIN /</span>
          <span className="text-white text-[10px] uppercase tracking-[0.15em] ml-2">DAILY BRIEFING</span>
        </div>
        <div className="text-[#444] text-[10px]">
          {new Date().toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Australia/Brisbane' })} · AEST
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Section 1 — Market Snapshot */}
        <div className="col-span-1 lg:col-span-2">
          <SectionLabel>01 / MARKET SNAPSHOT</SectionLabel>
          <MarketPrices />
        </div>

        {/* Section 2 — Last 24h */}
        <div>
          <SectionLabel>02 / LAST 24H — TRENDING</SectionLabel>
          <TrendingCoins />
        </div>

        {/* Section 3 — CT Sources */}
        <div>
          <SectionLabel>03 / TIER 1 SIGNAL SOURCES</SectionLabel>
          <Card>
            <p className="text-[#666] text-[11px] mb-4">Accounts/feeds to check first. If they fire and price hasn{"'"}t moved — that{"'"}s the window.</p>
            <div className="flex flex-col gap-3">
              {tier1Sources.map((s) => (
                <div key={s.name} className="flex items-start gap-3 pb-3 border-b border-[#1a1a1a] last:border-0 last:pb-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] mt-1.5 shrink-0" />
                  <div>
                    <p className="text-white text-[12px] font-bold">{s.name}</p>
                    <p className="text-[#555] text-[11px] mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Section 4 — Macro Events */}
        <div>
          <SectionLabel>04 / MACRO TODAY</SectionLabel>
          <Card>
            <p className="text-[#444] text-[11px] uppercase tracking-widest mb-3">No events configured</p>
            <p className="text-[#555] text-[11px] leading-relaxed">
              Wire a macro calendar API to populate this section automatically. Suggested: Investing.com Economic Calendar (free scrape) or Tradingeconomics API.
            </p>
            <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
              <p className="text-[#333] text-[10px] uppercase tracking-widest mb-2">Watch manually:</p>
              {['Fed speakers', 'CPI / PPI releases', 'FOMC minutes', 'Earnings (mega-cap)'].map(e => (
                <div key={e} className="flex items-center gap-2 py-1">
                  <div className="w-1 h-1 bg-[#333] rounded-full" />
                  <span className="text-[#444] text-[11px]">{e}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Section 5 — Actionable */}
        <div>
          <SectionLabel>05 / ACTIONABLE TODAY</SectionLabel>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse" />
              <span className="text-[#f59e0b] text-[10px] uppercase tracking-widest">Signal Active</span>
            </div>
            <p className="text-white text-[13px] leading-relaxed mb-4">
              Run Gordon scan to check for Polymarket gaps on today{"'"}s picks. UCL games live — check BTTS markets for Newcastle vs Barcelona, Atlético vs Spurs, Atalanta vs Bayern.
            </p>
            <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
              <p className="text-[#555] text-[11px] mb-2">2-of-5 rule — open a position when:</p>
              {[
                'On-chain confirms the narrative',
                'Tier 1 source breaks something new',
                'Price hasn\'t moved yet',
                'Polymarket odds mispriced vs new info',
                'Macro context supports it',
              ].map((rule, i) => (
                <div key={i} className="flex items-start gap-2 py-1">
                  <span className="text-[#333] text-[10px] mt-0.5">{i + 1}.</span>
                  <span className="text-[#555] text-[11px]">{rule}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

      </div>

      <footer className="border-t border-[#1a1a1a] px-6 py-4 text-center">
        <span className="text-[#333] text-[10px] uppercase tracking-widest">Ryojin Intelligence · Refreshes every 5 min · Free tier APIs only</span>
      </footer>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[#444] text-[10px] uppercase tracking-[0.15em] mb-3">{children}</p>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#0f0f0f] border border-[#1a1a1a] p-5 h-full">
      {children}
    </div>
  )
}
