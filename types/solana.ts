import { type TransactionError, type createSolanaRpc } from '@solana/kit'

export type SolanaRpc = ReturnType<typeof createSolanaRpc>

export interface FetchMetadataFromJupiterResult {
  id: string
  name: string
  symbol: string
  decimals: number
  icon: string
  tokenProgram: string
  totalSupply: number
}

export type GetAllTokensBalanceResult = { mint: string; amount: number }

export type GetTokensResult = (GetAllTokensBalanceResult & {
  tokenName?: string
  symbol?: string
  logoURI?: string
})[]

export type GetBalanceResult = { balance: number; address: string }

export type GetTransactionsResult = {
  signature: string
  blockTime: string | undefined
  err: TransactionError | null
}[]

export type TokenMetadata = {
  tokenName: string | null
  symbol: string | null
  logoURI: string | null
  decimals: number
  tokenProgram: string
  totalSupply: number
}
export type GetAllTokenMetadataResponse = Map<string, TokenMetadata>
