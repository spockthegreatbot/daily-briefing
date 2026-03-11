export const revalidate = 300

const NEWSAPI_KEY = process.env.NEWSAPI_KEY || '58a16654317640d490cf02e0429f1567'
const GUARDIAN_KEY = process.env.GUARDIAN_API_KEY || 'test'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = searchParams.get('page') ?? '1'
  const source = searchParams.get('source') ?? 'guardian'

  try {
    if (source === 'newsapi') {
      // NewsAPI — top headlines
      const res = await fetch(
        `https://newsapi.org/v2/top-headlines?language=en&pageSize=12&page=${page}&apiKey=${NEWSAPI_KEY}`,
        { next: { revalidate: 300 } }
      )
      if (!res.ok) return Response.json([])
      const data = await res.json()
      // Normalize to Guardian format
      const articles = (data.articles ?? []).map((a: Record<string, unknown>) => ({
        id: a.url as string,
        webUrl: a.url as string,
        webPublicationDate: a.publishedAt as string,
        fields: {
          headline: a.title as string,
          trailText: a.description as string,
          thumbnail: a.urlToImage as string,
          byline: a.author as string,
        },
        sectionName: (a.source as { name?: string } | undefined)?.name ?? '',
      }))
      return Response.json(articles)
    }

    // Default: Guardian
    const res = await fetch(
      `https://content.guardianapis.com/search?api-key=${GUARDIAN_KEY}&show-fields=headline,thumbnail,trailText,byline&page-size=12&page=${page}&order-by=newest`,
      { next: { revalidate: 300 } }
    )
    if (!res.ok) return Response.json([])
    const data = await res.json()
    return Response.json(data.response?.results ?? [])
  } catch {
    return Response.json([])
  }
}
