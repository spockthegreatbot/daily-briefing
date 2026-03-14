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

type TikTokHashtag = {
  name: string
  views: number
  viewsFormatted: string
  trend: 'up' | 'down' | 'new' | 'stable'
  category: string | null
}

type GoogleTrend = {
  title: string
  traffic: string
  category: string | null
  newsHeadline: string | null
  newsSource: string | null
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

function CategoryTag({ category }: { category: string | null }) {
  if (!category) return null
  const colors: Record<string, string> = {
    crypto: 'var(--gold, #E8C96E)',
    market: '#6ECF8E',
    news: '#CF6E6E',
    meme: '#CF6ECF',
  }
  return (
    <span style={{
      fontFamily: "ui-monospace,'SF Mono',monospace",
      fontSize: 8,
      color: colors[category] ?? 'var(--muted)',
      border: `1px solid ${colors[category] ?? 'var(--border)'}`,
      borderRadius: 2,
      padding: '1px 4px',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {category}
    </span>
  )
}

type Tab = 'TRENDING' | 'SEARCHES' | 'REDDIT'

const MAX_ITEMS = 15

export function SignalsPanel() {
  const [tab, setTab] = useState<Tab>('TRENDING')
  const [redditPosts, setRedditPosts] = useState<RedditPost[]>([])
  const [tiktokHashtags, setTiktokHashtags] = useState<TikTokHashtag[]>([])
  const [googleTrends, setGoogleTrends] = useState<GoogleTrend[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(() => {
    Promise.all([
      fetch('/api/reddit')
        .then(r => r.ok ? r.json() : { posts: [] })
        .then(d => setRedditPosts((d.posts ?? []).slice(0, MAX_ITEMS)))
        .catch(() => {}),
      fetch('/api/tiktok-trends')
        .then(r => r.ok ? r.json() : { hashtags: [] })
        .then(d => setTiktokHashtags((d.hashtags ?? []).slice(0, MAX_ITEMS)))
        .catch(() => {}),
      fetch('/api/google-trends')
        .then(r => r.ok ? r.json() : { trends: [] })
        .then(d => setGoogleTrends((d.trends ?? []).slice(0, MAX_ITEMS)))
        .catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [loadData])

  const TABS: { key: Tab; label: string }[] = [
    { key: 'TRENDING', label: '🔥 TRENDING' },
    { key: 'SEARCHES', label: '🔍 SEARCHES' },
    { key: 'REDDIT', label: '💬 REDDIT' },
  ]

  const isCryptoRelated = (text: string) =>
    /\b(crypto|bitcoin|btc|eth|ethereum|solana|sol|memecoin|shib|doge|nft|defi|web3|blockchain|altcoin|token|pump|moon|coin|binance|coinbase|tether)\b/i.test(text)

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
            {/* TikTok Trending */}
            {tab === 'TRENDING' && (
              <div>
                {tiktokHashtags.length === 0 ? (
                  <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 11, color: 'var(--muted)', padding: '12px 10px' }}>
                    No TikTok trend data available
                  </p>
                ) : tiktokHashtags.map((h, i) => {
                  const crypto = isCryptoRelated(h.name) || h.category === 'crypto' || h.category === 'market'
                  return (
                    <div
                      key={`tiktok-${i}`}
                      style={{
                        padding: '8px 10px',
                        borderBottom: '1px solid var(--border)',
                        borderLeft: crypto ? '3px solid var(--gold, #E8C96E)' : '3px solid transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(240,237,232,0.03)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                    >
                      <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: 'var(--muted)', minWidth: 16 }}>
                        {i + 1}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 12, color: 'var(--fg)' }}>
                            🏷️ #{h.name}
                          </span>
                          <CategoryTag category={h.category} />
                        </div>
                        <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: 'var(--accent, var(--muted))' }}>
                          {h.viewsFormatted} views
                        </span>
                      </div>
                      <span style={{
                        fontFamily: "ui-monospace,'SF Mono',monospace",
                        fontSize: 10,
                        color: h.trend === 'up' ? '#6ECF8E' : h.trend === 'down' ? '#CF6E6E' : 'var(--muted)',
                      }}>
                        {h.trend === 'up' ? '▲' : h.trend === 'down' ? '▼' : '●'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Google Trends / Searches */}
            {tab === 'SEARCHES' && (
              <div>
                {googleTrends.length === 0 ? (
                  <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 11, color: 'var(--muted)', padding: '12px 10px' }}>
                    No Google Trends data
                  </p>
                ) : googleTrends.map((t, i) => {
                  const crypto = isCryptoRelated(t.title + (t.newsHeadline ?? '')) || t.category === 'crypto' || t.category === 'market'
                  return (
                    <div
                      key={`google-${i}`}
                      style={{
                        padding: '8px 10px',
                        borderBottom: '1px solid var(--border)',
                        borderLeft: crypto ? '3px solid var(--gold, #E8C96E)' : '3px solid transparent',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(240,237,232,0.03)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: 'var(--muted)', minWidth: 16 }}>
                          {i + 1}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--fg)', flex: 1 }}>
                          🔍 {t.title}
                        </span>
                        <CategoryTag category={t.category} />
                        <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: 'var(--accent, var(--muted))', whiteSpace: 'nowrap' }}>
                          {t.traffic} searches
                        </span>
                      </div>
                      {t.newsHeadline && (
                        <p style={{
                          fontSize: 10,
                          color: 'var(--muted)',
                          margin: '2px 0 0 22px',
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                        }}>
                          {t.newsHeadline}
                          {t.newsSource ? ` — ${t.newsSource}` : ''}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

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
                        {p.score > 0 && (
                          <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 9, color: 'var(--muted)' }}>
                            ↑{fmtNum(p.score)} · {fmtNum(p.comments)}c
                          </span>
                        )}
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
          </>
        )}
      </div>
    </div>
  )
}
