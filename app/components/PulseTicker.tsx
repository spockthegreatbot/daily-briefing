import React from 'react'

type TickerItem = {
  icon: string
  tag: string
  text: string
}

async function fetchTickerItems(): Promise<TickerItem[]> {
  const items: TickerItem[] = []

  // Guardian — top headline
  try {
    const res = await fetch(
      'https://content.guardianapis.com/search?api-key=test&show-fields=headline&page-size=3&order-by=newest',
      { next: { revalidate: 300 } }
    )
    if (res.ok) {
      const data = await res.json()
      const results = data.response?.results ?? []
      for (const r of results.slice(0, 2)) {
        const headline = r.fields?.headline ?? r.webTitle ?? ''
        if (headline) items.push({ icon: '🗞', tag: 'WORLD', text: headline })
      }
    }
  } catch {}

  // Reddit — top post
  try {
    const res = await fetch('https://www.reddit.com/r/all.json?limit=5&t=day', {
      headers: { 'User-Agent': 'EnjinDashboard/1.0' },
      next: { revalidate: 300 },
    })
    if (res.ok) {
      const data = await res.json()
      const posts = data?.data?.children ?? []
      for (const p of posts.slice(0, 2)) {
        const sub = p.data?.subreddit ?? 'all'
        const score = p.data?.score ?? 0
        const scoreStr = score >= 1000 ? `${(score / 1000).toFixed(1)}k` : `${score}`
        items.push({ icon: '📡', tag: 'REDDIT', text: `r/${sub}: ${scoreStr} hot · ${p.data?.title?.slice(0, 50) ?? ''}` })
      }
    }
  } catch {}

  // CoinGecko — BTC price
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true',
      { next: { revalidate: 300 } }
    )
    if (res.ok) {
      const data = await res.json()
      const btc = data?.bitcoin
      const eth = data?.ethereum
      if (btc) {
        const sign = btc.usd_24h_change >= 0 ? '+' : ''
        items.push({
          icon: '₿',
          tag: 'CRYPTO',
          text: `BTC ${sign}${btc.usd_24h_change?.toFixed(1)}% $${btc.usd?.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
        })
      }
      if (eth) {
        const sign = eth.usd_24h_change >= 0 ? '+' : ''
        items.push({
          icon: '◆',
          tag: 'CRYPTO',
          text: `ETH ${sign}${eth.usd_24h_change?.toFixed(1)}% $${eth.usd?.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
        })
      }
    }
  } catch {}

  if (items.length === 0) {
    items.push(
      { icon: '🗞', tag: 'WORLD', text: 'Loading latest headlines...' },
      { icon: '₿', tag: 'CRYPTO', text: 'Fetching crypto prices...' },
      { icon: '📡', tag: 'REDDIT', text: 'Loading trending posts...' }
    )
  }

  return items
}

export async function PulseTicker() {
  const items = await fetchTickerItems()

  // Duplicate for seamless loop
  const doubled = [...items, ...items]

  return (
    <div
      style={{
        height: 32,
        backgroundColor: '#1A1818',
        borderBottom: '1px solid rgba(240,237,232,0.06)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div className="marquee-track" style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {doubled.map((item, i) => (
          <span
            key={i}
            style={{
              fontFamily: "ui-monospace, 'SF Mono', monospace",
              fontSize: 11,
              color: '#A09890',
              whiteSpace: 'nowrap',
              paddingRight: 48,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>{item.icon}</span>
            <span
              style={{
                color: '#605850',
                fontSize: 9,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              [{item.tag}]
            </span>
            <span>{item.text}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
