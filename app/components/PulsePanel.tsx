'use client'

import { useEffect, useState } from 'react'

type FNG = { value: string; value_classification: string }
type GlobalMarket = {
  total_market_cap: { usd: number }
  market_cap_change_percentage_24h_usd: number
  btc_dominance: number
  eth_dominance: number
  active_cryptocurrencies: number
}
type TopPost = { title: string; url: string; subreddit: string; score: number }
type TopNews = { title: string; url: string; source: string }

function fmtCap(n: number | undefined | null) {
  if (!n || isNaN(n)) return '—'
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`
  return `$${n.toLocaleString()}`
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
  return `${n}`
}

function barHeight(hour: number): number {
  const v = ((hour * 2654435769 + 1234567891) >>> 0) % 100
  return 4 + (v / 100) * 28
}

function FearGaugeMeter({ value }: { value: number }) {
  // Simple 0-100 arc gauge using SVG
  const angle  = (value / 100) * 180 - 90  // -90 to +90 degrees
  const rad    = (angle * Math.PI) / 180
  const cx     = 60
  const cy     = 55
  const r      = 44
  const nx     = cx + r * Math.cos(rad)
  const ny     = cy + r * Math.sin(rad)

  const color =
    value >= 75 ? '#22c55e' :
    value >= 55 ? '#86efac' :
    value >= 45 ? '#facc15' :
    value >= 25 ? '#fb923c' : '#ef4444'

  return (
    <svg width={120} height={66} style={{ display: 'block', margin: '0 auto' }}>
      {/* Background arc */}
      <path
        d="M 16,55 A 44,44 0 0,1 104,55"
        fill="none"
        stroke="rgba(240,237,232,0.08)"
        strokeWidth={8}
        strokeLinecap="round"
      />
      {/* Coloured fill arc (simple segments) */}
      {[
        { label: 'EF', color: '#ef4444', start: 0,   end: 25  },
        { label: 'OR', color: '#fb923c', start: 25,  end: 45  },
        { label: 'YL', color: '#facc15', start: 45,  end: 55  },
        { label: 'LG', color: '#86efac', start: 55,  end: 75  },
        { label: 'GN', color: '#22c55e', start: 75,  end: 100 },
      ].map(({ color: c, start, end }) => {
        const a1  = ((start / 100) * 180 - 90) * (Math.PI / 180)
        const a2  = ((end   / 100) * 180 - 90) * (Math.PI / 180)
        const x1  = cx + r * Math.cos(a1)
        const y1  = cy + r * Math.sin(a1)
        const x2  = cx + r * Math.cos(a2)
        const y2  = cy + r * Math.sin(a2)
        const lg  = end - start > 50 ? 1 : 0
        return (
          <path
            key={c}
            d={`M ${x1},${y1} A ${r},${r} 0 ${lg},1 ${x2},${y2}`}
            fill="none"
            stroke={c}
            strokeWidth={8}
            strokeLinecap="round"
            opacity={value >= start ? 0.7 : 0.15}
          />
        )
      })}
      {/* Needle */}
      <line
        x1={cx} y1={cy}
        x2={nx}  y2={ny}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={3} fill={color} />
      {/* Value */}
      <text x={cx} y={cy + 16} textAnchor="middle"
        style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: '11px', fill: color, fontWeight: 700 }}>
        {value}
      </text>
    </svg>
  )
}

export function PulsePanel() {
  const [fng,     setFng]     = useState<FNG | null>(null)
  const [global,  setGlobal]  = useState<GlobalMarket | null>(null)
  const [topPost, setTopPost] = useState<TopPost | null>(null)
  const [topNews, setTopNews] = useState<TopNews | null>(null)

  useEffect(() => {
    // Fear & Greed Index
    fetch('https://api.alternative.me/fng/?limit=1')
      .then(r => r.json())
      .then(d => setFng(d?.data?.[0] ?? null))
      .catch(() => {})

    // CoinGecko global market
    fetch('https://api.coingecko.com/api/v3/global')
      .then(r => r.json())
      .then(d => setGlobal(d?.data ?? null))
      .catch(() => {})

    // Reddit top post (client-side)
    fetch('https://www.reddit.com/r/all.json?limit=5&t=day', { mode: 'cors' })
      .then(r => r.json())
      .then(d => {
        const c = d?.data?.children?.[0]?.data
        if (c) setTopPost({ title: c.title, url: `https://reddit.com${c.permalink}`, subreddit: c.subreddit, score: c.score })
      })
      .catch(() => {})

    // Top news
    fetch('/api/news?page=1')
      .then(r => r.json())
      .then(articles => {
        if (Array.isArray(articles) && articles.length > 0) {
          const a = articles[0]
          setTopNews({
            title:  a.fields?.headline ?? a.webTitle ?? a.title ?? '',
            url:    a.webUrl ?? a.url ?? '#',
            source: a.source?.name ?? 'THE GUARDIAN',
          })
        }
      })
      .catch(() => {})
  }, [])

  const fngVal   = fng ? parseInt(fng.value) : null
  const capChg   = global?.market_cap_change_percentage_24h_usd ?? 0
  const capUp    = capChg >= 0

  return (
    <div style={{
      borderTop: '1px solid var(--border)',
      paddingTop: '1.5rem',
      marginTop: '0.5rem',
    }}>
      <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 12, color: 'var(--muted)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '1rem' }}>
        04 / PULSE
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
      }}>

        {/* ① Fear & Greed */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '1rem' }}>
          <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: '0.14em', marginBottom: '0.5rem' }}>
            FEAR &amp; GREED INDEX
          </p>
          {fngVal !== null ? (
            <>
              <FearGaugeMeter value={fngVal} />
              <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: '0.25rem', letterSpacing: '0.1em' }}>
                {fng!.value_classification.toUpperCase()}
              </p>
            </>
          ) : (
            <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 11, color: 'var(--muted)' }}>LOADING…</p>
          )}
        </div>

        {/* ② Global Market */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '1rem' }}>
          <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: '0.14em', marginBottom: '0.75rem' }}>
            GLOBAL MARKET
          </p>
          {global ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { label: 'TOTAL CAP', value: fmtCap(global.total_market_cap?.usd) },
                { label: '24H CHANGE', value: capChg != null ? `${capUp ? '+' : ''}${capChg.toFixed(2)}%` : '—', color: capUp ? '#22c55e' : '#ef4444' },
                { label: 'BTC DOM', value: global.btc_dominance != null ? `${global.btc_dominance.toFixed(1)}%` : '—' },
                { label: 'ETH DOM', value: global.eth_dominance != null ? `${global.eth_dominance.toFixed(1)}%` : '—' },
                { label: 'COINS', value: global.active_cryptocurrencies?.toLocaleString() ?? '—' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: 'var(--muted)' }}>{row.label}</span>
                  <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 12, fontWeight: 700, color: row.color ?? 'var(--fg)' }}>{row.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 11, color: 'var(--muted)' }}>LOADING…</p>
          )}
        </div>

        {/* ③ Top News */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '1rem', borderLeftColor: 'var(--accent)', borderLeftWidth: 2 }}>
          <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: '0.14em', marginBottom: '0.5rem' }}>
            TOP STORY
          </p>
          {topNews ? (
            <>
              <a href={topNews.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <p style={{
                  fontSize: '0.8rem', color: 'var(--fg)', lineHeight: 1.4, margin: '0 0 0.4rem',
                  overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                }}>
                  {topNews.title}
                </p>
              </a>
              <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: '0.1em' }}>
                {topNews.source}
              </span>
            </>
          ) : (
            <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 11, color: 'var(--muted)' }}>LOADING…</p>
          )}
        </div>

        {/* ④ Top Reddit */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '1rem', borderLeftColor: 'var(--gold)', borderLeftWidth: 2 }}>
          <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: '0.14em', marginBottom: '0.5rem' }}>
            TOP REDDIT
          </p>
          {topPost ? (
            <>
              <a href={topPost.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <p style={{
                  fontSize: '0.8rem', color: 'var(--fg)', lineHeight: 1.4, margin: '0 0 0.4rem',
                  overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                }}>
                  {topPost.title}
                </p>
              </a>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: 'var(--accent)' }}>r/{topPost.subreddit}</span>
                <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: 'var(--muted)' }}>▲ {fmtNum(topPost.score)}</span>
              </div>
            </>
          ) : (
            <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 11, color: 'var(--muted)' }}>LOADING…</p>
          )}
        </div>

        {/* ⑤ Activity graph */}
        <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', padding: '1rem' }}>
          <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: 'var(--muted)', letterSpacing: '0.14em', marginBottom: '0.75rem' }}>
            ACTIVITY · LAST 24H
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 44 }}>
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} style={{ flex: 1, backgroundColor: 'rgba(200,16,46,0.40)', height: barHeight(i) }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 8, color: 'var(--muted)' }}>
            <span>-24H</span><span>NOW</span>
          </div>
        </div>

      </div>
    </div>
  )
}
