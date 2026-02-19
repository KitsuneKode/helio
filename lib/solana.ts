import { LAMPORTS_PER_SOL } from '@/constants/solana'
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token'
import { address, createSolanaRpc, TransactionError, type Address } from '@solana/kit'

const rpcUrl = process.env.RPC_URL!

const rpc = createSolanaRpc(rpcUrl)

export type GetTokensResult = { mint: string; amount: number }[]

export type GetTransactionsResult = {
  signature: string
  blockTime: string | undefined
  err: TransactionError | null
}[]

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

export const getBalance = async (pubKey: Address) => {
  const balance = await rpc.getBalance(pubKey).send()

  const balanceInSol = Number(balance.value / LAMPORTS_PER_SOL)
  return balanceInSol
}

export const getAllTokens = async (pubKey: Address): Promise<GetTokensResult> => {
  const response = await rpc
    .getTokenAccountsByOwner(
      pubKey,
      { programId: TOKEN_PROGRAM_ADDRESS },
      { encoding: 'jsonParsed' }
    )
    .send()

  const requiredAccounts = response.value
    .map(({ account }) => ({
      mint: account.data.parsed.info.mint.toString(),
      amount: Number(account.data.parsed.info.tokenAmount.uiAmountString),
    }))
    .filter(({ amount }) => Number(amount) > 0)

  return requiredAccounts
}

export const getAllTransactions = async (pubKey: Address): Promise<GetTransactionsResult> => {
  const signatures = await rpc
    .getSignaturesForAddress(pubKey, {
      limit: 10,
    })
    .send()

  const requiredSignatureData = signatures.map(({ signature, blockTime, err }) => ({
    signature: signature.toString(),
    blockTime: blockTime?.toString(),
    err,
  }))

  return requiredSignatureData
}
