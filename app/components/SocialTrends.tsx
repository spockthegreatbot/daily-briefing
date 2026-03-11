'use client'

import { useEffect, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RedditPanel } from './RedditPanel'

/* ─── Types ─────────────────────────────────────────────────── */
type GoogleTrend = { title: string; traffic: string; articles: string[]; geo: string }
type TwitterTrend = { rank: number; topic: string; volume?: string }
type TikTokTrend  = { rank: number; tag: string; views?: string }
type InstaTrend   = { rank: number; tag: string }

type TrendsData = { trends: GoogleTrend[]; region: string }
type SocialData = {
  twitter:   { trends: TwitterTrend[] }
  tiktok:    { trends: TikTokTrend[]  }
  instagram: { trends: InstaTrend[]   }
}

type Tab = 'TRENDING' | 'TWITTER' | 'TIKTOK' | 'INSTAGRAM' | 'REDDIT'
const TABS: Tab[] = ['TRENDING', 'TWITTER', 'TIKTOK', 'INSTAGRAM', 'REDDIT']

/* ─── Shared row ──────────────────────────────────────────────── */
function TrendRow({
  rank, label, meta, sub,
}: { rank?: number; label: string; meta?: string; sub?: string[] }) {
  return (
    <div className="py-2 border-b border-white/5">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-3 min-w-0">
          {rank != null && (
            <span className="font-mono text-xs text-[var(--muted)] w-5 shrink-0">{rank}</span>
          )}
          <span className="font-mono text-sm text-[var(--fg)] truncate">{label}</span>
        </div>
        {meta && (
          <span className="font-mono text-xs text-[var(--muted-mid)] shrink-0 ml-3">{meta}</span>
        )}
      </div>
      {sub && sub.length > 0 && (
        <div className="mt-1 pl-8 space-y-0.5">
          {sub.map((s, i) => (
            <p key={i} className="font-mono text-xs text-[var(--muted-mid)] leading-snug line-clamp-1">
              {s}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Google Trends panel ────────────────────────────────────── */
function GoogleTrendsPanel() {
  const [region, setRegion] = useState<'AU' | 'US'>('AU')
  const [data, setData] = useState<TrendsData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback((r: 'AU' | 'US') => {
    setLoading(true)
    fetch(`/api/trends?region=${r}`)
      .then(res => res.json())
      .then((d: TrendsData) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { load(region) }, [region, load])

  return (
    <div>
      {/* AU / US toggle */}
      <div className="flex gap-4 mb-3">
        {(['AU', 'US'] as const).map(r => (
          <button
            key={r}
            onClick={() => setRegion(r)}
            className={[
              'font-mono text-xs tracking-widest uppercase transition-colors duration-100',
              region === r
                ? 'text-[var(--fg)] border-b border-[var(--crimson)]'
                : 'text-[var(--muted)] hover:text-[var(--muted-mid)]',
            ].join(' ')}
          >
            {r}
          </button>
        ))}
      </div>

      {loading && <p className="font-mono text-sm text-[var(--muted)] py-5">Loading…</p>}
      {!loading && (!data || data.trends.length === 0) && (
        <p className="font-mono text-sm text-[var(--muted)] py-5">No trends available</p>
      )}
      {!loading && data && data.trends.map((t, i) => (
        <TrendRow
          key={t.title}
          rank={i + 1}
          label={t.title}
          meta={t.traffic || undefined}
          sub={t.articles.length > 0 ? t.articles : undefined}
        />
      ))}
    </div>
  )
}

/* ─── Twitter panel ──────────────────────────────────────────── */
function TwitterPanel({ trends }: { trends: TwitterTrend[] }) {
  if (trends.length === 0)
    return <p className="font-mono text-sm text-[var(--muted)] py-5">No data — scraper updates every 30min</p>
  return (
    <div>
      {trends.map(t => (
        <TrendRow key={t.rank} rank={t.rank} label={t.topic} meta={t.volume || undefined} />
      ))}
    </div>
  )
}

/* ─── TikTok panel ───────────────────────────────────────────── */
function TikTokPanel({ trends }: { trends: TikTokTrend[] }) {
  if (trends.length === 0)
    return <p className="font-mono text-sm text-[var(--muted)] py-5">No data — scraper updates every 30min</p>
  return (
    <div>
      {trends.map(t => (
        <TrendRow key={t.rank} rank={t.rank} label={t.tag} meta={t.views || undefined} />
      ))}
    </div>
  )
}

/* ─── Instagram panel ────────────────────────────────────────── */
function InstaPanel({ trends }: { trends: InstaTrend[] }) {
  if (trends.length === 0)
    return <p className="font-mono text-sm text-[var(--muted)] py-5">No data — scraper updates every 30min</p>
  return (
    <div>
      {trends.map(t => (
        <TrendRow key={t.rank} rank={t.rank} label={t.tag} />
      ))}
    </div>
  )
}

/* ─── Main component ─────────────────────────────────────────── */
export function SocialTrends() {
  const [active, setActive]   = useState<Tab>('TRENDING')
  const [social, setSocial]   = useState<SocialData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    function fetchSocial() {
      fetch('/api/social')
        .then(r => r.json())
        .then((d: SocialData) => { setSocial(d); setLoading(false) })
        .catch(() => setLoading(false))
    }
    fetchSocial()
    const id = setInterval(fetchSocial, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div>
      <p className="font-mono text-xs tracking-[0.18em] uppercase text-[var(--muted)] mb-3">
        02 / SOCIAL TRENDS
      </p>

      {/* Tab bar */}
      <div className="flex border-b border-white/[0.08] mb-4 gap-1">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={[
              'font-mono text-xs tracking-widest uppercase px-3 py-1.5 -mb-px transition-colors duration-100',
              active === tab
                ? 'text-[var(--fg)] border-b border-[var(--crimson)]'
                : 'text-[var(--muted)] hover:text-[var(--muted-mid)]',
            ].join(' ')}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          {active === 'TRENDING'  && <GoogleTrendsPanel />}
          {active === 'TWITTER'   && (loading
            ? <p className="font-mono text-sm text-[var(--muted)] py-5">Loading…</p>
            : <TwitterPanel  trends={social?.twitter?.trends ?? []} />)}
          {active === 'TIKTOK'    && (loading
            ? <p className="font-mono text-sm text-[var(--muted)] py-5">Loading…</p>
            : <TikTokPanel   trends={social?.tiktok?.trends ?? []} />)}
          {active === 'INSTAGRAM' && (loading
            ? <p className="font-mono text-sm text-[var(--muted)] py-5">Loading…</p>
            : <InstaPanel    trends={social?.instagram?.trends ?? []} />)}
          {active === 'REDDIT'    && <RedditPanel />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
