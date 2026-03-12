export const revalidate = 300

const CRYPTO_SUBS = ['CryptoCurrency', 'SatoshiStreetBets', 'memecoins', 'solana']

export async function GET() {
  try {
    const results = await Promise.all(
      CRYPTO_SUBS.map(sub =>
        fetch(`https://www.reddit.com/r/${sub}.json?limit=12&t=day`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DailyBriefing/1.0)' },
          next: { revalidate: 300 },
        })
          .then(r => r.ok ? r.json() : null)
          .then(data => {
            if (!data?.data?.children) return []
            return data.data.children.map((c: { data: Record<string, unknown> }) => ({
              title: c.data.title as string,
              subreddit: sub,
              score: (c.data.score as number) ?? 0,
              comments: (c.data.num_comments as number) ?? 0,
              url: `https://reddit.com${c.data.permalink as string}`,
              created_utc: (c.data.created_utc as number) ?? 0,
            }))
          })
          .catch(() => [])
      )
    )

    const posts = results.flat()
    posts.sort((a, b) => b.score - a.score)

    return Response.json({ posts: posts.slice(0, 50) })
  } catch {
    return Response.json({ posts: [] })
  }
}
