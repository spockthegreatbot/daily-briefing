'use client'

import { useEffect, useState, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Launch = {
  name: string
  symbol: string
  chain: string
  launchpad: string
  marketCap?: number
  createdAt: number
  url: string
  twitter?: string
  description?: string
}

type DexToken = {
  url: string
  chainId: string
  tokenAddress: string
  icon?: string
  description?: string
  boosted?: boolean
  amount?: number
  totalAmount?: number
}

type RedditPost = {
  title: string
  subreddit: string
  score: number
  comments: number
  url: string
}

type ChanThread = {
  id: number
  title: string
  replies: number
  images: number
  url: string
}

type Tab = 'LAUNCHES' | 'TRENDING' | 'REDDIT' | 'DEX' | '4CHAN'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const diffMs = Date.now() - (ts < 1e12 ? ts * 1000 : ts)
  const mins = Math.floor(diffMs / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

function fmtMcap(n: number | undefined): string {
  if (n == null) return '—'
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`
  return `$${(n ?? 0).toFixed(0)}`
}

function chainLabel(chain: string): string {
  const map: Record<string, string> = {
    solana: 'SOL', sol: 'SOL', base: 'BASE', eth: 'ETH', ethereum: 'ETH',
    bsc: 'BSC', polygon: 'POLY', arbitrum: 'ARB', avalanche: 'AVAX',
  }
  return map[chain?.toLowerCase()] ?? chain?.toUpperCase().slice(0, 4) ?? '?'
}

// ─── Badge ────────────────────────────────────────────────────────────────────

function Badge({ label, color }: { label: string; color?: string }) {
  const c = color ?? 'var(--muted)'
  return (
    <span style={{
      fontFamily: "ui-monospace,'SF Mono',monospace",
      fontSize: 9,
      color: c,
      border: `1px solid ${c}`,
      padding: '1px 4px',
      letterSpacing: '0.12em',
      textTransform: 'uppercase' as const,
      whiteSpace: 'nowrap' as const,
      opacity: 0.85,
    }}>
      {label}
    </span>
  )
}

// ─── LAUNCHES tab ─────────────────────────────────────────────────────────────

function LaunchesTab() {
  const [launches, setLaunches] = useState<Launch[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLaunches = useCallback(() => {
    setLoading(true)
    // Pump.fun — must be client-side (Vercel IPs blocked)
    const pumpUrl = 'https://frontend-api.pump.fun/coins?limit=20&sort=created_timestamp&order=DESC&includeNsfw=true'
    const fallbackUrl = 'https://client-api-2-74b1891ee9f9.herokuapp.com/coins?limit=20&sort=created_timestamp&order=DESC'

    fetch(pumpUrl)
      .then(r => r.ok ? r.json() : Promise.reject('404'))
      .catch(() => fetch(fallbackUrl).then(r => r.ok ? r.json() : []))
      .then((coins: Record<string, unknown>[]) => {
        if (!Array.isArray(coins)) return []
        return coins.map(c => ({
          name: (c.name as string) ?? 'Unknown',
          symbol: (c.symbol as string) ?? '?',
          chain: 'solana',
          launchpad: 'pump.fun',
          marketCap: typeof c.usd_market_cap === 'number' ? c.usd_market_cap : undefined,
          createdAt: typeof c.created_timestamp === 'number' ? c.created_timestamp : Date.now() / 1000,
          url: `https://pump.fun/${c.mint as string ?? ''}`,
          twitter: c.twitter as string | undefined,
          description: c.description as string | undefined,
        })) as Launch[]
      })
      .catch(() => [] as Launch[])
      .then(coins => {
        setLaunches(coins)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    fetchLaunches()
    const id = setInterval(fetchLaunches, 60000)
    return () => clearInterval(id)
  }, [fetchLaunches])

  if (loading) return <Spinner />

  if (launches.length === 0) {
    return <Empty text="No launches — pump.fun unreachable" />
  }

  return (
    <div>
      {launches.map((l, i) => (
        <a
          key={`${l.launchpad}-${l.symbol}-${i}`}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          style={rowStyle}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(240,237,232,0.03)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 12, fontWeight: 700, color: 'var(--fg)' }}>
                {l.symbol}
              </span>
              <Badge label={chainLabel(l.chain)} color="var(--muted-mid)" />
              <Badge label={l.launchpad} color="var(--accent)" />
            </div>
            <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: 'var(--muted)' }}>
              {timeAgo(l.createdAt)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--muted-mid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
              {l.name}
            </span>
            <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: 'var(--muted)' }}>
              {fmtMcap(l.marketCap)}
            </span>
          </div>
        </a>
      ))}
    </div>
  )
}

