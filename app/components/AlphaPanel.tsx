'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type DexToken = {
  url: string
  chainId: string
  tokenAddress: string
  icon?: string
  description?: string
  boosted?: boolean
  amount?: number
  totalAmount?: number
  pairCreatedAt?: number
}

type RedditPost = {
  title: string
  subreddit: string
  score: number
  comments: number
  url: string
  created_utc: number
}

type ChanThread = {
  id: number
  title: string
  replies: number
  images: number
  url: string
  time?: number
}

type GeckoPool = {
  id: string
  attributes: {
    name: string
    reserve_in_usd?: string | null
    pool_created_at?: string | null
  }
  relationships?: {
    dex?: { data?: { id?: string } }
  }
}

type Correlation = { term: string; sources: string[] }

type Tab = 'TRENDING' | 'REDDIT' | '4CHAN' | 'POOLS'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts: number): string {
  const diff = (Date.now() - (ts < 1e12 ? ts * 1000 : ts)) / 1000
  if (diff < 60)    return `${Math.floor(diff)}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function fmtUsd(s: string | undefined | null): string {
  if (!s) return '—'
  const n = parseFloat(s)
  if (isNaN(n)) return '—'
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

function chainLabel(chain: string): string {
  const map: Record<string, string> = {
    solana: 'SOL', sol: 'SOL', base: 'BASE', eth: 'ETH', ethereum: 'ETH',
    bsc: 'BSC', polygon: 'POLY', arbitrum: 'ARB', avalanche: 'AVAX',
  }
  return map[chain?.toLowerCase()] ?? chain?.toUpperCase().slice(0, 4) ?? '?'
}

const IGNORE_WORDS = new Set([
  'coin','the','and','for','with','token','new','this','that','will',
  'from','have','been','were','just','like','more','your','they','when',
  'crypto','market','price','bitcoin','ethereum','about','what','some',
])

function extractWords(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !IGNORE_WORDS.has(w))
}

// ─── Shared UI primitives ─────────────────────────────────────────────────────

const rowBase: React.CSSProperties = {
  display: 'block',
  padding: '8px 10px',
  borderBottom: '1px solid var(--border)',
  cursor: 'pointer',
  transition: 'background 0.1s',
  background: 'transparent',
}

const tsStyle: React.CSSProperties = {
  fontFamily: "ui-monospace,'SF Mono',monospace",
  fontSize: 9,
  color: 'var(--muted)',
  whiteSpace: 'nowrap',
  flexShrink: 0,
}

function RowDiv({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <div
      style={rowBase}
      onClick={() => window.open(href, '_blank', 'noopener,noreferrer')}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(240,237,232,0.03)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
    >
      {children}
    </div>
  )
}

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

function QuickLinks({ name, symbol }: { name: string; symbol: string }) {
  return (
    <span style={{ display: 'inline-flex', gap: 3, flexShrink: 0 }}>
      <a
        href={`https://twitter.com/search?q=${encodeURIComponent(name)}&f=live`}
        target="_blank" rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        style={{ fontSize: 10, textDecoration: 'none', lineHeight: 1 }}
      >🔍</a>
      <a
        href={`https://dexscreener.com/search?q=${encodeURIComponent(symbol)}`}
        target="_blank" rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        style={{ fontSize: 10, textDecoration: 'none', lineHeight: 1 }}
      >📈</a>
    </span>
  )
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

// ─── TRENDING tab (DexScreener boosted) ───────────────────────────────────────

