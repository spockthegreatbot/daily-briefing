'use client'

import { useEffect, useState, useCallback } from 'react'

type RedditPost = {
  title: string
  subreddit: string
  score: number
  comments: number
  url: string
  created_utc: number
}

type HNTrend = {
  title: string
  url: string
  score: number
  comments: number
  hnUrl: string
}

type TwitterTrend = { rank: number; topic: string; volume?: string }

type SocialData = {
  twitter: { trends: TwitterTrend[] }
}

function timeAgo(ts: number): string {
  const diff = (Date.now() - (ts < 1e12 ? ts * 1000 : ts)) / 1000
  if (diff < 60) return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return `${n}`
}

type Tab = 'REDDIT' | 'VIRAL' | 'SOCIAL'

const MAX_ITEMS = 15

export function SignalsPanel() {
  const [tab, setTab] = useState<Tab>('REDDIT')
  const [redditPosts, setRedditPosts] = useState<RedditPost[]>([])
  const [hnItems, setHnItems] = useState<HNTrend[]>([])
  const [social, setSocial] = useState<SocialData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(() => {
    Promise.all([
      fetch('/api/reddit')
        .then(r => r.ok ? r.json() : { posts: [] })
        .then(d => setRedditPosts((d.posts ?? []).slice(0, MAX_ITEMS)))
        .catch(() => {}),
      fetch('/api/trends')
        .then(r => r.ok ? r.json() : { trends: [] })
        .then(d => setHnItems((d.trends ?? []).slice(0, MAX_ITEMS)))
        .catch(() => {}),
      fetch('/api/social')
        .then(r => r.ok ? r.json() : null)
        .then(d => setSocial(d))
        .catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [loadData])

  const TABS: { key: Tab; label: string }[] = [
    { key: 'REDDIT', label: 'REDDIT' },
    { key: 'VIRAL', label: 'HN/VIRAL' },
    { key: 'SOCIAL', label: 'TRENDS' },
  ]

  return (
    <div>
      <p style={{
        fontFamily: "ui-monospace,'SF Mono',monospace",
        fontSize: 12,
        color: 'var(--muted)',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        marginBottom: 10,
      }}>
        03 / SIGNALS
      </p>

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        marginBottom: 0,
      }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              fontFamily: "ui-monospace,'SF Mono',monospace",
              fontSize: 10,
              color: tab === key ? 'var(--fg)' : 'var(--muted)',
              background: 'none',
              border: 'none',
              borderBottom: tab === key ? '1px solid var(--accent)' : '1px solid transparent',
              padding: '6px 10px',
              cursor: 'pointer',
              letterSpacing: '0.1em',
              marginBottom: -1,
              transition: 'color 0.1s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderTop: 'none',
        maxHeight: 680,
        overflowY: 'auto',
      }}>
        {loading ? (
          <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 11, color: 'var(--muted)', padding: '12px 10px' }}>
            LOADING…
          </p>
        ) : (
          <>
            {/* Reddit Crypto */}
            {tab === 'REDDIT' && (
              <div>
                {redditPosts.length === 0 ? (
                  <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 11, color: 'var(--muted)', padding: '12px 10px' }}>
                    No Reddit data
                  </p>
                ) : redditPosts.map((p, i) => (
                  <a
                    key={`reddit-${i}`}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      padding: '8px 10px',
                      borderBottom: '1px solid var(--border)',
                      textDecoration: 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(240,237,232,0.03)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, alignItems: 'center' }}>
                      <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 9, color: 'var(--accent)', letterSpacing: '0.1em' }}>
                        r/{p.subreddit}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 9, color: 'var(--muted)' }}>
                          ↑{fmtNum(p.score)} · {fmtNum(p.comments)}c
                        </span>
                        {p.created_utc > 0 && (
                          <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 9, color: 'var(--muted)' }}>
                            {timeAgo(p.created_utc)}
                          </span>
                        )}
                      </div>
                    </div>
                    <p style={{
                      fontSize: 12, color: 'var(--fg)', margin: 0, lineHeight: 1.4,
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>
                      {p.title}
                    </p>
                  </a>
                ))}
              </div>
            )}

            {/* HN / Viral */}
            {tab === 'VIRAL' && (
              <div>
                {hnItems.length === 0 ? (
                  <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 11, color: 'var(--muted)', padding: '12px 10px' }}>
                    No HN data
                  </p>
                ) : hnItems.map((item, i) => (
                  <a
                    key={`hn-${i}`}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      padding: '8px 10px',
                      borderBottom: '1px solid var(--border)',
                      textDecoration: 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(240,237,232,0.03)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, alignItems: 'center' }}>
                      <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 9, color: 'var(--gold)', letterSpacing: '0.1em' }}>
                        HACKERNEWS
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 9, color: 'var(--muted)' }}>
                          ▲ {fmtNum(item.score)} · {fmtNum(item.comments)}c
                        </span>
                        <a
                          href={item.hnUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 9, color: 'var(--muted)', textDecoration: 'none' }}
                        >
                          HN ↗
                        </a>
                      </div>
                    </div>
                    <p style={{
                      fontSize: 12, color: 'var(--fg)', margin: 0, lineHeight: 1.4,
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>
                      {item.title}
                    </p>
                  </a>
                ))}
              </div>
            )}

            {/* Social Trends */}
            {tab === 'SOCIAL' && (
              <div>
                {!social?.twitter?.trends?.length ? (
                  <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 11, color: 'var(--muted)', padding: '12px 10px' }}>
                    No trend data yet (scraper pending)
                  </p>
                ) : social.twitter.trends.slice(0, MAX_ITEMS).map((t, i) => (
                  <div key={`trend-${i}`} style={{
                    padding: '6px 10px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex', gap: 8, alignItems: 'center',
                  }}>
                    <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: 'var(--muted)', minWidth: 16 }}>
                      {t.rank}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--fg)', flex: 1 }}>
                      {t.topic}
                    </span>
                    {t.volume && (
                      <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: 'var(--accent)' }}>
                        {t.volume}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