// ─── TRENDING tab (DexScreener boosted) ───────────────────────────────────────

function TrendingTab() {
  const [tokens, setTokens] = useState<DexToken[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dex')
      .then(r => r.ok ? r.json() : { boosts: [], profiles: [] })
      .then(data => {
        const boosted = (data.boosts ?? []).slice(0, 30)
        const profiles = (data.profiles ?? []).filter((p: DexToken) => !p.boosted).slice(0, 20)
        // Boosted first, then new profiles
        setTokens([...boosted, ...profiles])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (tokens.length === 0) return <Empty text="No DexScreener data" />

  return (
    <div>
      {tokens.map((t, i) => (
        <a
          key={`${t.chainId}-${t.tokenAddress}-${i}`}
          href={t.url}
          target="_blank"
          rel="noopener noreferrer"
          style={rowStyle}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(240,237,232,0.03)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Badge label={chainLabel(t.chainId)} color="var(--muted-mid)" />
              {t.boosted && <Badge label="BOOSTED" color="var(--gold)" />}
            </div>
            {t.totalAmount != null && (
              <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 9, color: 'var(--gold)', opacity: 0.7 }}>
                {(t.totalAmount ?? 0).toFixed(0)} pts
              </span>
            )}
          </div>
          <span style={{
            fontSize: 11, color: 'var(--muted-mid)',
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
          }}>
            {t.description ?? t.tokenAddress.slice(0, 12) + '…'}
          </span>
        </a>
      ))}
    </div>
  )
}

// ─── CRYPTO REDDIT tab ────────────────────────────────────────────────────────

const CRYPTO_SUBS = ['CryptoCurrency', 'SatoshiStreetBets', 'memecoins', 'solana']

function RedditTab() {
  const [posts, setPosts] = useState<RedditPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all(
      CRYPTO_SUBS.map(sub =>
        fetch(`https://www.reddit.com/r/${sub}.json?limit=10&t=day`)
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (!data?.data?.children) return []
            return data.data.children.map((c: { data: Record<string, unknown> }) => ({
              title: c.data.title as string,
              subreddit: sub,
              score: (c.data.score as number) ?? 0,
              comments: (c.data.num_comments as number) ?? 0,
              url: `https://reddit.com${c.data.permalink as string}`,
            }))
          })
          .catch(() => [] as RedditPost[])
      )
    ).then(results => {
      const all: RedditPost[] = results.flat()
      all.sort((a, b) => b.score - a.score)
      setPosts(all.slice(0, 40))
      setLoading(false)
    })
  }, [])

  if (loading) return <Spinner />
  if (posts.length === 0) return <Empty text="No Reddit data" />

  return (
    <div>
      {posts.map((p, i) => (
        <a
          key={`reddit-${i}`}
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          style={rowStyle}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(240,237,232,0.03)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 9, color: 'var(--accent)', letterSpacing: '0.1em' }}>
              r/{p.subreddit}
            </span>
            <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 9, color: 'var(--muted)' }}>
              ↑{p.score >= 1000 ? `${((p.score ?? 0) / 1000).toFixed(1)}k` : p.score} · {p.comments}c
            </span>
          </div>
          <p style={{
            fontSize: 11, color: 'var(--fg)', margin: 0, lineHeight: 1.4,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
          }}>
            {p.title}
          </p>
        </a>
      ))}
    </div>
  )
}

// ─── DEX tab (new pairs) ──────────────────────────────────────────────────────

