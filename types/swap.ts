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
  contextSlot: number
  timeTaken: number
  swapMode: 'ExactIn' | 'ExactOut'
}

export type SwapExecutionResponse = {
  swapTransaction: string
  lastValidBlockHeight: number
  prioritizationFeeLamports: number
  dynamicSlippageReport: {
    slippageBps: number
    otherAmount: number
    simulatedIncurredSlippageBps: number
    amplificationRatio: number
  }
}

export type executeSwapTransactionParams = { quoteResponse: SwapQuote; userPublicKey: string }

export type SwapExecutionResult = {
  transaction: Uint8Array
}
