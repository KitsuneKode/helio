import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { transact, KitMobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-kit'
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
  createNoopSigner,
  getAddressCodec,
  getBase64Encoder,
  lamports,
  type Address,
  type Signature,
} from '@solana/kit'
import { getTransferSolInstruction } from '@solana-program/system'
import { useNetwork, type Network } from '@/context/network-context'
import { storage } from '@/lib/storage'
import { Base64EncodedAddress } from '@solana-mobile/mobile-wallet-adapter-protocol'

const LAMPORTS_PER_SOL = 1_000_000_000n

const APP_IDENTITY = {
  name: 'Helio',
  uri: 'https://helio.kitsnelabs.xyz',
  icon: 'favicon.ico',
}

/** Storage keys are scoped per network so tokens don't cross chains */
function storageKeys(net: Network) {
  return {
    authToken: `wallet-auth-token-${net}`,
    base64Address: `wallet-base64-address-${net}`,
  }
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

/** Decode a base64 MWA account address into a kit Address */

export function getAddressFromBase64(encoded: Base64EncodedAddress): Address {
  const decoded = getBase64Encoder().encode(encoded)

  return getAddressCodec().decode(decoded)
}

type UserWalletContextValue = {
  publicKey: Address | null
  connected: boolean
  connecting: boolean
  sending: boolean
  signing: boolean
  connect: () => Promise<Address>
  disconnect: () => Promise<void>
  getBalance: () => Promise<number>
  sendSOL: (toAddress: string, amountSOL: number) => Promise<string>
  signAndSendTransaction: (transactionBytes: Uint8Array) => Promise<string>
}

const UserWalletContext = createContext<UserWalletContextValue | null>(null)

export function UserWalletProvider({ children }: { children: React.ReactNode }) {
  const [publicKey, setPublicKey] = useState<Address | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [signing, setSigning] = useState(false)
  const [sending, setSending] = useState(false)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const { rpc, network } = useNetwork()

  // Restore cached wallet for current network (also runs on network switch)
  useEffect(() => {
    const keys = storageKeys(network)
    const cachedToken = storage.getItem(keys.authToken)
    const cachedAddress = storage.getItem(keys.base64Address)
    if (cachedToken && cachedAddress) {
      try {
        const addr = getAddressFromBase64(cachedAddress)
        setPublicKey(addr)
        setAuthToken(cachedToken)
      } catch {
        // Corrupted cache — clear it
        storage.removeItem(keys.authToken)
        storage.removeItem(keys.base64Address)
        setPublicKey(null)
        setAuthToken(null)
      }
    } else {
      // No cached session for this network
      setPublicKey(null)
      setAuthToken(null)
    }
  }, [network])

  /** Try reauthorize with cached token, fall back to full authorize */
  const authorizeSession = useCallback(
    async (wallet: KitMobileWallet): Promise<{ authToken: string; pubKey: Address }> => {
      const chain = getChain(network)

      if (authToken) {
        try {
          const reauth = await wallet.reauthorize({
            auth_token: authToken,
            identity: APP_IDENTITY,
          })
          const token = reauth.auth_token
          const keys = storageKeys(network)
          storage.setItem(keys.authToken, token)
          setAuthToken(token)
          return { authToken: token, pubKey: publicKey! }
        } catch {
          // Token expired — fall through to full authorize
        }
      }

      const result = await wallet.authorize({
        chain,
        identity: APP_IDENTITY,
      })
      const token = result.auth_token
      const base64Addr = result.accounts[0].address
      const pubKey = getAddressFromBase64(base64Addr)

      const keys = storageKeys(network)
      storage.setItem(keys.authToken, token)
      storage.setItem(keys.base64Address, base64Addr)
      setAuthToken(token)
      setPublicKey(pubKey)

      return { authToken: token, pubKey }
    },
    [authToken, network, publicKey],
  )

  const connect = useCallback(async () => {
    setConnecting(true)
    try {
      const result = await transact(async (wallet: KitMobileWallet) => {
        const authResult = await wallet.authorize({
          chain: getChain(network),
          identity: APP_IDENTITY,
        })
        return authResult
      })

      const base64Addr = result.accounts[0].address
      const pubKey = getAddressFromBase64(base64Addr)

      // Cache to MMKV (scoped to current network)
      const keys = storageKeys(network)
      storage.setItem(keys.authToken, result.auth_token)
      storage.setItem(keys.base64Address, base64Addr)

      setPublicKey(pubKey)
      setAuthToken(result.auth_token)
      return pubKey
    } catch (error: any) {
      console.log('Wallet connection error:', error)
      throw new Error(getWalletErrorMessage(error))
    } finally {
      setConnecting(false)
    }
  }, [network])

  const disconnect = useCallback(async () => {
    // Just clear local state — don't deauthorize with the wallet app.
    // This way if the user reconnects, reauthorize can restore the session
    // silently without forcing a full approve flow.
    const keys = storageKeys(network)
    storage.removeItem(keys.authToken)
    storage.removeItem(keys.base64Address)

    setPublicKey(null)
    setAuthToken(null)
  }, [network])

  const getBalance = useCallback(async () => {
    if (!publicKey) return 0
    const balance = await rpc.getBalance(publicKey).send()
    return Number(balance.value) / Number(LAMPORTS_PER_SOL)
  }, [publicKey, rpc])

  /** Poll getSignatureStatuses until confirmed/finalized or timeout */
  const confirmTransaction = useCallback(
    async (signature: string) => {
      const sig = signature as Signature
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 2000))
        try {
          const result = await rpc.getSignatureStatuses([sig]).send()
          const status = result.value[0]
          if (status) {
            if (status.err) {
              throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`)
            }
            if (
              status.confirmationStatus === 'confirmed' ||
              status.confirmationStatus === 'finalized'
            ) {
              return
            }
          }
        } catch (error: any) {
          if (error.message?.startsWith('Transaction failed')) throw error
          // RPC hiccup — keep polling
        }
      }
      throw new Error(
        'Transaction confirmation timed out. It may still confirm — check your wallet.',
      )
    },
    [rpc],
  )

  const sendSOL = useCallback(
    async (toAddress: string, amountSOL: number) => {
      if (!publicKey) throw new Error('Wallet not connected')
      setSending(true)
      try {
        // Fetch blockhash
        let blockhashValue: string
        let lastValidBlockHeight: bigint
        try {
          const result = await rpc.getLatestBlockhash().send()
          blockhashValue = result.value.blockhash as string
          lastValidBlockHeight = result.value.lastValidBlockHeight
        } catch {
          throw new Error(
            'Unable to reach the Solana network. Check your connection and try again.',
          )
        }

        // Create noop signer for instruction accounts — MWA does the real signing
        const signer = createNoopSigner(publicKey)

        // Build transaction with kit
        const message = pipe(
          createTransactionMessage({ version: 0 }),
          (msg) => setTransactionMessageFeePayer(publicKey, msg),
          (msg) =>
            setTransactionMessageLifetimeUsingBlockhash(
              {
                blockhash: blockhashValue as ReturnType<typeof import('@solana/kit').blockhash>,
                lastValidBlockHeight,
              },
              msg,
            ),
          (msg) =>
            appendTransactionMessageInstruction(
              getTransferSolInstruction({
                source: signer,
                destination: address(toAddress),
                amount: lamports(BigInt(Math.round(amountSOL * Number(LAMPORTS_PER_SOL)))),
              }),
              msg,
            ),
        )

        const compiledTx = compileTransaction(message)

        // Sign via MWA (sign only, we send ourselves)
        const signedTx = await transact(async (wallet: KitMobileWallet) => {
          await authorizeSession(wallet)
          const signed = await wallet.signTransactions({
            transactions: [compiledTx],
          })
          return signed[0]
        })

        // Send signed tx via RPC
        const base64Tx = getBase64EncodedWireTransaction(signedTx)
        const sigString = (await rpc
          .sendTransaction(base64Tx, { encoding: 'base64' })
          .send()) as string

        // Poll for confirmation
        await confirmTransaction(sigString)

        return sigString
      } catch (error: any) {
        if (
          error.message?.includes('Unable to reach') ||
          error.message?.includes('timed out') ||
          error.message?.includes('Transaction failed')
        ) {
          throw error
        }
        throw new Error(getWalletErrorMessage(error))
      } finally {
        setSending(false)
      }
    },
    [publicKey, rpc, authorizeSession, confirmTransaction],
  )

  const signAndSendTransaction = useCallback(
    async (transactionBytes: Uint8Array) => {
      setSigning(true)
      try {
        // Decode raw wire bytes into a kit Transaction
        const transaction = getTransactionDecoder().decode(transactionBytes)

        // Sign via MWA (sign only, we send ourselves)
        const signedTx = await transact(async (wallet: KitMobileWallet) => {
          await authorizeSession(wallet)
          const signed = await wallet.signTransactions({
            transactions: [transaction],
          })
          return signed[0]
        })

        // Send signed tx via RPC
        const base64Tx = getBase64EncodedWireTransaction(signedTx)
        const sigString = (await rpc
          .sendTransaction(base64Tx, { encoding: 'base64' })
          .send()) as string

        await confirmTransaction(sigString)

        return sigString
      } catch (error: any) {
        if (error.message?.includes('timed out') || error.message?.includes('Transaction failed')) {
          throw error
        }
        throw new Error(getWalletErrorMessage(error))
      } finally {
        setSigning(false)
      }
    },
    [rpc, authorizeSession, confirmTransaction],
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
