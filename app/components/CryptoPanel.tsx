import React from 'react'

type CoinPrice = {
  usd: number
  usd_24h_change: number
}

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
    data?: {
      price_change_percentage_24h?: { usd?: number }
      price?: string
    }
  }
}

function fmt(n: number) {
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
}

// Deterministic mini-sparkline bars based on change value (aesthetic only)
function Sparkline({ change }: { change: number }) {
  // Generate 7 plausible-looking bar heights
  const seed = Math.abs(Math.round(change * 100))
  const bars = Array.from({ length: 7 }, (_, i) => {
    const v = ((seed * (i + 1) * 2654435769) >>> 0) % 100
    return 4 + (v / 100) * 20 // 4–24px height
  })

  return (
    <svg width={36} height={24} style={{ display: 'block' }}>
      {bars.map((h, i) => (
        <rect
          key={i}
          x={i * 5}
          y={24 - h}
          width={4}
          height={h}
          fill={change >= 0 ? '#22c55e' : '#ef4444'}
          opacity={0.5}
        />
      ))}
    </svg>
  )
}

export async function CryptoPanel() {
  let prices: PriceData | null = null
  let trending: TrendingCoin[] = []

  try {
    const [priceRes, trendRes] = await Promise.allSettled([
      fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,binancecoin&vs_currencies=usd&include_24hr_change=true',
        { next: { revalidate: 300 } }
      ),
      fetch('https://api.coingecko.com/api/v3/search/trending', { next: { revalidate: 300 } }),
    ])

    if (priceRes.status === 'fulfilled' && priceRes.value.ok) {
      prices = await priceRes.value.json()
    }
    if (trendRes.status === 'fulfilled' && trendRes.value.ok) {
      const json = await trendRes.value.json()
      trending = (json.coins ?? []).slice(0, 5)
    }
  } catch {}

  const coins = [
    { key: 'bitcoin' as const, symbol: 'BTC' },
    { key: 'ethereum' as const, symbol: 'ETH' },
    { key: 'solana' as const, symbol: 'SOL' },
    { key: 'binancecoin' as const, symbol: 'BNB' },
  ]

  return (
    <div>
      {/* Section label */}
      <p
        style={{
          fontFamily: "ui-monospace, 'SF Mono', monospace",
          fontSize: 12,
          color: '#605850',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        03 / CRYPTO
      </p>

      {/* Market prices */}
      <div
        style={{
          backgroundColor: '#1E1C1A',
          border: '1px solid rgba(240,237,232,0.08)',
          padding: '2px 0',
          marginBottom: 12,
        }}
      >
        {coins.map(({ key, symbol }, i) => {
          const coin = prices?.[key]
          const change = coin?.usd_24h_change ?? 0
          const isUp = change >= 0
          return (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderBottom: i < coins.length - 1 ? '1px solid rgba(240,237,232,0.06)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    fontFamily: "ui-monospace, 'SF Mono', monospace",
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#F0EDE8',
                    minWidth: 36,
                  }}
                >
                  {symbol}
                </span>
                <span
                  style={{
                    fontFamily: "ui-monospace, 'SF Mono', monospace",
                    fontSize: 14,
                    color: '#F0EDE8',
                  }}
                >
                  {coin ? fmt(coin.usd) : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    fontFamily: "ui-monospace, 'SF Mono', monospace",
                    fontSize: 15,
                    color: isUp ? '#22c55e' : '#ef4444',
                  }}
                >
                  {coin
                    ? `${isUp ? '+' : ''}${change.toFixed(2)}%`
                    : '—'}
                </span>
                {coin && <Sparkline change={change} />}
              </div>
            </div>
          )
        })}
      </div>

      {/* Trending coins */}
      <div
        style={{
          backgroundColor: '#1E1C1A',
          border: '1px solid rgba(240,237,232,0.08)',
          padding: '12px 14px',
        }}
      >
        <p
          style={{
            fontFamily: "ui-monospace, 'SF Mono', monospace",
            fontSize: 15,
            color: '#605850',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          TRENDING · COINGECKO 24H
        </p>
        {trending.length === 0 ? (
          <p
            style={{
              fontFamily: "ui-monospace, 'SF Mono', monospace",
              fontSize: 15,
              color: '#403830',
            }}
          >
            Could not load trending.
          </p>
        ) : (
          <div>
            {trending.map((c, i) => {
              const change = c.item.data?.price_change_percentage_24h?.usd ?? 0
              const isUp = change >= 0
              return (
                <div
                  key={c.item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 0',
                    borderBottom: i < trending.length - 1 ? '1px solid rgba(240,237,232,0.06)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontFamily: "ui-monospace, 'SF Mono', monospace",
                        fontSize: 12,
                        color: '#605850',
                        minWidth: 18,
                      }}
                    >
                      {(i + 1).toString().padStart(2, '0')}
                    </span>
                    <span
                      style={{
                        fontFamily: "ui-monospace, 'SF Mono', monospace",
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#F0EDE8',
                      }}
                    >
                      {c.item.symbol.toUpperCase()}
                    </span>
                    <span
                      style={{
                        fontSize: 15,
                        color: '#605850',
                      }}
                    >
                      {c.item.name}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "ui-monospace, 'SF Mono', monospace",
                      fontSize: 15,
                      fontWeight: 700,
                      color: isUp ? '#22c55e' : '#ef4444',
                    }}
                  >
                    {change !== 0 ? `${isUp ? '+' : ''}${change.toFixed(1)}%` : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
