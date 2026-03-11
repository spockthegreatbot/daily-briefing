'use client'

import { useEffect, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

/* ─── Types ────────────────────────────────────────────────────── */
type GoogleTrend = { title: string; traffic: string; trafficN: number; articles: string[] }
type RedditPost  = { title: string; subreddit: string; score: number; comments: number; url: string }
type TwitterTrend = { rank: number; topic: string; volume?: string }
type TikTokTrend  = { rank: number; tag: string; views?: string }
type InstaTrend   = { rank: number; tag: string }

type SocialData = {
  twitter:   { trends: TwitterTrend[] }
  tiktok:    { trends: TikTokTrend[]  }
  instagram: { trends: InstaTrend[]   }
}

type Tab = 'VIRAL' | 'TWITTER' | 'TIKTOK' | 'INSTAGRAM' | 'REDDIT'
const TABS: Tab[] = ['VIRAL', 'TWITTER', 'TIKTOK', 'INSTAGRAM', 'REDDIT']

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return `${n}`
}

/* ─── Viral feed (Google Trends + Reddit mixed) ─────────────────── */
function ViralFeed() {
  const [google, setGoogle] = useState<GoogleTrend[]>([])
  const [reddit, setReddit] = useState<RedditPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/trends').then(r => r.json()).catch(() => ({ trends: [] })),
      fetch('/api/reddit').then(r => r.json()).catch(() => []),
    ]).then(([g, r]) => {
      setGoogle(g.trends ?? [])
      setReddit(Array.isArray(r) ? r : [])
      setLoading(false)
    })
  }, [])

  if (loading) return <p className="font-mono text-sm text-[var(--muted)] py-5">Loading…</p>

  // Interleave: 1 Reddit for every 2 Google items — Reddit titles surface actual viral moments
  type FeedItem =
    | { kind: 'google'; data: GoogleTrend; idx: number }
    | { kind: 'reddit'; data: RedditPost;  idx: number }

  const feed: FeedItem[] = []
  let gi = 0, ri = 0
  while (gi < google.length || ri < reddit.length) {
    if (gi < google.length) feed.push({ kind: 'google', data: google[gi++], idx: feed.length })
    if (gi < google.length) feed.push({ kind: 'google', data: google[gi++], idx: feed.length })
    if (ri < reddit.length) feed.push({ kind: 'reddit', data: reddit[ri++], idx: feed.length })
  }

  return (
    <div>
      {feed.slice(0, 22).map((item) =>
        item.kind === 'google' ? (
          <div key={`g-${item.data.title}`} className="py-2.5 border-b border-white/5">
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono text-sm text-[var(--fg)] leading-snug">{item.data.title}</span>
              <span className="font-mono text-xs text-[var(--gold)] shrink-0 mt-0.5">
                {item.data.traffic || '—'}
              </span>
            </div>
            {item.data.articles.length > 0 && (
              <div className="mt-1 space-y-0.5">
                {item.data.articles.map((a, i) => (
                  <p key={i} className="font-mono text-xs text-[var(--muted-mid)] leading-snug line-clamp-1">
                    {a}
                  </p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <a
            key={`r-${item.data.url}`}
            href={item.data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block py-2.5 border-b border-white/5 no-underline group"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-mono text-xs text-[var(--crimson)] mb-1">r/{item.data.subreddit}</p>
              <span className="font-mono text-xs text-[var(--gold)] shrink-0">▲ {fmt(item.data.score)}</span>
            </div>
            <p className="text-sm text-[var(--muted-mid)] leading-snug line-clamp-2 group-hover:text-[var(--fg)] transition-colors duration-100">
              {item.data.title}
            </p>
          </a>
        )
      )}
    </div>
  )
}

/* ─── Simple trend row ──────────────────────────────────────────── */
function TrendRow({ rank, label, meta }: { rank: number; label: string; meta?: string }) {
  return (
    <div className="flex items-baseline justify-between py-2 border-b border-white/5">
      <div className="flex items-baseline gap-3 min-w-0">
        <span className="font-mono text-xs text-[var(--muted)] w-5 shrink-0">{rank}</span>
        <span className="font-mono text-sm text-[var(--fg)] truncate">{label}</span>
      </div>
      {meta && (
        <span className="font-mono text-xs text-[var(--muted-mid)] shrink-0 ml-3">{meta}</span>
      )}
    </div>
  )
}

/* ─── Platform panels ───────────────────────────────────────────── */
function TwitterPanel({ trends }: { trends: TwitterTrend[] }) {
  if (!trends.length) return <p className="font-mono text-sm text-[var(--muted)] py-5">Scraper updates every 30 min</p>
  return <div>{trends.map(t => <TrendRow key={t.rank} rank={t.rank} label={t.topic} meta={t.volume} />)}</div>
}

function TikTokPanel({ trends }: { trends: TikTokTrend[] }) {
  if (!trends.length) return <p className="font-mono text-sm text-[var(--muted)] py-5">Scraper updates every 30 min</p>
  return <div>{trends.map(t => <TrendRow key={t.rank} rank={t.rank} label={t.tag} meta={t.views} />)}</div>
}

function InstaPanel({ trends }: { trends: InstaTrend[] }) {
  if (!trends.length) return <p className="font-mono text-sm text-[var(--muted)] py-5">Scraper updates every 30 min</p>
  return <div>{trends.map(t => <TrendRow key={t.rank} rank={t.rank} label={t.tag} />)}</div>
}

/* ─── Reddit full panel ─────────────────────────────────────────── */
function FullRedditPanel() {
  const [posts, setPosts] = useState<RedditPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reddit').then(r => r.json()).then(d => { setPosts(Array.isArray(d) ? d : []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <p className="font-mono text-sm text-[var(--muted)] py-5">Loading…</p>
  if (!posts.length) return <p className="font-mono text-sm text-[var(--muted)] py-5">No posts</p>

  return (
    <div>
      {posts.map((post, i) => (
        <a key={i} href={post.url} target="_blank" rel="noopener noreferrer"
          className="flex gap-3 py-2.5 border-b border-white/5 no-underline group">
          <span className="font-mono text-xs text-[var(--muted-mid)] w-5 shrink-0 pt-0.5">{String(i + 1).padStart(2, '0')}</span>
          <div className="min-w-0 flex-1">
            <span className="font-mono text-xs text-[var(--crimson)] block mb-1">r/{post.subreddit}</span>
            <p className="text-sm text-[var(--muted-mid)] leading-snug line-clamp-2 group-hover:text-[var(--fg)] transition-colors duration-100 m-0">
              {post.title}
            </p>
            <div className="flex gap-3 mt-1">
              <span className="font-mono text-xs text-[var(--gold)]">▲ {fmt(post.score)}</span>
              <span className="font-mono text-xs text-[var(--muted-mid)]">💬 {fmt(post.comments)}</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}

/* ─── Main ──────────────────────────────────────────────────────── */
export function SocialTrends() {
  const [active, setActive]   = useState<Tab>('VIRAL')
  const [social, setSocial]   = useState<SocialData | null>(null)
  const [socLoading, setSocLoading] = useState(true)

  useEffect(() => {
    function fetchSocial() {
      fetch('/api/social').then(r => r.json()).then((d: SocialData) => { setSocial(d); setSocLoading(false) }).catch(() => setSocLoading(false))
    }
    fetchSocial()
    const id = setInterval(fetchSocial, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div>
      <p className="font-mono text-xs tracking-[0.18em] uppercase text-[var(--muted)] mb-3">
        02 / WHAT&apos;S VIRAL
      </p>

      <div className="flex border-b border-white/[0.08] mb-4 gap-1 flex-wrap">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActive(tab)}
            className={[
              'font-mono text-xs tracking-widest uppercase px-3 py-1.5 -mb-px transition-colors duration-100 bg-transparent border-0 cursor-pointer',
              active === tab
                ? 'text-[var(--fg)] border-b-[1px] border-b-[var(--crimson)]'
                : 'text-[var(--muted)] hover:text-[var(--muted-mid)]',
            ].join(' ')}
            style={{ borderBottom: active === tab ? '1px solid var(--crimson)' : '1px solid transparent' }}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={active}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          {active === 'VIRAL'     && <ViralFeed />}
          {active === 'TWITTER'   && (socLoading ? <p className="font-mono text-sm text-[var(--muted)] py-5">Loading…</p> : <TwitterPanel trends={social?.twitter?.trends ?? []} />)}
          {active === 'TIKTOK'    && (socLoading ? <p className="font-mono text-sm text-[var(--muted)] py-5">Loading…</p> : <TikTokPanel  trends={social?.tiktok?.trends  ?? []} />)}
          {active === 'INSTAGRAM' && (socLoading ? <p className="font-mono text-sm text-[var(--muted)] py-5">Loading…</p> : <InstaPanel   trends={social?.instagram?.trends ?? []} />)}
          {active === 'REDDIT'    && <FullRedditPanel />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
