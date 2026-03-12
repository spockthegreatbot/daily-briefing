export const revalidate = 120

type ChanThread = {
  no: number
  sub?: string
  com?: string
  replies: number
  images: number
  semantic_url?: string
}

type ChanPage = {
  threads: ChanThread[]
}

export async function GET() {
  try {
    const res = await fetch('https://a.4cdn.org/biz/catalog.json', {
      next: { revalidate: 120 },
    })
    if (!res.ok) return Response.json([])

    const pages: ChanPage[] = await res.json()
    const threads: ChanThread[] = pages.flatMap(p => p.threads ?? [])

    // Filter threads with >50 replies, sort by reply count desc
    const hot = threads
      .filter(t => t.replies > 50)
      .sort((a, b) => b.replies - a.replies)
      .slice(0, 20)
      .map(t => ({
        id: t.no,
        title: t.sub ?? stripHtml(t.com ?? '').slice(0, 120),
        replies: t.replies,
        images: t.images,
        url: `https://boards.4channel.org/biz/thread/${t.no}`,
      }))

    return Response.json(hot)
  } catch {
    return Response.json([])
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}
