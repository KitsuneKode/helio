// Fetches rich single-token data from the Jupiter Tokens API.
// Returns metadata, social links, AND market data in a single call.

import axios from 'axios'

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

const EMPTY_PERIOD: null = null

const EMPTY_DETAIL: TokenJupiterDetail = {
  name: null,
  symbol: null,
  logoURI: null,
  decimals: null,
  tags: [],
  description: null,
  website: null,
  twitter: null,
  discord: null,
  coingeckoId: null,
  priceUsd: null,
  fdv: null,
  mcap: null,
  liquidity: null,
  stats5m: EMPTY_PERIOD,
  stats1h: EMPTY_PERIOD,
  stats6h: EMPTY_PERIOD,
  stats24h: EMPTY_PERIOD,
}

function parsePeriodStats(raw: any): PeriodStats | null {
  if (!raw || typeof raw !== 'object') return null
  return {
    priceChange: raw.priceChange ?? null,
    buyVolume: raw.buyVolume ?? null,
    sellVolume: raw.sellVolume ?? null,
    numBuys: raw.numBuys ?? null,
    numSells: raw.numSells ?? null,
  }
}

export async function fetchTokenJupiterDetail(mint: string): Promise<TokenJupiterDetail> {
  try {
    const { data } = await axios.get(`https://lite-api.jup.ag/tokens/v2/search?query=${mint}`)
    if (!data) return EMPTY_DETAIL
    const d = data[0]
    return {
      // Metadata
      name: d.name ?? null,
      symbol: d.symbol ?? null,
      logoURI: d.icon ?? d.logoURI ?? null,
      decimals: typeof d.decimals === 'number' ? d.decimals : null,
      tags: Array.isArray(d.tags) ? d.tags : [],
      description: d.extensions?.description ?? d.description ?? null,

      // Social links (top-level in this API, fallback to extensions)
      website: d.website ?? d.extensions?.website ?? null,
      twitter: d.twitter ?? d.extensions?.twitter ?? null,
      discord: d.discord ?? d.extensions?.discord ?? null,
      coingeckoId: d.extensions?.coingeckoId ?? null,

      // Market data
      priceUsd: typeof d.usdPrice === 'number' ? d.usdPrice : null,
      fdv: typeof d.fdv === 'number' ? d.fdv : null,
      mcap: typeof d.mcap === 'number' ? d.mcap : null,
      liquidity: typeof d.liquidity === 'number' ? d.liquidity : null,

      // Period stats
      stats5m: parsePeriodStats(d.stats5m),
      stats1h: parsePeriodStats(d.stats1h),
      stats6h: parsePeriodStats(d.stats6h),
      stats24h: parsePeriodStats(d.stats24h),
    }
  } catch {
    return EMPTY_DETAIL
  }
}
