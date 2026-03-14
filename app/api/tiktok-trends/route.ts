export const revalidate = 600

type TikTokHashtag = {
  name: string
  views: number
  viewsFormatted: string
  posts: number
  postsFormatted: string
  rank: number
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

function formatNum(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return `${n}`
}

// rankDiffType: 1 = moved up, 2 = moved down, 3 = no change, 4 = new entry
function parseTrend(rankDiffType: number | null, rankDiff: number | null): 'up' | 'down' | 'new' | 'stable' {
  if (rankDiffType === 4) return 'new'
  if (rankDiffType === 1) return 'up'
  if (rankDiffType === 2) return 'down'
  if (rankDiffType === 3) return 'stable'
  if (rankDiff !== null && rankDiff > 0) return 'up'
  if (rankDiff !== null && rankDiff < 0) return 'down'
  return 'stable'
}

export async function GET() {
  try {
    // Scrape TikTok Creative Center page — data is embedded in __NEXT_DATA__
    const res = await fetch(
      'https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        next: { revalidate: 600 },
      }
    )

    if (!res.ok) {
      return Response.json({
        hashtags: [],
        source: 'tiktok-creative-center',
        error: `TikTok returned ${res.status}`,
        generated: new Date().toISOString(),
      })
    }

    const html = await res.text()

    // Extract __NEXT_DATA__ which contains pre-fetched React Query data
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (!nextDataMatch) {
      return Response.json({
        hashtags: [],
        source: 'tiktok-creative-center',
        error: 'Could not find embedded data on TikTok page',
        generated: new Date().toISOString(),
      })
    }

    const nextData = JSON.parse(nextDataMatch[1])
    const queries = nextData?.props?.pageProps?.dehydratedState?.queries || []

    let hashtags: TikTokHashtag[] = []

    for (const q of queries) {
      const data = q?.state?.data
      if (data?.pages && Array.isArray(data.pages) && data.pages.length > 0) {
        const items = data.pages[0]?.list
        if (Array.isArray(items) && items.length > 0) {
          hashtags = items.slice(0, 20).map((item: Record<string, unknown>) => {
            const name = (item.hashtagName as string) || ''
            const views = (item.videoViews as number) || 0
            const posts = (item.publishCnt as number) || 0
            const rank = (item.rank as number) || 0
            const rankDiff = item.rankDiff as number | null
            const rankDiffType = item.rankDiffType as number | null

            return {
              name,
              views,
              viewsFormatted: formatNum(views),
              posts,
              postsFormatted: formatNum(posts),
              rank,
              trend: parseTrend(rankDiffType, rankDiff),
              category: detectCategory(name),
            }
          })
          break
        }
      }
    }

    if (hashtags.length === 0) {
      return Response.json({
        hashtags: [],
        source: 'tiktok-creative-center',
        error: 'No hashtag data found in page',
        generated: new Date().toISOString(),
      })
    }

    return Response.json({
      hashtags,
      source: 'tiktok-creative-center',
      generated: new Date().toISOString(),
    })
  } catch (err) {
    return Response.json({
      hashtags: [],
      source: 'tiktok-creative-center',
      error: err instanceof Error ? err.message : 'Unknown error',
      generated: new Date().toISOString(),
    })
  }
}
