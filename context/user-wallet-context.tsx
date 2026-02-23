import { createContext, useContext, useState, useCallback } from 'react'
import { transact, Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js'
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  VersionedTransaction,
} from '@solana/web3.js'
import { address } from '@solana/kit'
import { useNetwork } from '@/context/network-context'

const APP_IDENTITY = {
  name: 'Helio',
  uri: 'https://helio.app',
  icon: 'favicon.ico',
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
          chain: `solana:mainnet-beta`,
          identity: APP_IDENTITY,
        })
        return result
      })
      const pubKey = new PublicKey(Buffer.from(authResult.accounts[0].address, 'base64'))
      setPublicKey(pubKey)
      return pubKey
    } catch (error: any) {
      console.error('Connect failed:', error)
      throw error
    } finally {
      setConnecting(false)
    }
  }, [])

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
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: toPublicKey,
            lamports: Math.round(amountSOL * LAMPORTS_PER_SOL),
          }),
        )
        const {
          value: { blockhash },
        } = await rpc.getLatestBlockhash().send()
        transaction.recentBlockhash = blockhash
        transaction.feePayer = publicKey

        const txSignature = await transact(async (wallet: Web3MobileWallet) => {
          await wallet.authorize({
            chain: `solana:${network}`,
            identity: APP_IDENTITY,
          })
          const signatures = await wallet.signAndSendTransactions({
            transactions: [transaction],
          })
          return signatures[0]
        })
        return txSignature
      } finally {
        setSending(false)
      }
    },
    [publicKey, rpc, network],
  )

  const signAndSendTransaction = useCallback(async (transaction: VersionedTransaction) => {
    setSigning(true)
    try {
      const txSignature = await transact(async (wallet: Web3MobileWallet) => {
        await wallet.authorize({
          chain: 'solana:mainnet-beta',
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
  }, [])

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
