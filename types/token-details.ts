export type PeriodStats = {
  priceChange: number | null
  buyVolume: number | null
  sellVolume: number | null
  numBuys: number | null
  numSells: number | null
}

export type TokenJupiterDetail = {
  // Metadata
  name: string | null
  symbol: string | null
  logoURI: string | null
  decimals: number | null
  tags: string[]
  description: string | null

  // Social links
  website: string | null
  twitter: string | null
  discord: string | null
  coingeckoId: string | null

  // Market data
  priceUsd: number | null
  fdv: number | null
  mcap: number | null
  liquidity: number | null

  // Period stats
  stats5m: PeriodStats | null
  stats1h: PeriodStats | null
  stats6h: PeriodStats | null
  stats24h: PeriodStats | null
}
