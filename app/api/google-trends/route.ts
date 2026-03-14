export const revalidate = 600

type GoogleTrend = {
  title: string
  traffic: string
  category: string | null
  newsHeadline: string | null
  newsSource: string | null
  pubDate: string | null
}

const CRYPTO_KEYWORDS = /\b(crypto|bitcoin|btc|eth|ethereum|solana|sol|memecoin|shib|doge|nft|defi|web3|blockchain|altcoin|coinbase|binance|tether)\b/i
const MARKET_KEYWORDS = /\b(stock|market|nasdaq|s&p|dow|trading|invest|finance|forex|gold|silver|oil|inflation|recession|tariff|economy|fed|interest rate|gdp|ipo|etf)\b/i
const NEWS_KEYWORDS = /\b(war|attack|crisis|election|trump|biden|government|protest|scandal|lawsuit|regulation|ban|sanction)\b/i
const MEME_KEYWORDS = /\b(meme|viral|trend|tiktok|celebrity|kardashian|movie|show|game|sport)\b/i

function detectCategory(title: string): string | null {
  if (CRYPTO_KEYWORDS.test(title)) return 'crypto'
  if (MARKET_KEYWORDS.test(title)) return 'market'
  if (NEWS_KEYWORDS.test(title)) return 'news'
  if (MEME_KEYWORDS.test(title)) return 'meme'
  return null
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .trim()
}

function parseRSS(xml: string): GoogleTrend[] {
  const trends: GoogleTrend[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1]

    const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/)
    const trafficMatch = item.match(/<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/)
    const pubDateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)
    const newsTitle = item.match(/<ht:news_item_title>([\s\S]*?)<\/ht:news_item_title>/)
    const newsSource = item.match(/<ht:news_item_source>([\s\S]*?)<\/ht:news_item_source>/)

    if (!titleMatch) continue

    const title = decodeEntities(titleMatch[1])
    const traffic = trafficMatch ? decodeEntities(trafficMatch[1]) : ''
    const pubDate = pubDateMatch ? decodeEntities(pubDateMatch[1]) : null

    trends.push({
      title,
      traffic,
      category: detectCategory(title + (newsTitle?.[1] ?? '')),
      newsHeadline: newsTitle ? decodeEntities(newsTitle[1]) : null,
      newsSource: newsSource ? decodeEntities(newsSource[1]) : null,
      pubDate,
    })
  }

  return trends
}

export async function GET() {
  try {
    const res = await fetch('https://trends.google.com/trending/rss?geo=US', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DailyBriefing/1.0)',
        'Accept': 'application/rss+xml,application/xml,text/xml',
      },
      next: { revalidate: 600 },
    })

    if (!res.ok) {
      return Response.json({
        trends: [],
        source: 'google-trends',
        generated: new Date().toISOString(),
      })
    }

    const xml = await res.text()
    const trends = parseRSS(xml).slice(0, 15)

    return Response.json({
      trends,
      source: 'google-trends',
      generated: new Date().toISOString(),
    })
  } catch {
    return Response.json({
      trends: [],
      source: 'google-trends',
      generated: new Date().toISOString(),
    })
  }
}
