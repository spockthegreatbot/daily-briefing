export const revalidate = 60

type DexProfile = {
  url: string
  chainId: string
  tokenAddress: string
  icon?: string
  header?: string
  description?: string
  links?: { type: string; url: string }[]
}

type DexBoost = {
  url: string
  chainId: string
  tokenAddress: string
  amount: number
  totalAmount: number
  icon?: string
  description?: string
}

export async function GET() {
  try {
    const [profilesRes, boostsRes] = await Promise.all([
      fetch('https://api.dexscreener.com/token-profiles/latest/v1', {
        next: { revalidate: 60 },
      }).catch(() => null),
      fetch('https://api.dexscreener.com/token-boosts/top/v1', {
        next: { revalidate: 60 },
      }).catch(() => null),
    ])

    const profiles: DexProfile[] = profilesRes?.ok ? await profilesRes.json().catch(() => []) : []
    const boosts: DexBoost[] = boostsRes?.ok ? await boostsRes.json().catch(() => []) : []

    // Normalize boosts into profile shape, dedupe by tokenAddress
    const seen = new Set<string>()
    const combined: (DexProfile & { amount?: number; totalAmount?: number; boosted?: boolean })[] = []

    for (const p of Array.isArray(profiles) ? profiles : []) {
      const key = `${p.chainId}:${p.tokenAddress}`
      if (!seen.has(key)) {
        seen.add(key)
        combined.push({ ...p, boosted: false })
      }
    }

    for (const b of Array.isArray(boosts) ? boosts : []) {
      const key = `${b.chainId}:${b.tokenAddress}`
      if (!seen.has(key)) {
        seen.add(key)
        combined.push({ ...b, boosted: true })
      } else {
        // Mark existing entry as boosted
        const existing = combined.find(c => c.chainId === b.chainId && c.tokenAddress === b.tokenAddress)
        if (existing) {
          existing.boosted = true
          existing.amount = b.amount
          existing.totalAmount = b.totalAmount
        }
      }
    }

    return Response.json({ profiles: combined, boosts: Array.isArray(boosts) ? boosts : [] })
  } catch {
    return Response.json({ profiles: [], boosts: [] })
  }
}
