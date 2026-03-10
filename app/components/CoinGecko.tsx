import React from 'react'

type CoinPrice = {
  usd: number
  usd_24h_change: number
}

type PriceData = {
  bitcoin: CoinPrice
  ethereum: CoinPrice
  solana: CoinPrice
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

function signal(change: number) {
  if (change > 2) return { label: 'UP', color: '#22c55e' }
  if (change < -2) return { label: 'DOWN', color: '#ef4444' }
  return { label: 'NEUTRAL', color: '#666' }
}

function fmt(n: number) {
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
}

export async function MarketPrices() {
  let data: PriceData | null = null
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true',
      { next: { revalidate: 300 } }
    )
    if (res.ok) data = await res.json()
  } catch {}

  const coins = [
    { key: 'bitcoin' as const, label: 'BTC', name: 'Bitcoin' },
    { key: 'ethereum' as const, label: 'ETH', name: 'Ethereum' },
    { key: 'solana' as const, label: 'SOL', name: 'Solana' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {coins.map(({ key, label, name }) => {
        const coin = data?.[key]
        const change = coin?.usd_24h_change ?? 0
        const sig = signal(change)
        return (
          <div key={key} className="bg-[#0f0f0f] border border-[#1a1a1a] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#555] text-[10px] uppercase tracking-widest">{name}</span>
              <span
                className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 font-bold"
                style={{ color: sig.color, background: `${sig.color}18`, border: `1px solid ${sig.color}33` }}
              >
                {sig.label}
              </span>
            </div>
            <p className="text-white text-[22px] font-bold tracking-tight">
              {coin ? fmt(coin.usd) : '—'}
            </p>
            <p className="text-[11px] mt-1" style={{ color: change >= 0 ? '#22c55e' : '#ef4444' }}>
              {coin ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}% 24h` : '—'}
            </p>
          </div>
        )
      })}
      {/* SPY */}
      <div className="bg-[#0f0f0f] border border-[#1a1a1a] p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[#555] text-[10px] uppercase tracking-widest">S&P 500</span>
          <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 text-[#444]" style={{ border: '1px solid #222' }}>STOCKS</span>
        </div>
        <p className="text-[#333] text-[22px] font-bold">SPY</p>
        <a href="https://finance.yahoo.com/quote/SPY" target="_blank" rel="noopener noreferrer"
          className="text-[#555] text-[11px] mt-1 hover:text-white transition-colors flex items-center gap-1">
          See Markets ↗
        </a>
      </div>
    </div>
  )
}

export async function TrendingCoins() {
  let coins: TrendingCoin[] = []
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/search/trending', { next: { revalidate: 300 } })
    if (res.ok) {
      const json = await res.json()
      coins = (json.coins ?? []).slice(0, 7)
    }
  } catch {}

  return (
    <div className="bg-[#0f0f0f] border border-[#1a1a1a] p-5 h-full">
      <p className="text-[#555] text-[11px] mb-4">Most searched on CoinGecko — last 24h.</p>
      {coins.length === 0 ? (
        <p className="text-[#333] text-[11px]">Could not fetch trending data.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {coins.map((c, i) => {
            const change = c.item.data?.price_change_percentage_24h?.usd ?? 0
            const sig = signal(change)
            return (
              <div key={c.item.id} className="flex items-center justify-between py-2 border-b border-[#141414] last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-[#333] text-[10px] w-4">{i + 1}</span>
                  <div>
                    <span className="text-white text-[12px] font-bold">{c.item.symbol.toUpperCase()}</span>
                    <span className="text-[#444] text-[10px] ml-2">{c.item.name}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold" style={{ color: sig.color }}>
                  {change !== 0 ? `${change >= 0 ? '+' : ''}${change.toFixed(1)}%` : '—'}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
