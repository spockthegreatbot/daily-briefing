// Launchpad API route — server-side for non-blocked launchpads
// Pump.fun MUST be fetched client-side (Vercel IPs are rate-limited)
// This route handles: bankr, clankr, clawnch (if they have public APIs)

export const revalidate = 60

export type Launch = {
  name: string
  symbol: string
  chain: string
  launchpad: string
  marketCap?: number
  createdAt: number
  url: string
  twitter?: string
  description?: string
}

export async function GET() {
  // Bankr, Clankr, Clawnch — no confirmed public APIs found
  // Return empty arrays gracefully; pump.fun is fetched client-side
  const results: Launch[] = []
  return Response.json(results)
}
