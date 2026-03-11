'use client'

import { useEffect, useState } from 'react'

type PulseData = {
  topNews: { text: string; url: string } | null
  topReddit: { text: string; url: string } | null
  crypto: { text: string; up: boolean } | null
}

// Deterministic bar heights based on hour index
function barHeight(hour: number): number {
  const v = ((hour * 2654435769 + 1234567891) >>> 0) % 100
  return 4 + (v / 100) * 28 // 4–32px
}

export function PulsePanel() {
  const [data, setData] = useState<PulseData>({ topNews: null, topReddit: null, crypto: null })

  useEffect(() => {
    // Fetch news
    fetch('/api/news?page=1')
      .then((r) => r.json())
      .then((articles) => {
        if (Array.isArray(articles) && articles.length > 0) {
          const a = articles[0]
          setData((prev) => ({
            ...prev,
            topNews: {
              text: a.fields?.headline ?? a.webTitle ?? '',
              url: a.webUrl ?? '#',
            },
          }))
        }
      })
      .catch(() => {})

    // Fetch reddit
    fetch('/api/reddit')
      .then((r) => r.json())
      .then((posts) => {
        if (Array.isArray(posts) && posts.length > 0) {
          const p = posts[0]
          setData((prev) => ({
            ...prev,
            topReddit: {
              text: p.title ?? '',
              url: p.url ?? '#',
            },
          }))
        }
      })
      .catch(() => {})

    // Fetch BTC
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true')
      .then((r) => r.json())
      .then((d) => {
        const btc = d?.bitcoin
        if (btc) {
          const sign = btc.usd_24h_change >= 0 ? '+' : ''
          setData((prev) => ({
            ...prev,
            crypto: {
              text: `BTC ${sign}${btc.usd_24h_change?.toFixed(2)}% · $${btc.usd?.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
              up: btc.usd_24h_change >= 0,
            },
          }))
        }
      })
      .catch(() => {})
  }, [])

  const cards = [
    {
      borderColor: '#C8102E',
      label: 'TOP NEWS',
      text: data.topNews?.text ?? 'Loading...',
      url: data.topNews?.url,
    },
    {
      borderColor: '#D4A017',
      label: 'TOP REDDIT',
      text: data.topReddit?.text ?? 'Loading...',
      url: data.topReddit?.url,
    },
    {
      borderColor: '#22c55e',
      label: 'CRYPTO SIGNAL',
      text: data.crypto?.text ?? 'Loading...',
      url: undefined,
    },
  ]

  return (
    <div>
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
        04 / PULSE
      </p>

      {/* Mini cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {cards.map((card) => {
          const inner = (
            <div
              style={{
                borderLeft: `2px solid ${card.borderColor}`,
                paddingLeft: 10,
                paddingTop: 6,
                paddingBottom: 6,
                paddingRight: 10,
                backgroundColor: '#1E1C1A',
                border: `1px solid rgba(240,237,232,0.08)`,
                borderLeftColor: card.borderColor,
                borderLeftWidth: 2,
              }}
            >
              <p
                style={{
                  fontFamily: "ui-monospace, 'SF Mono', monospace",
                  fontSize: 15,
                  color: '#605850',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: 4,
                }}
              >
                {card.label}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: '#A09890',
                  lineHeight: 1.4,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  margin: 0,
                }}
              >
                {card.text}
              </p>
            </div>
          )

          return card.url ? (
            <a
              key={card.label}
              href={card.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              {inner}
            </a>
          ) : (
            <div key={card.label}>{inner}</div>
          )
        })}
      </div>

      {/* 24-bar activity graph */}
      <div
        style={{
          backgroundColor: '#1E1C1A',
          border: '1px solid rgba(240,237,232,0.08)',
          padding: '10px 12px 8px',
        }}
      >
        <p
          style={{
            fontFamily: "ui-monospace, 'SF Mono', monospace",
            fontSize: 15,
            color: '#605850',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          ACTIVITY · LAST 24H
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 2,
            height: 36,
          }}
        >
          {Array.from({ length: 24 }, (_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                backgroundColor: 'rgba(200, 16, 46, 0.40)',
                height: barHeight(i),
              }}
            />
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 4,
            fontFamily: "ui-monospace, 'SF Mono', monospace",
            fontSize: 8,
            color: '#403830',
          }}
        >
          <span>-24h</span>
          <span>NOW</span>
        </div>
      </div>
    </div>
  )
}
