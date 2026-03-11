'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RedditPanel } from './RedditPanel'
import { ConnectPanel } from './ConnectPanel'

type Tab = 'REDDIT' | 'TWITTER' | 'TIKTOK' | 'INSTAGRAM'
const TABS: Tab[] = ['REDDIT', 'TWITTER', 'TIKTOK', 'INSTAGRAM']

export function SocialTrends() {
  const [active, setActive] = useState<Tab>('REDDIT')

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
          gap: 0,
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
          {active === 'TWITTER' && (
            <ConnectPanel
              sectionNum="02"
              title="TWITTER / X TRENDING"
              envKey="TWITTER_BEARER_TOKEN"
              note="When connected: trending topics, volume, trend direction"
            />
          )}
          {active === 'TIKTOK' && (
            <ConnectPanel
              sectionNum="02"
              title="TIKTOK TRENDING"
              envKey="TIKTOK_API_KEY"
              note="TikTok Research API — apply at developers.tiktok.com"
            />
          )}
          {active === 'INSTAGRAM' && (
            <ConnectPanel
              sectionNum="02"
              title="INSTAGRAM TRENDING"
              envKey="INSTAGRAM_ACCESS_TOKEN"
              note="Meta Graph API — basic display or business account needed"
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
