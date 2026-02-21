export type Token = {
  mint: string
  symbol: string
  logo: string
  decimals: number
}

export const SOL: Token = {
  mint: 'So11111111111111111111111111111111111111112',
  symbol: 'SOL',
  logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  decimals: 9,
}

export const USDC: Token = {
  mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  symbol: 'USDC',
  logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  decimals: 6,
}

export const SLIPPAGE_OPTS = ['0.5', '1.0', '2.0'] as const
export type SlippageOpt = (typeof SLIPPAGE_OPTS)[number]
