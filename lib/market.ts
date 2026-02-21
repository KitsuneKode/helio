export type TokenMarketData = {
  priceUsd: number | null
  priceChange5m: number | null   // NEW: 5-minute change %
  priceChange1h: number | null   // NEW: 1-hour change %
  priceChange6h: number | null   // NEW: 6-hour change %
  priceChange24h: number | null
  volume24h: number | null
  volume6h: number | null        // NEW: 6-hour volume USD
  liquidity: number | null
  fdv: number | null
  txns24h: number | null
  buys24h: number | null         // NEW: buy transactions count
  sells24h: number | null        // NEW: sell transactions count
  pairAddress: string | null
  dexId: string | null
}

const EMPTY: TokenMarketData = {
  priceUsd: null,
  priceChange5m: null,
  priceChange1h: null,
  priceChange6h: null,
  priceChange24h: null,
  volume24h: null,
  volume6h: null,
  liquidity: null,
  fdv: null,
  txns24h: null,
  buys24h: null,
  sells24h: null,
  pairAddress: null,
  dexId: null,
}

export async function fetchTokenMarketData(mint: string): Promise<TokenMarketData> {
  try {
    const res = await fetch(`https://api.dexscreener.com/tokens/v1/solana/${mint}`)
    if (!res.ok) return EMPTY
    const json = await res.json()
    const pairs: any[] = json?.pairs ?? []
    if (pairs.length === 0) return EMPTY

    // Sort by liquidity descending to get the best pair
    const sorted = [...pairs].sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))
    const pair = sorted[0]

    const buys = pair.txns?.h24?.buys ?? 0
    const sells = pair.txns?.h24?.sells ?? 0

    return {
      priceUsd: pair.priceUsd != null ? parseFloat(pair.priceUsd) : null,
      priceChange5m: pair.priceChange?.m5 ?? null,
      priceChange1h: pair.priceChange?.h1 ?? null,
      priceChange6h: pair.priceChange?.h6 ?? null,
      priceChange24h: pair.priceChange?.h24 ?? null,
      volume24h: pair.volume?.h24 ?? null,
      volume6h: pair.volume?.h6 ?? null,
      liquidity: pair.liquidity?.usd ?? null,
      fdv: pair.fdv ?? null,
      txns24h: buys + sells,
      buys24h: pair.txns?.h24?.buys ?? null,
      sells24h: pair.txns?.h24?.sells ?? null,
      pairAddress: pair.pairAddress ?? null,
      dexId: pair.dexId ?? null,
    }
  } catch {
    return EMPTY
  }
}