function DexTab() {
  const [tokens, setTokens] = useState<DexToken[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dex')
      .then(r => r.ok ? r.json() : { profiles: [], boosts: [] })
      .then(data => {
        const profiles = (data.profiles ?? []).slice(0, 50)
        setTokens(profiles)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (tokens.length === 0) return <Empty text="No DEX pairs data" />

  return (
    <div>
      {tokens.map((t, i) => (
        <a
          key={`dex-${t.chainId}-${t.tokenAddress}-${i}`}
          href={t.url}
          target="_blank"
          rel="noopener noreferrer"
          style={rowStyle}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(240,237,232,0.03)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <Badge label={chainLabel(t.chainId)} color="var(--muted-mid)" />
              {t.boosted && <Badge label="BOOSTED" color="var(--gold)" />}
            </div>
            <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 9, color: 'var(--muted)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t.tokenAddress.slice(0, 8)}…
            </span>
          </div>
          {t.description && (
            <p style={{
              fontSize: 11, color: 'var(--muted-mid)', margin: 0, lineHeight: 1.4,
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
            }}>
              {t.description}
            </p>
          )}
        </a>
      ))}
    </div>
  )
}

// ─── 4CHAN tab ─────────────────────────────────────────────────────────────────

function FourChanTab() {
  const [threads, setThreads] = useState<ChanThread[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/fourchan')
      .then(r => r.ok ? r.json() : [])
      .then((data: ChanThread[]) => {
        setThreads(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (threads.length === 0) return <Empty text="No /biz/ threads with >50 replies" />

  return (
    <div>
      {threads.map((t, i) => (
        <a
          key={`chan-${t.id}`}
          href={t.url}
          target="_blank"
          rel="noopener noreferrer"
          style={rowStyle}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(240,237,232,0.03)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em' }}>
              /BIZ/ #{i + 1}
            </span>
            <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 9, color: 'var(--muted)' }}>
              {t.replies}↩ · {t.images}🖼
            </span>
          </div>
          <p style={{
            fontSize: 11, color: 'var(--fg)', margin: 0, lineHeight: 1.4,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
          }}>
            {t.title}
          </p>
        </a>
      ))}
    </div>
  )
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────

const rowStyle: React.CSSProperties = {
  display: 'block',
  padding: '8px 10px',
  borderBottom: '1px solid var(--border)',
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'background 0.1s',
  background: 'transparent',
}

function Spinner() {
  return (
    <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 11, color: 'var(--muted)', padding: '12px 10px' }}>
      LOADING…
    </p>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 11, color: 'var(--muted)', padding: '12px 10px' }}>
      {text}
    </p>
  )
}

// ─── AlphaPanel ───────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string }[] = [
  { key: 'LAUNCHES', label: 'LAUNCHES' },
  { key: 'TRENDING', label: 'TRENDING' },
  { key: 'REDDIT',   label: 'REDDIT'   },
  { key: 'DEX',      label: 'DEX'      },
  { key: '4CHAN',    label: '4CHAN'     },
]

export function AlphaPanel() {
  const [tab, setTab] = useState<Tab>('LAUNCHES')

  return (
    <div>
      {/* Section label */}
      <p style={{
        fontFamily: "ui-monospace,'SF Mono',monospace",
        fontSize: 12,
        color: 'var(--muted)',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        marginBottom: 12,
      }}>
        04 / ALPHA
      </p>

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border)',
        marginBottom: 0,
        overflowX: 'auto' as const,
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
              whiteSpace: 'nowrap' as const,
              transition: 'color 0.1s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content — scrollable panel */}
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderTop: 'none',
        maxHeight: 720,
        overflowY: 'auto' as const,
      }}>
        {tab === 'LAUNCHES' && <LaunchesTab />}
        {tab === 'TRENDING' && <TrendingTab />}
        {tab === 'REDDIT'   && <RedditTab />}
        {tab === 'DEX'      && <DexTab />}
        {tab === '4CHAN'    && <FourChanTab />}
      </div>
    </div>
  )
}
