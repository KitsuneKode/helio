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
