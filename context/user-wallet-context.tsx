import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import {
  transact as transactWeb3js,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js'
import { transact as transactBase } from '@solana-mobile/mobile-wallet-adapter-protocol'
import { PublicKey, VersionedTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import {
  address,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  compileTransaction,
  getBase64EncodedWireTransaction,
  getTransactionDecoder,
  getBase64Encoder,
  sendAndConfirmTransactionFactory,
  assertIsFullySignedTransaction,
  assertIsTransactionWithBlockhashLifetime,
  assertIsSendableTransaction,
  lamports,
  getSignatureFromTransaction,
  type Blockhash,
  type Signature,
  type TransactionPartialSigner,
  type Rpc,
  type SolanaRpcApi,
  type RpcSubscriptions,
  type SolanaRpcSubscriptionsApi,
} from '@solana/kit'
import { getTransferSolInstruction } from '@solana-program/system'
import { useNetwork, type Network } from '@/context/network-context'

const APP_IDENTITY = {
  name: 'Helio',
  uri: 'https://helio.kitsnelabs.xyz',
  icon: 'favicon.ico',
}

function getWalletErrorMessage(error: any): string {
  const msg = error?.message?.toLowerCase() ?? ''

  if (msg.includes('found no installed wallet')) {
    return 'No Solana wallet app found. Please install a wallet like Phantom or Solflare.'
  }
  if (msg.includes('declined') || msg.includes('rejected') || msg.includes('denied')) {
    return 'Request was declined in your wallet app.'
  }
  if (msg.includes('timeout') || msg.includes('timed out')) {
    return 'Wallet connection timed out. Please try again.'
  }
  if (msg.includes('not found') || msg.includes('no wallet')) {
    return 'Could not find a wallet app. Make sure one is installed and try again.'
  }

  return error?.message || 'An unexpected wallet error occurred. Please try again.'
}

function getChain(network: Network) {
  return network === 'mainnet' ? 'solana:mainnet-beta' : 'solana:devnet'
}

type UserWalletContextValue = {
  publicKey: PublicKey | null
  connected: boolean
  connecting: boolean
  sending: boolean
  signing: boolean
  connect: () => Promise<PublicKey>
  disconnect: () => void
  getBalance: () => Promise<number>
  sendSOL: (toAddress: string, amountSOL: number) => Promise<string>
  signAndSendTransaction: (transaction: VersionedTransaction) => Promise<string>
}

const UserWalletContext = createContext<UserWalletContextValue | null>(null)

export function UserWalletProvider({ children }: { children: React.ReactNode }) {
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [signing, setSigning] = useState(false)
  const [sending, setSending] = useState(false)
  const { rpc, network, rpcSubscriptions } = useNetwork()

  const sendAndConfirmTransaction = useMemo(
    () =>
      sendAndConfirmTransactionFactory({
        rpc: rpc as Rpc<SolanaRpcApi>,
        rpcSubscriptions: rpcSubscriptions as RpcSubscriptions<SolanaRpcSubscriptionsApi>,
      }),
    [rpc, rpcSubscriptions],
  )

  const connect = useCallback(async () => {
    setConnecting(true)
    try {
      const authResult = await transactWeb3js(async (wallet: Web3MobileWallet) => {
        const result = await wallet.authorize({
          chain: getChain(network),
          identity: APP_IDENTITY,
        })
        return result
      })
      const pubKey = new PublicKey(
        Uint8Array.from(atob(authResult.accounts[0].address), (c) => c.charCodeAt(0)),
      )
      setPublicKey(pubKey)
      return pubKey
    } catch (error: any) {
      console.log('Wallet connection error:', error)
      throw new Error(getWalletErrorMessage(error))
    } finally {
      setConnecting(false)
    }
  }, [network])

  const disconnect = useCallback(() => {
    setPublicKey(null)
  }, [])

  const getBalance = useCallback(async () => {
    if (!publicKey) return 0
    const balance = await rpc.getBalance(address(publicKey.toString())).send()
    return Number(balance.value) / LAMPORTS_PER_SOL
  }, [publicKey, rpc])

  const sendSOL = useCallback(
    async (toAddress: string, amountSOL: number) => {
      if (!publicKey) throw new Error('Wallet not connected')
      setSending(true)
      try {
        const source = address(publicKey.toString())
        const destination = address(toAddress)

        // Noop signer — actual signing happens in mobile wallet
        const sourceSigner: TransactionPartialSigner = {
          address: source,
          signTransactions: async (txs) => txs,
        }

        // Fetch blockhash
        let latestBlockhash: { blockhash: Blockhash; lastValidBlockHeight: bigint }
        try {
          const result = await rpc.getLatestBlockhash().send()
          latestBlockhash = result.value as typeof latestBlockhash
        } catch {
          throw new Error(
            'Unable to reach the Solana network. Check your connection and try again.',
          )
        }

        // Build transaction with @solana/kit
        const transactionMessage = pipe(
          createTransactionMessage({ version: 0 }),
          (m) => setTransactionMessageFeePayer(source, m),
          (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
          (m) =>
            appendTransactionMessageInstruction(
              getTransferSolInstruction({
                source: sourceSigner,
                destination,
                amount: lamports(BigInt(Math.round(amountSOL * LAMPORTS_PER_SOL))),
              }),
              m,
            ),
        )

        const compiledTx = compileTransaction(transactionMessage)
        const base64UnsignedTx = getBase64EncodedWireTransaction(compiledTx)

        // Sign via base MWA protocol (base64 in → signed base64 out)
        let signedBase64: string
        try {
          signedBase64 = await transactBase(async (wallet) => {
            await wallet.authorize({
              chain: getChain(network),
              identity: APP_IDENTITY,
            })
            const result = await wallet.signTransactions({
              payloads: [base64UnsignedTx],
            })
            return result.signed_payloads[0]
          })
        } catch (error: any) {
          throw new Error(getWalletErrorMessage(error))
        }

        // Decode signed base64 back to kit Transaction
        const signedBytes = getBase64Encoder().encode(signedBase64)
        const signedTransaction = getTransactionDecoder().decode(signedBytes)

        assertIsFullySignedTransaction(signedTransaction)
        assertIsTransactionWithBlockhashLifetime(signedTransaction)
        assertIsSendableTransaction(signedTransaction)

        // Send + confirm via kit
        await sendAndConfirmTransaction(signedTransaction, { commitment: 'confirmed' })

        return getSignatureFromTransaction(signedTransaction) as string
      } finally {
        setSending(false)
      }
    },
    [publicKey, rpc, network, sendAndConfirmTransaction],
  )

  const signAndSendTransaction = useCallback(
    async (transaction: VersionedTransaction) => {
      setSigning(true)
      try {
        // Serialize web3.js tx to base64
        const base64Tx = Buffer.from(transaction.serialize()).toString('base64')

        // Sign via base MWA protocol
        let signedBase64: string
        try {
          signedBase64 = await transactBase(async (wallet) => {
            await wallet.authorize({
              chain: getChain(network),
              identity: APP_IDENTITY,
            })
            const result = await wallet.signTransactions({
              payloads: [base64Tx],
            })
            return result.signed_payloads[0]
          })
        } catch (error: any) {
          throw new Error(getWalletErrorMessage(error))
        }

        // Decode signed base64 back to kit Transaction
        const signedBytes = getBase64Encoder().encode(signedBase64)
        const signedTransaction = getTransactionDecoder().decode(signedBytes)

        assertIsFullySignedTransaction(signedTransaction)
        assertIsTransactionWithBlockhashLifetime(signedTransaction)
        assertIsSendableTransaction(signedTransaction)

        // Send + confirm via kit
        await sendAndConfirmTransaction(signedTransaction, { commitment: 'confirmed' })

        return getSignatureFromTransaction(signedTransaction) as string
      } catch (error: any) {
        throw new Error(getWalletErrorMessage(error))
      } finally {
        setSigning(false)
      }
    },
    [network, sendAndConfirmTransaction],
  )

  return (
    <UserWalletContext.Provider
      value={{
        publicKey,
        connected: !!publicKey,
        connecting,
        signing,
        sending,
        connect,
        disconnect,
        getBalance,
        sendSOL,
        signAndSendTransaction,
      }}
    >
      {children}
    </UserWalletContext.Provider>
  )
}

export function useUserWallet() {
  const ctx = useContext(UserWalletContext)
  if (!ctx) throw new Error('useUserWallet must be used within UserWalletProvider')
  return ctx
}
