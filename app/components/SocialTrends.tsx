'use client'

import { useEffect, useState, useCallback } from 'react'

/* ── Types ─────────────────────────────────────────────── */
type HNTrend = {
  title: string
  url: string
  score: number
  comments: number
  by: string
  hnUrl: string
  source: 'hn'
}

type RedditPost = {
  title: string
  subreddit: string
  score: number
  comments: number
  url: string
  flair: string | null
}

type TwitterTrend  = { rank: number; topic: string; volume?: string }
type TikTokTrend   = { rank: number; tag: string;   views?: string }
type InstagramTrend = { rank: number; tag: string }

type SocialData = {
  twitter:   { trends: TwitterTrend[] }
  tiktok:    { trends: TikTokTrend[] }
  instagram: { trends: InstagramTrend[] }
}

/* ── Helpers ────────────────────────────────────────────── */
function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
  return `${n}`
}

/* ── Sub-components ─────────────────────────────────────── */
function EmptyState({ msg }: { msg: string }) {
  return (
    <p style={{ color: 'var(--muted)', fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: '0.75rem', padding: '1rem 0' }}>
      {msg}
    </p>
  )
}

function ViralFeed() {
  const [hnItems,     setHnItems]     = useState<HNTrend[]>([])
  const [redditPosts, setRedditPosts] = useState<RedditPost[]>([])
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState<'ALL' | 'HN' | 'REDDIT'>('ALL')

  useEffect(() => {
    setLoading(true)
    const hnPromise = fetch('/api/trends')
      .then((r) => r.json())
      .then((d) => setHnItems(Array.isArray(d.trends) ? d.trends : []))
      .catch(() => {})

    const redditPromise = fetch('https://www.reddit.com/r/all.json?limit=25&t=day')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d) return
        const posts =
          d?.data?.children?.map((c: { data: { title: string; subreddit: string; score: number; num_comments: number; permalink: string; link_flair_text: string | null } }) => ({
            title:     c.data.title,
            subreddit: c.data.subreddit,
            score:     c.data.score,
            comments:  c.data.num_comments,
            url:       `https://reddit.com${c.data.permalink}`,
            flair:     c.data.link_flair_text,
          })) ?? []
        setRedditPosts(posts)
      })
      .catch(() => {})

    Promise.all([hnPromise, redditPromise]).finally(() => setLoading(false))
  }, [])

  if (loading) return <EmptyState msg="LOADING VIRAL FEED..." />

  const showHN     = tab === 'ALL' || tab === 'HN'
  const showReddit = tab === 'ALL' || tab === 'REDDIT'

  return (
    <div>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
        {(['ALL', 'HN', 'REDDIT'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "ui-monospace,'SF Mono',monospace",
              fontSize: '0.65rem',
              letterSpacing: '0.08em',
              color: tab === t ? 'var(--accent)' : 'var(--muted)',
              padding: 0,
            }}
          >
            {t === 'HN' ? '◈ HACKERNEWS' : t === 'REDDIT' ? '◈ REDDIT' : '◈ ALL'}
          </button>
        ))}
      </div>

      {/* Reddit posts (actual viral moments) */}
      {showReddit && redditPosts.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          {showHN && (
            <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: '0.6rem', color: 'var(--muted)', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>
              REDDIT / VIRAL
            </p>
          )}
          {redditPosts.slice(0, showHN ? 8 : 15).map((post, i) => (
            <a
              key={i}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                textDecoration: 'none',
                padding: '0.55rem 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: '0.6rem', color: 'var(--muted)', minWidth: '1.5rem', paddingTop: '0.1rem' }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: 0,
                    fontSize: '0.8rem',
                    color: 'var(--fg)',
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {post.title}
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                    <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: '0.6rem', color: 'var(--accent)' }}>
                      r/{post.subreddit}
                    </span>
                    <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: '0.6rem', color: 'var(--muted)' }}>
                      ▲ {fmtNum(post.score)}
                    </span>
                    <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: '0.6rem', color: 'var(--muted)' }}>
                      💬 {fmtNum(post.comments)}
                    </span>
                    {post.flair && (
                      <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: '0.6rem', color: 'var(--muted)' }}>
                        [{post.flair}]
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {showReddit && redditPosts.length === 0 && tab === 'REDDIT' && (
        <EmptyState msg="REDDIT UNAVAILABLE" />
      )}

      {/* HN stories */}
      {showHN && hnItems.length > 0 && (
        <div>
          {showReddit && redditPosts.length > 0 && (
            <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: '0.6rem', color: 'var(--muted)', marginBottom: '0.5rem', letterSpacing: '0.1em' }}>
              HACKERNEWS / TOP
            </p>
          )}
          {hnItems.slice(0, showReddit ? 6 : 15).map((item, i) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                textDecoration: 'none',
                padding: '0.55rem 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: '0.6rem', color: 'var(--muted)', minWidth: '1.5rem', paddingTop: '0.1rem' }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: 0,
                    fontSize: '0.8rem',
                    color: 'var(--fg)',
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {item.title}
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                    <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: '0.6rem', color: 'var(--gold)' }}>
                      ▲ {fmtNum(item.score)} pts
                    </span>
                    <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: '0.6rem', color: 'var(--muted)' }}>
                      💬 {fmtNum(item.comments)}
                    </span>
                    <a
                      href={item.hnUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: '0.6rem', color: 'var(--muted)', textDecoration: 'none' }}
                    >
                      HN ↗
                    </a>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {showHN && hnItems.length === 0 && tab === 'HN' && (
        <EmptyState msg="HACKERNEWS UNAVAILABLE" />
      )}
    </div>
  )
}

