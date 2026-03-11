'use client'

import { useEffect, useState } from 'react'

type CoinPrice = { usd: number; usd_24h_change: number }
type PriceData = {
  bitcoin: CoinPrice
  ethereum: CoinPrice
  solana: CoinPrice
  binancecoin: CoinPrice
}
type TrendingCoin = {
  item: {
    id: string
    name: string
    symbol: string
    data?: { price_change_percentage_24h?: { usd?: number }; price?: string }
  }
}

function fmt(n: number) {
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
}

function Sparkline({ change }: { change: number }) {
  const seed = Math.abs(Math.round(change * 100))
  const bars = Array.from({ length: 7 }, (_, i) => {
    const v = ((seed * (i + 1) * 2654435769) >>> 0) % 100
    return 4 + (v / 100) * 20
  })
  return (
    <svg width={36} height={24} style={{ display: 'block' }}>
      {bars.map((h, i) => (
        <rect key={i} x={i * 5} y={24 - h} width={4} height={h}
          fill={change >= 0 ? '#22c55e' : '#ef4444'} opacity={0.5} />
      ))}
    </svg>
  )
}

const COINS = [
  { key: 'bitcoin' as const,     symbol: 'BTC' },
  { key: 'ethereum' as const,    symbol: 'ETH' },
  { key: 'solana' as const,      symbol: 'SOL' },
  { key: 'binancecoin' as const, symbol: 'BNB' },
]

export function CryptoPanel() {
  const [prices,   setPrices]   = useState<PriceData | null>(null)
  const [trending, setTrending] = useState<TrendingCoin[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const ids = COINS.map(c => c.key).join(',')
    Promise.all([
      fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
      fetch('https://api.coingecko.com/api/v3/search/trending')
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
    ]).then(([p, t]) => {
      if (p) setPrices(p)
      if (t?.coins) setTrending(t.coins.slice(0, 5))
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div>
        <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 12, color: 'var(--muted)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>
          03 / CRYPTO
        </p>
        <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 12, color: 'var(--muted)' }}>LOADING…</p>
      </div>
    )
  }

  return (
    <div>
      <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 12, color: 'var(--muted)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>
        03 / CRYPTO
      </p>

      {/* Prices */}
      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '2px 0', marginBottom: 12 }}>
        {COINS.map(({ key, symbol }, i) => {
          const coin   = prices?.[key]
          const change = coin?.usd_24h_change ?? 0
          const isUp   = change >= 0
          return (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px',
              borderBottom: i < COINS.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 15, fontWeight: 700, color: 'var(--fg)', minWidth: 36 }}>{symbol}</span>
                <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 14, color: 'var(--fg)' }}>
                  {coin ? fmt(coin.usd) : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 15, color: isUp ? '#22c55e' : '#ef4444' }}>
                  {coin ? `${isUp ? '+' : ''}${change.toFixed(2)}%` : '—'}
                </span>
                {coin && <Sparkline change={change} />}
              </div>
            </div>
          )
        })}
      </div>

      {/* Trending */}
      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '12px 14px' }}>
        <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
          TRENDING · COINGECKO 24H
        </p>
        {trending.length === 0 ? (
          <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 12, color: 'var(--muted)' }}>No data.</p>
        ) : trending.map((c, i) => {
          const change = c.item.data?.price_change_percentage_24h?.usd ?? 0
          const isUp   = change >= 0
          return (
            <div key={c.item.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 0',
              borderBottom: i < trending.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 11, color: 'var(--muted)', minWidth: 18 }}>{(i + 1).toString().padStart(2, '0')}</span>
                <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 12, fontWeight: 700, color: 'var(--fg)' }}>{c.item.symbol.toUpperCase()}</span>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>{c.item.name}</span>
              </div>
              <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 12, fontWeight: 700, color: isUp ? '#22c55e' : '#ef4444' }}>
                {change !== 0 ? `${isUp ? '+' : ''}${change.toFixed(1)}%` : '—'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
