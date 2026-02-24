import { Token } from '@/types'

export const SOL: Token = {
  mint: 'So11111111111111111111111111111111111111112',
  symbol: 'SOL',
  name: 'Solana',
  logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  decimals: 9,
}

export const USDC: Token = {
  mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  symbol: 'USDC',
  name: 'USD Coin',
  logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  decimals: 6,
}

export const USDT: Token = {
  mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  symbol: 'USDT',
  name: 'Tether USD',
  logo: 'https://coin-images.coingecko.com/coins/images/325/large/Tether.png',
  decimals: 6,
}

export const BONK: Token = {
  mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  symbol: 'BONK',
  name: 'Bonk',
  logo: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
  decimals: 5,
}

export const JUP: Token = {
  mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  symbol: 'JUP',
  name: 'Jupiter',
  logo: 'https://static.jup.ag/jup/icon.png',
  decimals: 6,
}

export const RAY: Token = {
  mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  symbol: 'RAY',
  name: 'Raydium',
  logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R/logo.png',
  decimals: 6,
}

export const JTO: Token = {
  mint: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
  symbol: 'JTO',
  name: 'Jito',
  logo: 'https://metadata.jito.network/token/jto/image',
  decimals: 9,
}

export const WIF: Token = {
  mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  symbol: 'WIF',
  name: 'dogwifhat',
  logo: 'https://bafkreibk3covs5ltyqxa272uodhculbr6kea6betidfwy3ajsav2vjzyum.ipfs.dweb.link',
  decimals: 6,
}

export const PYTH: Token = {
  mint: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
  symbol: 'PYTH',
  name: 'Pyth Network',
  logo: 'https://legacy.pyth.network/token.svg',
  decimals: 6,
}

export const JITOSOL: Token = {
  mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
  symbol: 'JitoSOL',
  name: 'Jito Staked SOL',
  logo: 'https://storage.googleapis.com/token-metadata/JitoSOL-256.png',
  decimals: 9,
}

export const SWAP_TOKENS: Token[] = [SOL, USDC, USDT, BONK, JUP, RAY, JTO, WIF, PYTH, JITOSOL]

export const SLIPPAGE_OPTS = ['0.5', '1.0', '2.0'] as const
