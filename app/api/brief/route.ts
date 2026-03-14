export const revalidate = 300

const GUARDIAN_KEY = process.env.GUARDIAN_API_KEY || 'test'
const NEWSAPI_KEY = process.env.NEWSAPI_KEY || '58a16654317640d490cf02e0429f1567'

type BriefItem = {
  text: string
  tag: '📈 Market impact' | '⚠️ Risk signal' | '💡 Opportunity' | '📊 Data point' | '🔥 Trending'
  source: string
}

function classifyHeadline(headline: string): BriefItem['tag'] {
  const h = headline.toLowerCase()
  // Market impact keywords
  if (/\b(stock|market|nasdaq|s&p|dow|rally|crash|fed|interest rate|inflation|gdp|recession|tariff|trade war|sanctions|oil|gold|commodit)/i.test(h))
    return '📈 Market impact'
  // Risk signals
  if (/\b(war|attack|crisis|collapse|hack|breach|fraud|bankrupt|default|regulat|ban|lawsuit|indictment|investigation|threat)/i.test(h))
    return '⚠️ Risk signal'
  // Opportunity
  if (/\b(launch|ipo|partner|acqui|merger|breakthrough|innovat|approval|bullish|surge|soar|moon|pump|listing|funding|invest)/i.test(h))
    return '💡 Opportunity'
  // Trending
  if (/\b(viral|trending|elon|trump|meme|ai\b|openai|google|apple|microsoft|tesla)/i.test(h))
    return '🔥 Trending'
  return '📊 Data point'
}

export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  const items: BriefItem[] = []

  try {
    // Fetch news from both sources
    const [guardianRes, newsapiRes, cryptoRes, fngRes, redditRes] = await Promise.all([
      fetch(`https://content.guardianapis.com/search?api-key=${GUARDIAN_KEY}&show-fields=headline&page-size=8&order-by=newest`, { next: { revalidate: 300 } })
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`https://newsapi.org/v2/top-headlines?language=en&pageSize=8&apiKey=${NEWSAPI_KEY}`, { next: { revalidate: 300 } })
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true', { next: { revalidate: 300 } })
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('https://api.alternative.me/fng/?limit=1')
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${origin}/api/reddit`)
        .then(r => r.ok ? r.json() : null).catch(() => null),
    ])

    // Crypto summary
    if (cryptoRes) {
      const btc = cryptoRes.bitcoin
      const eth = cryptoRes.ethereum
      const sol = cryptoRes.solana
      if (btc) {
        const sign = btc.usd_24h_change >= 0 ? '+' : ''
        items.push({
          text: `BTC $${btc.usd?.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${sign}${btc.usd_24h_change?.toFixed(1)}%)${eth ? `, ETH $${eth.usd?.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${eth.usd_24h_change >= 0 ? '+' : ''}${eth.usd_24h_change?.toFixed(1)}%)` : ''}${sol ? `, SOL $${sol.usd?.toFixed(0)} (${sol.usd_24h_change >= 0 ? '+' : ''}${sol.usd_24h_change?.toFixed(1)}%)` : ''}`,
          tag: '📈 Market impact',
          source: 'CoinGecko',
        })
      }
    }

    // Fear & Greed
    if (fngRes?.data?.[0]) {
      const fng = fngRes.data[0]
      items.push({
        text: `Crypto Fear & Greed Index: ${fng.value} — ${fng.value_classification}`,
        tag: parseInt(fng.value) >= 60 ? '💡 Opportunity' : parseInt(fng.value) <= 30 ? '⚠️ Risk signal' : '📊 Data point',
        source: 'Alternative.me',
      })
    }

    // Deduplicate headlines across sources
    const seen = new Set<string>()
    const allHeadlines: { text: string; source: string }[] = []

    // Guardian headlines
    if (guardianRes?.response?.results) {
      for (const r of guardianRes.response.results.slice(0, 6)) {
        const h = r.fields?.headline ?? r.webTitle ?? ''
        if (h) allHeadlines.push({ text: h, source: 'Guardian' })
      }
    }

    // NewsAPI headlines
    if (newsapiRes?.articles) {
      for (const a of newsapiRes.articles.slice(0, 6)) {
        const h = (a.title as string) ?? ''
        if (h) allHeadlines.push({ text: h, source: a.source?.name ?? 'NewsAPI' })
      }
    }

    // Deduplicate by first 30 chars
    for (const hl of allHeadlines) {
      const key = hl.text.toLowerCase().slice(0, 30)
      if (seen.has(key)) continue
      seen.add(key)
      items.push({
        text: hl.text,
        tag: classifyHeadline(hl.text),
        source: hl.source,
      })
    }

    // Top Reddit crypto buzz
    if (redditRes?.posts?.length > 0) {
      const topPost = redditRes.posts[0]
      items.push({
        text: `Reddit r/${topPost.subreddit}: "${topPost.title.slice(0, 80)}${topPost.title.length > 80 ? '…' : ''}" (${topPost.score} upvotes)`,
        tag: '🔥 Trending',
        source: 'Reddit',
      })
    }

    // Cap at 7 items
    return Response.json({
      items: items.slice(0, 7),
      generated: new Date().toISOString(),
    })
  } catch {
    return Response.json({ items: [], generated: new Date().toISOString() })
  }
}