/* ── Social scraper panels ──────────────────────────────── */
function SocialScraperFeed({ data }: { data: SocialData | null }) {
  const [tab, setTab] = useState<'TWITTER' | 'TIKTOK' | 'INSTA'>('TWITTER')

  if (!data) return <EmptyState msg="SCRAPER DATA UNAVAILABLE (RUNS EVERY 30MIN)" />

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
        {(['TWITTER', 'TIKTOK', 'INSTA'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "ui-monospace,'SF Mono',monospace",
              fontSize: '0.65rem',
              letterSpacing: '0.08em',
              color: tab === t ? 'var(--accent)' : 'var(--muted)',
              padding: 0,
            }}
          >
            ◈ {t}
          </button>
        ))}
      </div>

      {tab === 'TWITTER' && (
        <div>
          {data.twitter.trends.length === 0
            ? <EmptyState msg="NO TWITTER DATA YET (SCRAPER PENDING)" />
            : data.twitter.trends.map((t, i) => (
                <div key={i} style={{ padding: '0.45rem 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: '0.6rem', color: 'var(--muted)', minWidth: '1.2rem' }}>{t.rank}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--fg)', flex: 1 }}>{t.topic}</span>
                  {t.volume && <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: '0.6rem', color: 'var(--accent)' }}>{t.volume}</span>}
                </div>
              ))
          }
        </div>
      )}

      {tab === 'TIKTOK' && (
        <div>
          {data.tiktok.trends.length === 0
            ? <EmptyState msg="NO TIKTOK DATA YET (SCRAPER PENDING)" />
            : data.tiktok.trends.map((t, i) => (
                <div key={i} style={{ padding: '0.45rem 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: '0.6rem', color: 'var(--muted)', minWidth: '1.2rem' }}>{t.rank}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--fg)', flex: 1 }}>#{t.tag}</span>
                  {t.views && <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: '0.6rem', color: 'var(--accent)' }}>{t.views}</span>}
                </div>
              ))
          }
        </div>
      )}

      {tab === 'INSTA' && (
        <div>
          {data.instagram.trends.length === 0
            ? <EmptyState msg="NO INSTAGRAM DATA YET (SCRAPER PENDING)" />
            : data.instagram.trends.map((t, i) => (
                <div key={i} style={{ padding: '0.45rem 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: '0.6rem', color: 'var(--muted)', minWidth: '1.2rem' }}>{t.rank}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--fg)', flex: 1 }}>#{t.tag}</span>
                </div>
              ))
          }
        </div>
      )}
    </div>
  )
}

/* ── Main component ─────────────────────────────────────── */
type MainTab = 'VIRAL' | 'SOCIAL'

export function SocialTrends() {
  const [mainTab, setMainTab] = useState<MainTab>('VIRAL')
  const [social,  setSocial]  = useState<SocialData | null>(null)

  const loadSocial = useCallback(() => {
    fetch('/api/social').then((r) => r.json()).then(setSocial).catch(() => {})
  }, [])

  useEffect(() => {
    loadSocial()
    const interval = setInterval(loadSocial, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [loadSocial])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Main tabs */}
      <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
        {(['VIRAL', 'SOCIAL'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setMainTab(t)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "ui-monospace,'SF Mono',monospace",
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              color: mainTab === t ? 'var(--fg)' : 'var(--muted)',
              borderBottom: mainTab === t ? '1px solid var(--accent)' : 'none',
              paddingBottom: '0.5rem',
              marginBottom: '-0.76rem',
              padding: '0 0 0.75rem 0',
            }}
          >
            {t === 'VIRAL' ? '🔥 VIRAL' : '📡 SOCIAL'}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {mainTab === 'VIRAL'  && <ViralFeed />}
        {mainTab === 'SOCIAL' && <SocialScraperFeed data={social} />}
      </div>
    </div>
  )
}
