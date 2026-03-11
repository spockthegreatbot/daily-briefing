'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RedditPanel } from './RedditPanel'

type TwitterTrend = { rank: number; topic: string; volume?: string }
type TikTokTrend = { rank: number; tag: string; views?: string }
type InstagramTrend = { rank: number; tag: string }

type SocialData = {
  twitter: { trends: TwitterTrend[] }
  tiktok: { trends: TikTokTrend[] }
  instagram: { trends: InstagramTrend[] }
}

type Tab = 'REDDIT' | 'TWITTER' | 'TIKTOK' | 'INSTAGRAM'
const TABS: Tab[] = ['REDDIT', 'TWITTER', 'TIKTOK', 'INSTAGRAM']

function TrendRow({ rank, label, meta }: { rank: number; label: string; meta?: string }) {
  return (
    <div className="flex items-baseline justify-between py-2 border-b border-white/5">
      <div className="flex items-baseline gap-3">
        <span
          style={{ fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 11 }}
          className="text-[#403830] w-5 shrink-0"
        >
          {rank}
        </span>
        <span
          style={{ fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 15 }}
          className="text-[#F0EDE8]"
        >
          {label}
        </span>
      </div>
      {meta && (
        <span
          style={{ fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 11 }}
          className="text-[#605850] shrink-0 ml-3"
        >
          {meta}
        </span>
      )}
    </div>
  )
}

function TwitterList({ trends }: { trends: TwitterTrend[] }) {
  if (trends.length === 0) return <p style={{ fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 15 }} className="text-[#403830] py-5">No trends available</p>
  return (
    <div>
      {trends.map((t) => (
        <TrendRow key={t.rank} rank={t.rank} label={t.topic} meta={t.volume || undefined} />
      ))}
    </div>
  )
}

function TikTokList({ trends }: { trends: TikTokTrend[] }) {
  if (trends.length === 0) return <p style={{ fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 15 }} className="text-[#403830] py-5">No trends available</p>
  return (
    <div>
      {trends.map((t) => (
        <TrendRow key={t.rank} rank={t.rank} label={t.tag} meta={t.views || undefined} />
      ))}
    </div>
  )
}

function InstagramList({ trends }: { trends: InstagramTrend[] }) {
  if (trends.length === 0) return <p style={{ fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 15 }} className="text-[#403830] py-5">No trends available</p>
  return (
    <div>
      {trends.map((t) => (
        <TrendRow key={t.rank} rank={t.rank} label={t.tag} />
      ))}
    </div>
  )
}

export function SocialTrends() {
  const [active, setActive] = useState<Tab>('REDDIT')
  const [data, setData] = useState<SocialData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    function fetchData() {
      fetch('/api/social')
        .then((r) => r.json())
        .then((d: SocialData) => {
          setData(d)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
    fetchData()
    const id = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

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
        02 / SOCIAL TRENDS
      </p>

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid rgba(240,237,232,0.08)',
          marginBottom: 16,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            style={{
              fontFamily: "ui-monospace, 'SF Mono', monospace",
              fontSize: 15,
              color: active === tab ? '#F0EDE8' : '#605850',
              background: 'none',
              border: 'none',
              borderBottom: active === tab ? '1px solid #C8102E' : '1px solid transparent',
              padding: '6px 14px',
              cursor: 'pointer',
              letterSpacing: '0.1em',
              transition: 'color 0.12s',
              marginBottom: -1,
            }}
            onMouseEnter={(e) => {
              if (active !== tab) (e.currentTarget as HTMLButtonElement).style.color = '#A09890'
            }}
            onMouseLeave={(e) => {
              if (active !== tab) (e.currentTarget as HTMLButtonElement).style.color = '#605850'
            }}
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
          transition={{ duration: 0.15 }}
        >
          {active === 'REDDIT' && <RedditPanel />}
          {active !== 'REDDIT' && loading && (
            <p style={{ fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: 15 }} className="text-[#403830] py-5">
              Loading...
            </p>
          )}
          {active === 'TWITTER' && !loading && (
            <TwitterList trends={data?.twitter?.trends ?? []} />
          )}
          {active === 'TIKTOK' && !loading && (
            <TikTokList trends={data?.tiktok?.trends ?? []} />
          )}
          {active === 'INSTAGRAM' && !loading && (
            <InstagramList trends={data?.instagram?.trends ?? []} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
