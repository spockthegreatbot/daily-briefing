export const revalidate = 300

export async function GET() {
  try {
    const res = await fetch('https://www.reddit.com/r/all.json?limit=15&t=day', {
      headers: { 'User-Agent': 'DailyBriefing/1.0' },
      next: { revalidate: 300 },
    })
    if (!res.ok) return Response.json([])
    const data = await res.json()
    const posts =
      data?.data?.children?.map((c: { data: { title: string; subreddit: string; score: number; num_comments: number; permalink: string; link_flair_text: string | null } }) => ({
        title: c.data.title,
        subreddit: c.data.subreddit,
        score: c.data.score,
        comments: c.data.num_comments,
        url: `https://reddit.com${c.data.permalink}`,
        flair: c.data.link_flair_text,
      })) ?? []
    return Response.json(posts)
  } catch {
    return Response.json([])
  }
}
