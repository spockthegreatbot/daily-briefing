export const revalidate = 300

const GIST_RAW = 'https://gist.githubusercontent.com/spockthegreatbot/b4898ab72b2beb86c3b546c0e56527b1/raw/social-trends.json'

export async function GET() {
  try {
    const res = await fetch(GIST_RAW + '?t=' + Date.now(), { next: { revalidate: 300 } })
    if (!res.ok) throw new Error('Gist fetch failed: ' + res.status)
    const data = await res.json()
    return Response.json(data)
  } catch (e: any) {
    return Response.json({ error: e.message, twitter: { trends: [] }, tiktok: { trends: [] }, instagram: { trends: [] } })
  }
}