function TrendingTab() {
  const [tokens, setTokens] = useState<DexToken[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dex')
      .then(r => r.ok ? r.json() : { boosts: [], profiles: [] })
      .then(data => {
        // Show boosted first, then profiles — all sorted by boost amount desc
        const boosted: DexToken[] = (data.boosts ?? []).slice(0, 40)
        setTokens(boosted)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (tokens.length === 0) return <Empty text="No DexScreener trending data" />

  return (
    <div>
      {tokens.map((t, i) => {
        const displayName = t.description?.split(' ')[0] ?? t.tokenAddress.slice(0, 8)
        return (
          <RowDiv key={`${t.chainId}-${t.tokenAddress}-${i}`} href={t.url}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Badge label={chainLabel(t.chainId)} color="var(--muted-mid)" />
                {t.boosted && <Badge label="BOOSTED" color="var(--gold)" />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {t.totalAmount != null && (
                  <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 9, color: 'var(--gold)', opacity: 0.85 }}>
                    {(t.totalAmount ?? 0).toFixed(0)} pts
                  </span>
                )}
                {t.pairCreatedAt != null && <span style={tsStyle}>{timeAgo(t.pairCreatedAt)}</span>}
                <QuickLinks name={displayName} symbol={displayName} />
              </div>
            </div>
            <span style={{
              fontSize: 11, color: 'var(--muted-mid)',
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
            }}>
              {t.description ?? t.tokenAddress.slice(0, 20) + '…'}
            </span>
          </RowDiv>
        )
      })}
    </div>
  )
}

// ─── CRYPTO REDDIT tab ────────────────────────────────────────────────────────

const CRYPTO_SUBS = ['CryptoCurrency', 'SatoshiStreetBets', 'memecoins', 'solana']

function RedditTab() {
  const [posts, setPosts] = useState<RedditPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Use server-side proxy to avoid CORS/bot blocks
    fetch('/api/reddit')
      .then(r => r.ok ? r.json() : null)
      .then((data: { posts?: RedditPost[] } | null) => {
        if (data?.posts && Array.isArray(data.posts)) {
          setPosts(data.posts.slice(0, 40))
          setLoading(false)
          return
        }
        // Fallback: client-side direct (may hit CORS on some networks)
        return Promise.all(
          CRYPTO_SUBS.map(sub =>
            fetch(`https://www.reddit.com/r/${sub}.json?limit=10&t=day`)
              .then(r => r.ok ? r.json() : null)
              .then(d => {
                if (!d?.data?.children) return []
                return d.data.children.map((c: { data: Record<string, unknown> }) => ({
                  title: c.data.title as string,
                  subreddit: sub,
                  score: (c.data.score as number) ?? 0,
                  comments: (c.data.num_comments as number) ?? 0,
                  url: `https://reddit.com${c.data.permalink as string}`,
                  created_utc: (c.data.created_utc as number) ?? 0,
                }))
              })
              .catch(() => [] as RedditPost[])
          )
        ).then(results => {
          const all = (results as RedditPost[][]).flat()
          all.sort((a, b) => b.score - a.score)
          setPosts(all.slice(0, 40))
          setLoading(false)
        })
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (posts.length === 0) return <Empty text="No Reddit data" />

  return (
    <div>
      {posts.map((p, i) => (
        <RowDiv key={`reddit-${i}`} href={p.url}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, alignItems: 'center' }}>
            <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 9, color: 'var(--accent)', letterSpacing: '0.1em' }}>
              r/{p.subreddit}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 9, color: 'var(--muted)' }}>
                ↑{p.score >= 1000 ? `${(p.score / 1000).toFixed(1)}k` : p.score} · {p.comments}c
              </span>
              {p.created_utc > 0 && <span style={tsStyle}>{timeAgo(p.created_utc)}</span>}
              <QuickLinks name={p.title.slice(0, 40)} symbol={p.subreddit} />
            </div>
          </div>
          <p style={{
            fontSize: 11, color: 'var(--fg)', margin: 0, lineHeight: 1.4,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
          }}>
            {p.title}
          </p>
        </RowDiv>
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
        <RowDiv key={`chan-${t.id}`} href={t.url}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, alignItems: 'center' }}>
            <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 9, color: 'var(--muted)', letterSpacing: '0.1em' }}>
              /BIZ/ #{i + 1}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 9, color: 'var(--muted)' }}>
                {t.replies}↩ · {t.images}🖼
              </span>
              {t.time != null && t.time > 0 && <span style={tsStyle}>{timeAgo(t.time)}</span>}
              <QuickLinks
                name={t.title.slice(0, 40)}
                symbol={t.title.split(/\s+/)[0]?.slice(0, 8) ?? 'BIZ'}
              />
            </div>
          </div>
          <p style={{
            fontSize: 11, color: 'var(--fg)', margin: 0, lineHeight: 1.4,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
          }}>
            {t.title}
          </p>
        </RowDiv>
      ))}
    </div>
  )
}

