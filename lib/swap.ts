export type RoutePlanStep = {
  swapInfo: {
    ammKey: string
    label?: string
    inputMint: string
    outputMint: string
    inAmount: string
    outAmount: string
    feeAmount: string
    feeMint: string
  }
  percent: number
}

export type SwapQuote = {
  inAmount: string
  outAmount: string
  priceImpactPct: string
  routePlan: RoutePlanStep[]
  otherAmountThreshold: string
  slippageBps: number
}

export async function fetchSwapQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number = 50,
): Promise<SwapQuote | null> {
  try {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: String(Math.floor(amount)),
      slippageBps: String(slippageBps),
    })
    const res = await fetch(`https://lite-api.jup.ag/swap/v1/quote?${params.toString()}`)
    if (!res.ok) return null
    const json = await res.json()
    if (!json || json.error) return null
    return json as SwapQuote
  } catch {
    return null
  }
}
