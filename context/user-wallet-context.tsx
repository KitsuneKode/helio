import { createContext, useContext, useState, useCallback } from 'react'
import { transact, Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js'
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  VersionedTransaction,
  TransactionMessage,
} from '@solana/web3.js'
import { address, Signature } from '@solana/kit'
import { useNetwork, type Network } from '@/context/network-context'

const APP_IDENTITY = {
  name: 'Helio',
  uri: 'https://helio.kitsnelabs.xyz',
  icon: 'favicon.ico',
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
  const { rpc, network } = useNetwork()

  const connect = useCallback(async () => {
    setConnecting(true)
    try {
      const authResult = await transact(async (wallet: Web3MobileWallet) => {
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
      console.error('Connect failed:', error)
      throw error
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
        const toPublicKey = new PublicKey(toAddress)
        const instructions = [
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: toPublicKey,
            lamports: Math.round(amountSOL * LAMPORTS_PER_SOL),
          }),
        ]
        const {
          value: { blockhash },
        } = await rpc.getLatestBlockhash().send()

        const txMessage = new TransactionMessage({
          payerKey: publicKey,
          recentBlockhash: blockhash,
          instructions,
        }).compileToV0Message()

        const transferTx = new VersionedTransaction(txMessage)

        const txSignature = await transact(async (wallet: Web3MobileWallet) => {
          await wallet.authorize({
            chain: getChain(network),
            identity: APP_IDENTITY,
          })
          const signatures = await wallet.signAndSendTransactions({
            transactions: [transferTx],
          })
          return signatures[0] as unknown as Signature
        })

        const maxRetries = 15
        const retryDelay = 2000

        for (let i = 0; i < maxRetries; i++) {
          const confirmation = await rpc
            .getSignatureStatuses([txSignature], { searchTransactionHistory: true })
            .send()

          const status = confirmation.value[0]

          if (status?.err) {
            throw new Error('Transaction failed on-chain. Please check your wallet for details.')
          }

          if (
            status?.confirmationStatus === 'confirmed' ||
            status?.confirmationStatus === 'finalized'
          ) {
            return String(txSignature)
          }

          await new Promise((resolve) => setTimeout(resolve, retryDelay))
        }

        throw new Error('Transaction confirmation timed out. It may still confirm later.')
      } finally {
        setSending(false)
      }
    },
    [publicKey, rpc, network],
  )

  const signAndSendTransaction = useCallback(
    async (transaction: VersionedTransaction) => {
      setSigning(true)
      try {
        const txSignature = await transact(async (wallet: Web3MobileWallet) => {
          await wallet.authorize({
            chain: getChain(network),
            identity: APP_IDENTITY,
          })
          const signatures = await wallet.signAndSendTransactions({
            transactions: [transaction],
          })

          return signatures[0]
        })
        return txSignature
      } finally {
        setSigning(false)
      }
    },
    [network],
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
