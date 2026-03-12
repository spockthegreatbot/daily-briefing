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
type MarketCoin = {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h_in_currency: number
  market_cap: number
}

function fmt(n: number) {
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
}

function fmtMcap(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`
  return `$${n.toFixed(0)}`
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
  { key: 'bitcoin'     as const, symbol: 'BTC' },
  { key: 'ethereum'    as const, symbol: 'ETH' },
  { key: 'solana'      as const, symbol: 'SOL' },
  { key: 'binancecoin' as const, symbol: 'BNB' },
]

const MEME_IDS = 'dogecoin,shiba-inu,pepe,dogwifhat,bonk,floki'
const MEME_SYMBOLS: Record<string, string> = {
  dogecoin: 'DOGE', 'shiba-inu': 'SHIB', pepe: 'PEPE',
  dogwifhat: 'WIF', bonk: 'BONK', floki: 'FLOKI',
}

export function CryptoPanel() {
  const [prices,   setPrices]   = useState<PriceData | null>(null)
  const [trending, setTrending] = useState<TrendingCoin[]>([])
  const [loading,  setLoading]  = useState(true)

  const [memes,    setMemes]    = useState<MarketCoin[]>([])
  const [gainers,  setGainers]  = useState<MarketCoin[]>([])
  const [losers,   setLosers]   = useState<MarketCoin[]>([])

  useEffect(() => {
    const ids = COINS.map(c => c.key).join(',')
    Promise.all([
      fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`)
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('https://api.coingecko.com/api/v3/search/trending')
        .then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([p, t]) => {
      if (p) setPrices(p)
      if (t?.coins) setTrending(t.coins.slice(0, 5))
      setLoading(false)
    })
  }, [])

  // Memecoin watchlist
  useEffect(() => {
    fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${MEME_IDS}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`)
      .then(r => r.ok ? r.json() : [])
      .then((data: MarketCoin[]) => {
        if (Array.isArray(data)) setMemes(data)
      })
      .catch(() => {})
  }, [])

  // Top movers
  useEffect(() => {
    const base = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=10&page=1&price_change_percentage=24h'
    Promise.all([
      fetch(`${base}&order=price_change_percentage_24h_desc`)
        .then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${base}&order=price_change_percentage_24h_asc`)
        .then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([up, down]) => {
      if (Array.isArray(up))   setGainers(up.slice(0, 3))
      if (Array.isArray(down)) setLosers(down.slice(0, 3))
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
                  {coin ? `${isUp ? '+' : ''}${(change ?? 0).toFixed(2)}%` : '—'}
                </span>
                {coin && <Sparkline change={change} />}
              </div>
            </div>
          )
        })}
      </div>

      {/* Trending */}
      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '12px 14px', marginBottom: 12 }}>
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
                {typeof change === 'number' && change !== 0 ? `${isUp ? '+' : ''}${(change ?? 0).toFixed(1)}%` : '—'}
              </span>
            </div>
          )
        })}
      </div>

      {/* 05 / MEMECOINS */}
      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '12px 14px', marginBottom: 12 }}>
        <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
          05 / MEMECOINS
        </p>
        {memes.length === 0 ? (
          <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 11, color: 'var(--muted)' }}>LOADING…</p>
        ) : memes.map((m, i) => {
          const change = m.price_change_percentage_24h_in_currency ?? 0
          const isUp   = change >= 0
          const sym    = MEME_SYMBOLS[m.id] ?? m.symbol.toUpperCase()
          return (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '5px 0',
              borderBottom: i < memes.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 12, fontWeight: 700, color: 'var(--fg)', minWidth: 42 }}>{sym}</span>
                <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 11, color: 'var(--muted-mid)' }}>
                  {fmt(m.current_price ?? 0)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 11, color: isUp ? '#22c55e' : '#ef4444' }}>
                  {isUp ? '+' : ''}{(change ?? 0).toFixed(1)}%
                </span>
                <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: 'var(--muted)', minWidth: 42, textAlign: 'right' as const }}>
                  {fmtMcap(m.market_cap ?? 0)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 06 / MOVERS */}
      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '12px 14px' }}>
        <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 11, color: 'var(--muted)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
          06 / MOVERS
        </p>
        {gainers.length === 0 && losers.length === 0 ? (
          <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 11, color: 'var(--muted)' }}>LOADING…</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {/* Gainers */}
            <div>
              <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 9, color: '#22c55e', letterSpacing: '0.12em', marginBottom: 6 }}>
                GAINERS ↑
              </p>
              {gainers.map(g => {
                const change = g.price_change_percentage_24h_in_currency ?? 0
                return (
                  <div key={g.id} style={{ marginBottom: 6 }}>
                    <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 11, fontWeight: 700, color: 'var(--fg)' }}>
                      {g.symbol.toUpperCase()}
                    </span>
                    <div style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: '#22c55e' }}>
                      +{(change ?? 0).toFixed(1)}%
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Losers */}
            <div>
              <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 9, color: '#ef4444', letterSpacing: '0.12em', marginBottom: 6 }}>
                LOSERS ↓
              </p>
              {losers.map(l => {
                const change = l.price_change_percentage_24h_in_currency ?? 0
                return (
                  <div key={l.id} style={{ marginBottom: 6 }}>
                    <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 11, fontWeight: 700, color: 'var(--fg)' }}>
                      {l.symbol.toUpperCase()}
                    </span>
                    <div style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: '#ef4444' }}>
                      {(change ?? 0).toFixed(1)}%
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
