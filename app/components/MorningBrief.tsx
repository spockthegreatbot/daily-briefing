'use client'

import { useEffect, useState } from 'react'

type BriefItem = {
  text: string
  tag: string
  source: string
}

const TAG_COLORS: Record<string, string> = {
  '📈 Market impact': '#22c55e',
  '⚠️ Risk signal': '#ef4444',
  '💡 Opportunity': '#E8C96E',
  '📊 Data point': '#6b7280',
  '🔥 Trending': '#f97316',
}

export function MorningBrief() {
  const [items, setItems] = useState<BriefItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/brief')
      .then(r => r.ok ? r.json() : { items: [] })
      .then(data => {
        setItems(data.items ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const now = new Date()
  const brisHour = (now.getUTCHours() + 10) % 24
  const greeting = brisHour < 12 ? 'MORNING' : brisHour < 17 ? 'AFTERNOON' : 'EVENING'

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: '3px solid #E8C96E',
      padding: '18px 22px',
      marginBottom: 24,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
      }}>
        <p style={{
          fontFamily: "ui-monospace,'SF Mono',monospace",
          fontSize: 13,
          color: '#E8C96E',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          margin: 0,
          fontWeight: 700,
        }}>
          ☀️ {greeting} BRIEF
        </p>
        <p style={{
          fontFamily: "ui-monospace,'SF Mono',monospace",
          fontSize: 10,
          color: 'var(--muted)',
          margin: 0,
        }}>
          Read this in 30 seconds
        </p>
      </div>

      {loading ? (
        <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 13, color: 'var(--muted)' }}>
          Composing brief...
        </p>
      ) : items.length === 0 ? (
        <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 13, color: 'var(--muted)' }}>
          No data available yet — check back shortly.
        </p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {items.map((item, i) => (
            <li key={i} style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              padding: '6px 0',
              borderBottom: i < items.length - 1 ? '1px solid rgba(240,237,232,0.04)' : 'none',
            }}>
              <span style={{
                fontFamily: "ui-monospace,'SF Mono',monospace",
                fontSize: 10,
                color: TAG_COLORS[item.tag] ?? 'var(--muted)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                paddingTop: 2,
                minWidth: 110,
              }}>
                {item.tag}
              </span>
              <span style={{
                fontSize: 14,
                color: 'var(--fg)',
                lineHeight: 1.5,
                flex: 1,
              }}>
                {item.text}
              </span>
              <span style={{
                fontFamily: "ui-monospace,'SF Mono',monospace",
                fontSize: 9,
                color: 'var(--muted)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                paddingTop: 3,
              }}>
                {item.source}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
