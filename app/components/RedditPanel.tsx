'use client'

import { useEffect, useState } from 'react'

type RedditPost = {
  title: string
  subreddit: string
  score: number
  comments: number
  url: string
  flair: string | null
}

function fmtScore(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return `${n}`
}

export function RedditPanel() {
  const [posts, setPosts] = useState<RedditPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reddit')
      .then((r) => r.json())
      .then((data) => {
        setPosts(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div
        style={{
          fontFamily: "ui-monospace, 'SF Mono', monospace",
          fontSize: 11,
          color: '#403830',
          padding: '20px 0',
        }}
      >
        Loading posts...
      </div>
    )
  }

  return (
    <div>
      {posts.length === 0 ? (
        <div
          style={{
            fontFamily: "ui-monospace, 'SF Mono', monospace",
            fontSize: 11,
            color: '#403830',
            padding: '20px 0',
          }}
        >
          Could not load Reddit data.
        </div>
      ) : (
        <div>
          {posts.map((post, i) => (
            <a
              key={i}
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                gap: 10,
                padding: '9px 0',
                borderBottom: '1px solid rgba(240,237,232,0.06)',
                textDecoration: 'none',
                transition: 'background 0.12s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = 'rgba(240,237,232,0.03)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = 'transparent')}
            >
              {/* Rank */}
              <span
                style={{
                  fontFamily: "ui-monospace, 'SF Mono', monospace",
                  fontSize: 11,
                  color: '#605850',
                  minWidth: 20,
                  paddingTop: 1,
                }}
              >
                {(i + 1).toString().padStart(2, '0')}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Subreddit */}
                <span
                  style={{
                    fontFamily: "ui-monospace, 'SF Mono', monospace",
                    fontSize: 10,
                    color: '#C8102E',
                    display: 'block',
                    marginBottom: 3,
                  }}
                >
                  r/{post.subreddit}
                </span>

                {/* Title */}
                <p
                  style={{
                    fontSize: 13,
                    color: '#A09890',
                    lineHeight: 1.4,
                    margin: 0,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {post.title}
                </p>

                {/* Score + comments */}
                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    marginTop: 4,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "ui-monospace, 'SF Mono', monospace",
                      fontSize: 10,
                      color: '#D4A017',
                    }}
                  >
                    ▲ {fmtScore(post.score)}
                  </span>
                  <span
                    style={{
                      fontFamily: "ui-monospace, 'SF Mono', monospace",
                      fontSize: 10,
                      color: '#605850',
                    }}
                  >
                    💬 {fmtScore(post.comments)}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
