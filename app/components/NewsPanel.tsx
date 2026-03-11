'use client'

import { useEffect, useState } from 'react'

type Article = {
  id: string
  webTitle: string
  webUrl: string
  webPublicationDate: string
  fields?: {
    headline?: string
    trailText?: string
    byline?: string
    thumbnail?: string
  }
  sectionName?: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function NewsPanel() {
  const [articles, setArticles] = useState<Article[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    fetch('/api/news?page=1')
      .then((r) => r.json())
      .then((data) => {
        setArticles(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function loadMore() {
    setLoadingMore(true)
    const nextPage = page + 1
    try {
      const res = await fetch(`/api/news?page=${nextPage}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setArticles((prev) => [...prev, ...data])
        setPage(nextPage)
      }
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div>
      <p
        style={{
          fontFamily: "ui-monospace, 'SF Mono', monospace",
          fontSize: 10,
          color: '#605850',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        01 / WORLD NEWS
      </p>

      {loading ? (
        <div
          style={{
            fontFamily: "ui-monospace, 'SF Mono', monospace",
            fontSize: 11,
            color: '#403830',
            padding: '20px 0',
          }}
        >
          Loading headlines...
        </div>
      ) : (
        <div>
          {articles.slice(0, 10 * page).map((article, i) => {
            const headline = article.fields?.headline ?? article.webTitle
            const ago = timeAgo(article.webPublicationDate)
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
                  cursor: 'pointer',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(240,237,232,0.03)'
                  ;(e.currentTarget as HTMLAnchorElement).style.paddingLeft = '6px'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLAnchorElement).style.paddingLeft = '0'
                }}
              >
                <div
                  style={{
                    fontFamily: "ui-monospace, 'SF Mono', monospace",
                    fontSize: 9,
                    color: '#605850',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>THE GUARDIAN</span>
                  <span>{ago}</span>
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: '#F0EDE8',
                    lineHeight: 1.4,
                    margin: 0,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {headline}
                </p>
              </a>
            )
          })}

          {articles.length > 0 && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              style={{
                marginTop: 12,
                fontFamily: "ui-monospace, 'SF Mono', monospace",
                fontSize: 10,
                color: '#605850',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                background: 'none',
                border: '1px solid rgba(240,237,232,0.08)',
                padding: '6px 12px',
                cursor: 'pointer',
                transition: 'color 0.12s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#A09890')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#605850')}
            >
              {loadingMore ? 'LOADING...' : '[LOAD MORE]'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
