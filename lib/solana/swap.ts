import {
  executeSwapTransactionParams,
  SwapExecutionResponse,
  SwapExecutionResult,
  SwapQuote,
} from '@/types'
import axios, { AxiosError } from 'axios'

type FetchSwapQuoteParams = {
  inputMint: string
  outputMint: string
  amount: number
  slippageBps: number
}

const SWAP_JUP_URL = 'https://lite-api.jup.ag/swap/v1/'

export const fetchSwapQuote = async ({
  inputMint,
  outputMint,
  amount,
  slippageBps = 50,
}: FetchSwapQuoteParams): Promise<SwapQuote | null> => {
  try {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: String(Math.floor(amount)),
      slippageBps: String(slippageBps),
    })
    const res = await axios.get<SwapQuote>(`${SWAP_JUP_URL}/quote?${params.toString()}`)
    if (!res.data) return null

    console.log('Swap quote response:', res.data)
    return res.data
  } catch {
    return null
  }
}

export const getSwapTransaction = async ({
  quoteResponse,
  userPublicKey,
}: executeSwapTransactionParams): Promise<SwapExecutionResult | null> => {
  try {
    const res = await axios.post<SwapExecutionResponse>(
      `${SWAP_JUP_URL}/swap`,
      {
        userPublicKey,
        quoteResponse,
        dynamicComputeUnitLimit: true,
        dynamicSlippage: true,
        prioritizationFeeLamports: {
          priorityLevelWithMaxLamports: { priorityLevel: 'veryHigh', maxLamports: 1000000 },
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    )

    if (!res.data) return null

    const { swapTransaction } = res.data

    const transaction = Uint8Array.from(atob(swapTransaction), (c) => c.charCodeAt(0))

    return { transaction }
  } catch (error) {
    console.error('Swap execution error:', (error as AxiosError).message)
    return null
  }
}
