export const revalidate = 300

type HNItem = {
  id: number
  title: string
  url?: string
  score: number
  descendants?: number
  by: string
}

type TrendItem = {
  title: string
  url: string
  score: number
  comments: number
  by: string
  hnUrl: string
  source: 'hn'
}

async function fetchHN(): Promise<TrendItem[]> {
  try {
    const idsRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', {
      next: { revalidate: 300 },
    })
    if (!idsRes.ok) return []
    const ids: number[] = await idsRes.json()
    const top = ids.slice(0, 30)

    const items = await Promise.all(
      top.map((id) =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
          next: { revalidate: 300 },
        })
          .then((r) => r.json() as Promise<HNItem>)
          .catch(() => null)
      )
    )

    return items
      .filter((i): i is HNItem => !!i && !!i.title)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((i) => ({
        title: i.title,
        url: i.url ?? `https://news.ycombinator.com/item?id=${i.id}`,
        score: i.score,
        comments: i.descendants ?? 0,
        by: i.by,
        hnUrl: `https://news.ycombinator.com/item?id=${i.id}`,
        source: 'hn' as const,
      }))
  } catch {
    return []
  }
}

export async function GET() {
  const trends = await fetchHN()
  return Response.json({ trends, fetched_at: new Date().toISOString() })
}
