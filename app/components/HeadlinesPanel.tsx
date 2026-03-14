'use client'

import { useEffect, useState } from 'react'

type Article = {
  id: string
  webTitle?: string
  webUrl: string
  webPublicationDate: string
  fields?: {
    headline?: string
    trailText?: string
  }
  sectionName?: string
  _source?: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function classifyTag(headline: string): { label: string; color: string } {
  const h = headline.toLowerCase()
  if (/\b(stock|market|nasdaq|s&p|dow|rally|crash|fed|interest rate|inflation|gdp|recession|tariff|trade war|sanctions|oil|gold|commodit)/i.test(h))
    return { label: '📈 Market impact', color: '#22c55e' }
  if (/\b(war|attack|crisis|collapse|hack|breach|fraud|bankrupt|default|regulat|ban|lawsuit|indictment|investigation|threat)/i.test(h))
    return { label: '⚠️ Risk signal', color: '#ef4444' }
  if (/\b(launch|ipo|partner|acqui|merger|breakthrough|innovat|approval|bullish|surge|soar|listing|funding|invest)/i.test(h))
    return { label: '💡 Opportunity', color: '#E8C96E' }
  return { label: '📊 Data point', color: '#6b7280' }
}

const MAX_ITEMS = 8

export function HeadlinesPanel() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch both sources and merge/dedup
    Promise.all([
      fetch('/api/news?page=1&source=guardian')
        .then(r => r.ok ? r.json() : [])
        .then((data: Article[]) =>
          (Array.isArray(data) ? data : []).map(a => ({ ...a, _source: 'GUARDIAN' }))
        )
        .catch(() => []),
      fetch('/api/news?page=1&source=newsapi')
        .then(r => r.ok ? r.json() : [])
        .then((data: Article[]) =>
          (Array.isArray(data) ? data : []).map(a => ({ ...a, _source: (a.sectionName ?? 'NEWS').toUpperCase() }))
        )
        .catch(() => []),
    ]).then(([guardian, newsapi]) => {
      // Merge and deduplicate by first 40 chars of headline
      const seen = new Set<string>()
      const merged: Article[] = []
      for (const article of [...guardian, ...newsapi]) {
        const h = (article.fields?.headline ?? article.webTitle ?? '').toLowerCase().slice(0, 40)
        if (!h || seen.has(h)) continue
        seen.add(h)
        merged.push(article)
      }
      // Sort by date, newest first
      merged.sort((a, b) =>
        new Date(b.webPublicationDate).getTime() - new Date(a.webPublicationDate).getTime()
      )
      setArticles(merged.slice(0, MAX_ITEMS))
      setLoading(false)
    })
  }, [])

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
        01 / HEADLINES
      </p>

      {loading ? (
        <p style={{ fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: 12, color: 'var(--muted)', padding: '10px 0' }}>
          Loading headlines...
        </p>
      ) : (
        <div>
          {articles.map((article) => {
            const headline = article.fields?.headline ?? article.webTitle ?? ''
            const ago = timeAgo(article.webPublicationDate)
            const tag = classifyTag(headline)
            const sourceLabel = article._source ?? 'NEWS'
            return (
              <a
                key={article.id}
                href={article.webUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  padding: '10px 0',
                  borderBottom: '1px solid rgba(240,237,232,0.06)',
                  textDecoration: 'none',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(240,237,232,0.03)'
                  ;(e.currentTarget as HTMLAnchorElement).style.paddingLeft = '6px'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLAnchorElement).style.paddingLeft = '0'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                  alignItems: 'center',
                }}>
                  <span style={{
                    fontFamily: "ui-monospace,'SF Mono',monospace",
                    fontSize: 10,
                    color: 'var(--muted)',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                  }}>
                    {sourceLabel}
                  </span>
                  <span style={{
                    fontFamily: "ui-monospace,'SF Mono',monospace",
                    fontSize: 10,
                    color: 'var(--muted)',
                  }}>
                    {ago}
                  </span>
                </div>
                <p style={{
                  fontSize: 14,
                  color: '#F0EDE8',
                  lineHeight: 1.4,
                  margin: '0 0 4px',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {headline}
                </p>
                <span style={{
                  fontFamily: "ui-monospace,'SF Mono',monospace",
                  fontSize: 10,
                  color: tag.color,
                }}>
                  {tag.label}
                </span>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
