export const revalidate = 600

type TikTokHashtag = {
  name: string
  views: number
  viewsFormatted: string
  trend: 'up' | 'down' | 'new' | 'stable'
  category: string | null
}

const CRYPTO_KEYWORDS = /\b(crypto|bitcoin|btc|eth|ethereum|solana|sol|memecoin|shib|doge|nft|defi|web3|blockchain|altcoin|token|pump|moon|rug|airdrop)\b/i
const MARKET_KEYWORDS = /\b(stock|market|trading|invest|finance|money|forex|gold|inflation|recession|tariff|economy)\b/i
const MEME_KEYWORDS = /\b(meme|viral|funny|trend|challenge|dance|fyp|foryou|comedy)\b/i
const NEWS_KEYWORDS = /\b(breaking|news|war|politics|election|trump|biden|government|protest|scandal)\b/i

function detectCategory(name: string): string | null {
  if (CRYPTO_KEYWORDS.test(name)) return 'crypto'
  if (MARKET_KEYWORDS.test(name)) return 'market'
  if (NEWS_KEYWORDS.test(name)) return 'news'
  if (MEME_KEYWORDS.test(name)) return 'meme'
  return null
}

function formatViews(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return `${n}`
}

async function fetchFromCreativeCenter(): Promise<TikTokHashtag[]> {
  // Try the Creative Center API
  const url = 'https://ads.tiktok.com/creative_radar_api/v1/popular_trend/hashtag/list'
  const params = new URLSearchParams({
    page: '1',
    limit: '20',
    period: '7',
    country_code: 'US',
    sort_by: 'popular',
  })

  const res = await fetch(`${url}?${params}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Referer': 'https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en',
    },
    next: { revalidate: 600 },
  })

  if (!res.ok) return []

  const data = await res.json()

  if (data?.code !== 0 || !data?.data?.list) return []

  return data.data.list.slice(0, 20).map((item: Record<string, unknown>) => {
    const name = (item.hashtag_name as string) || (item.name as string) || ''
    const views = (item.publish_cnt as number) || (item.video_views as number) || (item.view_count as number) || 0
    const trendVal = (item.trend as number) || 0

    return {
      name,
      views,
      viewsFormatted: formatViews(views),
      trend: trendVal > 0 ? 'up' : trendVal < 0 ? 'down' : 'new',
      category: detectCategory(name),
    } as TikTokHashtag
  })
}

async function fetchFromPage(): Promise<TikTokHashtag[]> {
  // Scrape the Creative Center page as fallback
  const res = await fetch(
    'https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en',
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
      next: { revalidate: 600 },
    }
  )

  if (!res.ok) return []

  const html = await res.text()

  // Try to extract __NEXT_DATA__ or embedded JSON
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1])
      const hashtags = nextData?.props?.pageProps?.hashtags ||
        nextData?.props?.pageProps?.data?.list || []

      return hashtags.slice(0, 20).map((item: Record<string, unknown>) => {
        const name = (item.hashtag_name as string) || (item.name as string) || ''
        const views = (item.publish_cnt as number) || (item.video_views as number) || 0
        return {
          name,
          views,
          viewsFormatted: formatViews(views),
          trend: 'new' as const,
          category: detectCategory(name),
        }
      })
    } catch {
      // JSON parse failed
    }
  }

  return []
}

export async function GET() {
  try {
    // Try API first, fall back to page scraping
    let hashtags = await fetchFromCreativeCenter()

    if (hashtags.length === 0) {
      hashtags = await fetchFromPage()
    }

    // If both fail, return a message
    if (hashtags.length === 0) {
      return Response.json({
        hashtags: [],
        source: 'tiktok-creative-center',
        error: 'TikTok Creative Center API requires authentication. Data unavailable.',
        generated: new Date().toISOString(),
      })
    }

    return Response.json({
      hashtags,
      source: 'tiktok-creative-center',
      generated: new Date().toISOString(),
    })
  } catch {
    return Response.json({
      hashtags: [],
      source: 'tiktok-creative-center',
      generated: new Date().toISOString(),
    })
  }
}
