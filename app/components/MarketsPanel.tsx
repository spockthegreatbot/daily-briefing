'use client'

import { useEffect, useState } from 'react'

type CoinPrice = { usd: number; usd_24h_change: number }
type PriceData = {
  bitcoin: CoinPrice
  ethereum: CoinPrice
  solana: CoinPrice
  binancecoin: CoinPrice
}
type FNG = { value: string; value_classification: string }
type GlobalMarket = {
  total_market_cap: { usd: number }
  market_cap_change_percentage_24h_usd: number
  btc_dominance: number
  eth_dominance: number
}
type MarketCoin = {
  id: string
  symbol: string
  current_price: number
  price_change_percentage_24h_in_currency: number
  market_cap: number
}

function fmt(n: number) {
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
}

function fmtCap(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  return `$${n.toLocaleString()}`
}

const COINS = [
  { key: 'bitcoin' as const, symbol: 'BTC' },
  { key: 'ethereum' as const, symbol: 'ETH' },
  { key: 'solana' as const, symbol: 'SOL' },
  { key: 'binancecoin' as const, symbol: 'BNB' },
]

const MEME_IDS = 'dogecoin,shiba-inu,pepe,dogwifhat,bonk,floki'
const MEME_SYMBOLS: Record<string, string> = {
  dogecoin: 'DOGE', 'shiba-inu': 'SHIB', pepe: 'PEPE',
  dogwifhat: 'WIF', bonk: 'BONK', floki: 'FLOKI',
}

