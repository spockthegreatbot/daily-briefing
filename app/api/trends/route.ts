export const revalidate = 300

// Google Trends daily trending searches — AU + US RSS (free, no key)
async function fetchGoogleTrends(geo: string) {
  const res = await fetch(
    `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geo}`,
    { next: { revalidate: 300 } }
  )
  if (!res.ok) return []
  const xml = await res.text()

  const items: { title: string; traffic: string; articles: string[]; geo: string }[] = []

  // Parse RSS items
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)
  for (const match of itemMatches) {
    const block = match[1]
    const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
      ?? block.match(/<title>(.*?)<\/title>/)?.[1] ?? ''
    const traffic = block.match(/<ht:approx_traffic>(.*?)<\/ht:approx_traffic>/)?.[1] ?? ''
    const newsMatches = [...block.matchAll(/<ht:news_item_title><!\[CDATA\[(.*?)\]\]><\/ht:news_item_title>/g)]
    const articles = newsMatches.map(m => m[1]).slice(0, 2)

    if (title) items.push({ title, traffic, articles, geo })
    if (items.length >= 12) break
  }

  return items
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const region = searchParams.get('region') ?? 'AU'

  try {
    const trends = await fetchGoogleTrends(region)
    return Response.json({ trends, region, fetched_at: new Date().toISOString() })
  } catch {
    return Response.json({ trends: [], region, error: 'fetch failed' })
  }
}