// ─── POOLS tab (GeckoTerminal) ────────────────────────────────────────────────

function PoolChainSection({ pools, network }: { pools: GeckoPool[]; network: string }) {
  if (pools.length === 0) return <Empty text={`No ${network} pools`} />
  return (
    <div>
      <div style={{
        fontFamily: "ui-monospace,'SF Mono',monospace",
        fontSize: 9,
        color: 'var(--muted)',
        letterSpacing: '0.14em',
        padding: '5px 10px 4px',
        borderBottom: '1px solid var(--border)',
        textTransform: 'uppercase' as const,
        background: 'rgba(240,237,232,0.02)',
      }}>
        ◈ {network}
      </div>
      {pools.map(pool => {
        const underscore = pool.id.indexOf('_')
        const addr = underscore >= 0 ? pool.id.slice(underscore + 1) : pool.id
        const dexName = pool.relationships?.dex?.data?.id ?? '—'
        const reserve = fmtUsd(pool.attributes.reserve_in_usd)
        const created = pool.attributes.pool_created_at
        const poolUrl = `https://www.geckoterminal.com/${network.toLowerCase()}/pools/${addr}`
        const createdTs = created ? new Date(created).getTime() : 0

        return (
          <RowDiv key={pool.id} href={poolUrl}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{
                fontFamily: "ui-monospace,'SF Mono',monospace",
                fontSize: 12, fontWeight: 700, color: 'var(--fg)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150,
              }}>
                {pool.attributes.name}
              </span>
              {createdTs > 0 && <span style={tsStyle}>{timeAgo(createdTs)}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: 'var(--muted-mid)' }}>
                {dexName}
              </span>
              <span style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 10, color: 'var(--muted)' }}>
                LIQ {reserve}
              </span>
            </div>
          </RowDiv>
        )
      })}
    </div>
  )
}