export function MarketsPanel() {
  const [prices, setPrices] = useState<PriceData | null>(null)
  const [fng, setFng] = useState<FNG | null>(null)
  const [global, setGlobal] = useState<GlobalMarket | null>(null)
  const [memes, setMemes] = useState<MarketCoin[]>([])
  const [gainers, setGainers] = useState<MarketCoin[]>([])
  const [losers, setLosers] = useState<MarketCoin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ids = COINS.map(c => c.key).join(',')
    Promise.all([
      fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`)
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('https://api.alternative.me/fng/?limit=1')
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('https://api.coingecko.com/api/v3/global')
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${MEME_IDS}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`)
        .then(r => r.ok ? r.json() : []).catch(() => []),
      // Top movers
      fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=5&page=1&price_change_percentage=24h&order=price_change_percentage_24h_desc')
        .then(r => r.ok ? r.json() : []).catch(() => []),
      fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=5&page=1&price_change_percentage=24h&order=price_change_percentage_24h_asc')
        .then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([p, f, g, m, up, down]) => {
      if (p) setPrices(p)
      if (f?.data?.[0]) setFng(f.data[0])
      if (g?.data) setGlobal(g.data)
      if (Array.isArray(m)) setMemes(m.slice(0, 6))
      if (Array.isArray(up)) setGainers(up.slice(0, 3))
      if (Array.isArray(down)) setLosers(down.slice(0, 3))
      setLoading(false)
    })
  }, [])

  const fngVal = fng ? parseInt(fng.value) : null
  const fngColor = fngVal !== null
    ? fngVal >= 75 ? '#22c55e' : fngVal >= 55 ? '#86efac' : fngVal >= 45 ? '#facc15' : fngVal >= 25 ? '#fb923c' : '#ef4444'
    : 'var(--muted)'
  const capChg = global?.market_cap_change_percentage_24h_usd ?? 0

  if (loading) {
    return (
      <div>
        <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 12, color: 'var(--muted)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>
          02 / MARKETS
        </p>
        <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 12, color: 'var(--muted)' }}>LOADING…</p>
      </div>
    )
  }

  return (
    <div>
      <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 12, color: 'var(--muted)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>
        02 / MARKETS
      </p>

      {/* Fear & Greed + Global in a compact row */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10,
      }}>
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '10px 12px' }}>
          <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: '0.12em', margin: '0 0 6px' }}>
            FEAR & GREED
          </p>
          {fngVal !== null ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 22, fontWeight: 700, color: fngColor }}>{fngVal}</span>
              <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: fngColor }}>{fng!.value_classification.toUpperCase()}</span>
            </div>
          ) : <span style={{ color: 'var(--muted)', fontSize: 11 }}>—</span>}
        </div>
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '10px 12px' }}>
          <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: '0.12em', margin: '0 0 6px' }}>
            TOTAL MARKET CAP
          </p>
          {global ? (
            <>
              <div style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 14, fontWeight: 700, color: 'var(--fg)' }}>
                {fmtCap(global.total_market_cap?.usd ?? 0)}
              </div>
              <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: capChg >= 0 ? '#22c55e' : '#ef4444' }}>
                {capChg >= 0 ? '+' : ''}{capChg.toFixed(2)}% 24h
              </span>
            </>
          ) : <span style={{ color: 'var(--muted)', fontSize: 11 }}>—</span>}
        </div>
      </div>

      {/* Dominance row */}
      {global && (
        <div style={{
          display: 'flex', gap: 12, marginBottom: 10, padding: '6px 12px',
          backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
        }}>
          <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: 'var(--muted)' }}>
            BTC: <span style={{ color: 'var(--fg)', fontWeight: 700 }}>{global.btc_dominance?.toFixed(1)}%</span>
          </span>
          <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: 'var(--muted)' }}>
            ETH: <span style={{ color: 'var(--fg)', fontWeight: 700 }}>{global.eth_dominance?.toFixed(1)}%</span>
          </span>
        </div>
      )}

      {/* Prices */}
      <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', marginBottom: 10 }}>
        {COINS.map(({ key, symbol }, i) => {
          const coin = prices?.[key]
          const change = coin?.usd_24h_change ?? 0
          const isUp = change >= 0
          return (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 12px',
              borderBottom: i < COINS.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 13, fontWeight: 700, color: 'var(--fg)', minWidth: 34 }}>{symbol}</span>
                <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 13, color: 'var(--fg)' }}>
                  {coin ? fmt(coin.usd) : '—'}
                </span>
              </div>
              <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 13, fontWeight: 700, color: isUp ? '#22c55e' : '#ef4444' }}>
                {coin ? `${isUp ? '+' : ''}${change.toFixed(2)}%` : '—'}
              </span>
            </div>
          )
        })}
      </div>

      {/* Memecoins */}
      {memes.length > 0 && (
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '10px 12px', marginBottom: 10 }}>
          <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: '0.12em', marginBottom: 8, textTransform: 'uppercase' }}>
            MEMECOINS
          </p>
          {memes.map((m, i) => {
            const change = m.price_change_percentage_24h_in_currency ?? 0
            const isUp = change >= 0
            const sym = MEME_SYMBOLS[m.id] ?? m.symbol.toUpperCase()
            return (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '4px 0',
                borderBottom: i < memes.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 11, fontWeight: 700, color: 'var(--fg)', minWidth: 38 }}>{sym}</span>
                  <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: 'var(--muted-mid)' }}>
                    {fmt(m.current_price ?? 0)}
                  </span>
                </div>
                <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: isUp ? '#22c55e' : '#ef4444' }}>
                  {isUp ? '+' : ''}{change.toFixed(1)}%
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Top Movers */}
      {(gainers.length > 0 || losers.length > 0) && (
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '10px 12px' }}>
          <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: '0.12em', marginBottom: 8, textTransform: 'uppercase' }}>
            TOP MOVERS 24H
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 9, color: '#22c55e', marginBottom: 4 }}>GAINERS ↑</p>
              {gainers.map(g => (
                <div key={g.id} style={{ marginBottom: 4 }}>
                  <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, fontWeight: 700, color: 'var(--fg)' }}>{g.symbol.toUpperCase()}</span>
                  <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: '#22c55e', marginLeft: 4 }}>
                    +{(g.price_change_percentage_24h_in_currency ?? 0).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
            <div>
              <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 9, color: '#ef4444', marginBottom: 4 }}>LOSERS ↓</p>
              {losers.map(l => (
                <div key={l.id} style={{ marginBottom: 4 }}>
                  <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, fontWeight: 700, color: 'var(--fg)' }}>{l.symbol.toUpperCase()}</span>
                  <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: '#ef4444', marginLeft: 4 }}>
                    {(l.price_change_percentage_24h_in_currency ?? 0).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
