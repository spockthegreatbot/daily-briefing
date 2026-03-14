export const revalidate = 300

const CRYPTO_SUBS = ['CryptoCurrency', 'SatoshiStreetBets', 'memecoins', 'solana']

type RSSPost = {
  title: string
  subreddit: string
  score: number
  comments: number
  url: string
  created_utc: number
}

function extractFromHTML(html: string): { score: number; comments: number } {
  // RSS doesn't include score/comments directly — we default to 0
  // and sort by recency instead
  return { score: 0, comments: 0 }
}

function parseAtomFeed(xml: string, subreddit: string): RSSPost[] {
  const posts: RSSPost[] = []
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
  let match

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1]

    const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/)
    const linkMatch = entry.match(/<link\s+href="([^"]+)"/)
    const updatedMatch = entry.match(/<published>([\s\S]*?)<\/published>/)

    if (!titleMatch) continue

    const title = titleMatch[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .trim()

    const url = linkMatch?.[1] ?? ''
    const published = updatedMatch?.[1] ?? ''
    const created_utc = published ? Math.floor(new Date(published).getTime() / 1000) : 0

    posts.push({
      title,
      subreddit,
      score: 0,
      comments: 0,
      url,
      created_utc,
    })
  }

  return posts
}

export async function GET() {
  try {
    const results = await Promise.all(
      CRYPTO_SUBS.map(async (sub) => {
        try {
          // Use RSS feed — JSON API returns 403
          const res = await fetch(
            `https://www.reddit.com/r/${sub}/hot.rss`,
            {
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; DailyBriefing/1.0)',
                'Accept': 'application/atom+xml,application/xml,text/xml',
              },
              next: { revalidate: 300 },
            }
          )

          if (!res.ok) return []

          const xml = await res.text()
          return parseAtomFeed(xml, sub)
        } catch {
          return []
        }
      })
    )

    const posts = results.flat()
    // Sort by recency since RSS doesn't give us scores
    posts.sort((a, b) => b.created_utc - a.created_utc)

    return Response.json({ posts: posts.slice(0, 50) })
  } catch {
    return Response.json({ posts: [] })
  }
}
