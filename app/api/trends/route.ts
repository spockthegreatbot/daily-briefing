export const revalidate = 300

type TrendItem = {
  title:    string
  traffic:  string
  trafficN: number
  articles: string[]
  source:   'google'
}

function parseTraffic(s: string): number {
  if (!s) return 0
  const clean = s.replace(/[^0-9.KMB]/gi, '')
  const num = parseFloat(clean)
  if (s.includes('M') || s.includes('B')) return num * 1_000_000
  if (s.includes('K')) return num * 1_000
  return num || 0
}

async function fetchGoogleTrends(geo: string): Promise<TrendItem[]> {
  try {
    const res = await fetch(
      `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geo}`,
      { next: { revalidate: 300 } }
    )
    if (!res.ok) return []
    const xml = await res.text()
    const items: TrendItem[] = []

    for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
      const block = match[1]
      const title = (
        block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ??
        block.match(/<title>(.*?)<\/title>/)?.[1] ?? ''
      ).trim()
      const traffic = block.match(/<ht:approx_traffic>(.*?)<\/ht:approx_traffic>/)?.[1]?.trim() ?? ''
      const newsMatches = [...block.matchAll(/<ht:news_item_title><!\[CDATA\[(.*?)\]\]><\/ht:news_item_title>/g)]
      const articles = newsMatches.map(m => m[1]).slice(0, 2)

      if (title) items.push({ title, traffic, trafficN: parseTraffic(traffic), articles, source: 'google' })
      if (items.length >= 20) break
    }
    return items
  } catch {
    return []
  }
}

export async function GET() {
  // Fetch AU + US in parallel, merge, deduplicate, sort by traffic
  const [au, us] = await Promise.all([fetchGoogleTrends('AU'), fetchGoogleTrends('US')])

  const seen = new Set<string>()
  const merged: TrendItem[] = []

  for (const item of [...au, ...us]) {
    const key = item.title.toLowerCase().replace(/\s+/g, '')
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(item)
    }
  }

  // Sort by traffic descending — highest viral volume first
  merged.sort((a, b) => b.trafficN - a.trafficN)

  return Response.json({ trends: merged.slice(0, 20), fetched_at: new Date().toISOString() })
}
