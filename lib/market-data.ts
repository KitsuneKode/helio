import axios from 'axios'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type TokenMarketData = {
  price: number | null
  priceChange24h: number | null // percentage, e.g. 3.45 = +3.45%
  marketCap: number | null
  volume24h: number | null
  fdv: number | null
  liquidity: number | null
  pairUrl: string | null
  priceSource: 'jupiter' | 'dexscreener' | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Jupiter Price API v2
// ─────────────────────────────────────────────────────────────────────────────

type JupiterPriceResponse = {
  data: Record<
    string,
    {
      id: string
      price: string
      extraInfo?: {
        quotedPrice?: {
          buyPrice?: string
          sellPrice?: string
        }
        confidenceLevel?: string
        depth?: {
          buyPriceImpactRatio?: { depth?: { '10'?: number; '100'?: number; '1000'?: number } }
        }
        lastSwappedPrice?: {
          lastJupiterSellPrice?: string
          lastJupiterBuyPrice?: string
        }
      }
    }
  >
  timeTaken: number
}

async function fetchJupiterPrice(mint: string): Promise<{ price: number | null }> {
  try {
    const res = await axios.get<JupiterPriceResponse>(
      `https://lite-api.jup.ag/price/v2?ids=${mint}`,
      { timeout: 6000 },
    )
    const entry = res.data?.data?.[mint]
    if (!entry?.price) return { price: null }
    return { price: parseFloat(entry.price) }
  } catch {
    return { price: null }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DexScreener Token API
// ─────────────────────────────────────────────────────────────────────────────

type DexScreenerPair = {
  chainId: string
  pairAddress: string
  baseToken: { address: string; name: string; symbol: string }
  priceUsd?: string
  priceChange?: { h24?: number; h6?: number; h1?: number }
  volume?: { h24?: number }
  marketCap?: number
  fdv?: number
  liquidity?: { usd?: number }
  url?: string
}

type DexScreenerResponse = {
  pairs: DexScreenerPair[] | null
}

async function fetchDexScreenerData(mint: string): Promise<{
  price: number | null
  priceChange24h: number | null
  marketCap: number | null
  volume24h: number | null
  fdv: number | null
  liquidity: number | null
  pairUrl: string | null
}> {
  try {
    const res = await axios.get<DexScreenerResponse>(
      `https://api.dexscreener.com/tokens/solana/${mint}`,
      { timeout: 8000 },
    )
    const pairs = res.data?.pairs
    if (!pairs || pairs.length === 0) {
      return {
        price: null,
        priceChange24h: null,
        marketCap: null,
        volume24h: null,
        fdv: null,
        liquidity: null,
        pairUrl: null,
      }
    }

    // Pick the pair with the highest liquidity as the "main" pair
    const best = pairs.reduce<DexScreenerPair>((prev, curr) => {
      const prevLiq = prev.liquidity?.usd ?? 0
      const currLiq = curr.liquidity?.usd ?? 0
      return currLiq > prevLiq ? curr : prev
    }, pairs[0])

    return {
      price: best.priceUsd ? parseFloat(best.priceUsd) : null,
      priceChange24h: best.priceChange?.h24 ?? null,
      marketCap: best.marketCap ?? null,
      volume24h: best.volume?.h24 ?? null,
      fdv: best.fdv ?? null,
      liquidity: best.liquidity?.usd ?? null,
      pairUrl: best.url ?? null,
    }
  } catch {
    return {
      price: null,
      priceChange24h: null,
      marketCap: null,
      volume24h: null,
      fdv: null,
      liquidity: null,
      pairUrl: null,
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Combined fetch – call BOTH APIs in parallel, merge results
// Jupiter price is more accurate; DexScreener fills in market stats
// ─────────────────────────────────────────────────────────────────────────────

export async function getTokenMarketData(mint: string): Promise<TokenMarketData> {
  const [dex, jup] = await Promise.all([fetchDexScreenerData(mint), fetchJupiterPrice(mint)])

  // Jupiter price is more reliable; DexScreener has market context
  const price = jup.price ?? dex.price
  const priceSource = jup.price ? 'jupiter' : dex.price ? 'dexscreener' : null

  return {
    price,
    priceChange24h: dex.priceChange24h,
    marketCap: dex.marketCap,
    volume24h: dex.volume24h,
    fdv: dex.fdv,
    liquidity: dex.liquidity,
    pairUrl: dex.pairUrl,
    priceSource,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Formatting helpers (used in UI)
// ─────────────────────────────────────────────────────────────────────────────

export const formatUSD = (value: number | null, decimals = 2): string => {
  if (value === null) return '—'
  if (value === 0) return '$0.00'
  if (value < 0.000001) return `$${value.toExponential(2)}`
  if (value < 0.01) return `$${value.toFixed(6)}`
  if (value < 1) return `$${value.toFixed(4)}`
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`
  return `$${value.toFixed(decimals)}`
}

export const formatPriceChange = (change: number | null): string => {
  if (change === null) return '—'
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}%`
}
