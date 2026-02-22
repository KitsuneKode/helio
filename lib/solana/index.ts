import { TXN_PAGE } from '@/constants/solana'
import {
  FetchMetadataFromJupiterResult,
  GetAllTokenMetadataFromJupiterResponse,
  GetAllTokensBalanceResult,
  GetBalanceResult,
  GetTransactionsResult,
  SolanaRpc,
} from '@/types'
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token'
import { address, type Address, type Signature } from '@solana/kit'
import axios, { isAxiosError } from 'axios'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'

type ValidatePublicKeyResult =
  | {
      success: true
      address: Address
    }
  | { success: false; address: null }

export const isValidPublicKey = (pubKey: string): ValidatePublicKeyResult => {
  try {
    const publicKey = address(pubKey)
    return { success: true, address: publicKey }
  } catch {
    return { success: false, address: null }
  }
}

export const getBalance = async (rpc: SolanaRpc, pubKey: Address): Promise<GetBalanceResult> => {
  const balance = await rpc.getBalance(pubKey).send()
  return {
    balance: Number(balance.value) / LAMPORTS_PER_SOL,
    address: pubKey.toString(),
  }
}

export const getAllTokens = async (
  rpc: SolanaRpc,
  pubKey: Address,
): Promise<GetAllTokensBalanceResult[]> => {
  try {
    const response = await rpc
      .getTokenAccountsByOwner(
        pubKey,
        { programId: TOKEN_PROGRAM_ADDRESS },
        { encoding: 'jsonParsed' },
      )
      .send()

    return response.value
      .map(({ account }) => ({
        mint: account.data.parsed.info.mint as string,
        amount: Number(account.data.parsed.info.tokenAmount.uiAmountString),
      }))
      .filter(({ amount }) => amount > 0)
  } catch (error) {
    console.error('Error fetching token accounts:', error)
    return [{ mint: '', amount: 0 }]
  }
}

export const getAllTransactions = async (
  rpc: SolanaRpc,
  pubKey: Address,
  before?: string,
): Promise<GetTransactionsResult> => {
  const signatures = await rpc
    .getSignaturesForAddress(pubKey, {
      limit: TXN_PAGE,
      ...(before ? { before: before as Signature } : {}),
    })
    .send()

  return signatures.map(({ signature, blockTime, err }) => ({
    signature: signature.toString(),
    blockTime: blockTime?.toString(),
    err,
  }))
}

export const getTransactionDetail = async (rpc: SolanaRpc, signature: string) => {
  return rpc
    .getTransaction(signature as Signature, {
      encoding: 'jsonParsed',
      maxSupportedTransactionVersion: 0,
    })
    .send()
}

// Fetches token metadata (name, symbol, logoURI) from Jupiter Token API.
// Plain HTTP — no crypto dependency. Falls back gracefully for unknown / devnet mints.

export const getAllTokenMetadataFromJupiter = async (
  mints: string[],
): Promise<GetAllTokenMetadataFromJupiterResponse | undefined> => {
  const mint = mints.join(',')
  try {
    const res = await axios.get<FetchMetadataFromJupiterResult[]>(
      `https://lite-api.jup.ag/tokens/v2/search?query=${mint}`,

      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
    if (!res.data) return

    return new Map(
      res.data.map(({ id, name, symbol, icon, decimals, tokenProgram, totalSupply }) => [
        id,
        {
          tokenName: name,
          symbol,
          logoURI: icon,
          decimals,
          tokenProgram,
          totalSupply,
        },
      ]),
    )
  } catch (error) {
    if (isAxiosError(error)) {
      console.error('Axios error fetching token metadata from Jupiter:', error.message)
      return
    }
  }
}