function PoolsTab() {
  const [solPools, setSolPools]   = useState<GeckoPool[]>([])
  const [basePools, setBasePools] = useState<GeckoPool[]>([])
  const [loading, setLoading]     = useState(true)
  const [unavail, setUnavail]     = useState(false)

  const fetchPools = useCallback(() => {
    Promise.all([
      fetch('https://api.geckoterminal.com/api/v2/networks/solana/new_pools?page=1', { headers: { Accept: 'application/json' } })
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('https://api.geckoterminal.com/api/v2/networks/base/new_pools?page=1', { headers: { Accept: 'application/json' } })
        .then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([sol, base]) => {
      if (!sol && !base) { setUnavail(true); setLoading(false); return }
      setSolPools(sol?.data?.slice(0, 15) ?? [])
      setBasePools(base?.data?.slice(0, 10) ?? [])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    fetchPools()
    const id = setInterval(fetchPools, 60000)
    return () => clearInterval(id)
  }, [fetchPools])

  if (loading) return <Spinner />
  if (unavail)  return <Empty text="UNAVAILABLE — GeckoTerminal unreachable" />

  return (
    <div>
      <PoolChainSection pools={solPools} network="SOLANA" />
      <PoolChainSection pools={basePools} network="BASE" />
    </div>
  )
}

// ─── Correlation Banner ────────────────────────────────────────────────────────
// Cross-references: if same term appears in Reddit crypto + Twitter/HN → signal

function CorrelationBanner({ correlations }: { correlations: Correlation[] }) {
  if (correlations.length === 0) return null
  return (
    <div style={{
      backgroundColor: 'var(--accent)',
      color: '#fff',
      fontFamily: "ui-monospace,'SF Mono',monospace",
      fontSize: 10,
      padding: '5px 10px',
      letterSpacing: '0.08em',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 4,
    }}>
      {correlations.slice(0, 5).map(c => (
        <div key={c.term} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
            🚨 &ldquo;{c.term.toUpperCase()}&rdquo; trending in {c.sources.join(' + ')}
          </span>
          <a
            href={`https://twitter.com/search?q=${encodeURIComponent(c.term)}&f=live`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ color: '#fff', textDecoration: 'underline', fontSize: 9, whiteSpace: 'nowrap' as const, flexShrink: 0 }}
          >
            [search →]
          </a>
        </div>
      ))}
    </div>
  )
}

// ─── AlphaPanel ───────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string }[] = [
  { key: 'TRENDING', label: 'TRENDING' },
  { key: 'REDDIT',   label: 'REDDIT'   },
  { key: '4CHAN',    label: '4CHAN'     },
  { key: 'POOLS',    label: 'POOLS'    },
]

export function AlphaPanel() {
  const [tab, setTab] = useState<Tab>('TRENDING')

  // Correlation: cross-ref Reddit crypto vs Twitter/HN
  const [redditTitles, setRedditTitles] = useState<string[]>([])
  const [hnTitles,     setHnTitles]     = useState<string[]>([])
  const [socialTerms,  setSocialTerms]  = useState<string[]>([])

  useEffect(() => {
    // Reddit titles
    fetch('/api/reddit')
      .then(r => r.ok ? r.json() : null)
      .then((data: { posts?: { title: string }[] } | null) => {
        if (data?.posts) setRedditTitles(data.posts.map(p => p.title))
      })
      .catch(() => {})

    // HN trends
    fetch('/api/trends')
      .then(r => r.ok ? r.json() : [])
      .then((data: { title?: string }[]) => {
        if (Array.isArray(data)) setHnTitles(data.map(h => h.title ?? ''))
      })
      .catch(() => {})

    // Twitter trends
    fetch('/api/social')
      .then(r => r.ok ? r.json() : {})
      .then((data: { twitter?: { trends?: Array<{ name?: string; topic?: string }> } }) => {
        const trends = data.twitter?.trends ?? []
        setSocialTerms(trends.map(t => t.name ?? t.topic ?? ''))
      })
      .catch(() => {})
  }, [])

  // Term appears in Reddit AND (HN or Twitter) → correlation
  const correlations = useMemo<Correlation[]>(() => {
    if (redditTitles.length === 0) return []

    const redditWords = new Set(redditTitles.flatMap(extractWords))
    const hnWords     = new Set(hnTitles.flatMap(extractWords))
    const socialWords = new Set(socialTerms.flatMap(extractWords))

    const found: Correlation[] = []
    const seen  = new Set<string>()

    for (const word of redditWords) {
      if (seen.has(word)) continue
      const sources: string[] = ['REDDIT']
      if (hnWords.has(word))     sources.push('VIRAL')
      if (socialWords.has(word)) sources.push('TWITTER')
      if (sources.length >= 2) {
        found.push({ term: word, sources })
        seen.add(word)
      }
    }

    return found.slice(0, 10)
  }, [redditTitles, hnTitles, socialTerms])

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

      {/* Correlation banner */}
      <CorrelationBanner correlations={correlations} />

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

      {/* Tab content */}
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderTop: 'none',
        maxHeight: 720,
        overflowY: 'auto' as const,
      }}>
        {tab === 'TRENDING' && <TrendingTab />}
        {tab === 'REDDIT'   && <RedditTab />}
        {tab === '4CHAN'    && <FourChanTab />}
        {tab === 'POOLS'    && <PoolsTab />}
      </div>
    </div>
  )
}
