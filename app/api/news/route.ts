export const revalidate = 300

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = searchParams.get('page') ?? '1'

  try {
    const res = await fetch(
      `https://content.guardianapis.com/search?api-key=test&show-fields=headline,thumbnail,trailText,byline&page-size=12&page=${page}&order-by=newest`,
      { next: { revalidate: 300 } }
    )
    if (!res.ok) return Response.json([])
    const data = await res.json()
    return Response.json(data.response?.results ?? [])
  } catch {
    return Response.json([])
  }
}
