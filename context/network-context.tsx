import { createContext, useContext, useMemo, useState } from 'react'
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit'
import { clusterApiUrl } from '@solana/web3.js'
import { storage } from '@/lib/storage'

export type Network = 'mainnet' | 'devnet'

const STORAGE_KEYS = {
  mainnet: 'rpc-url-mainnet',
  devnet: 'rpc-url-devnet',
  heliusDevnet: 'rpc-url-helius-devnet',
} as const

type NetworkContextValue = {
  network: Network
  rpc: ReturnType<typeof createSolanaRpc>
  rpcSubscriptions: ReturnType<typeof createSolanaRpcSubscriptions>
  toggleNetwork: () => void
  customMainnetRpc: string
  customDevnetRpc: string
  heliusDevnetRpcUrl: string
  hasHeliusRpc: boolean
  setCustomMainnetRpc: (url: string) => void
  setCustomDevnetRpc: (url: string) => void
  setHeliusDevnetRpcUrl: (url: string) => void
}

const NetworkContext = createContext<NetworkContextValue | null>(null)

function loadUrl(key: string): string {
  return storage.getItem(key) ?? ''
}

function saveUrl(key: string, url: string) {
  const trimmed = url.trim()
  if (trimmed) {
    storage.setItem(key, trimmed)
  } else {
    storage.removeItem(key)
  }
  return trimmed
}

const RPC_SUBSCRIPTIONS_URLS = {
  mainnet: 'wss://api.mainnet-beta.solana.com',
  devnet: 'wss://api.devnet.solana.com',
}

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [network, setNetwork] = useState<Network>('mainnet')
  const [customMainnetRpc, setCustomMainnetRpcState] = useState(() => loadUrl(STORAGE_KEYS.mainnet))
  const [customDevnetRpc, setCustomDevnetRpcState] = useState(() => loadUrl(STORAGE_KEYS.devnet))
  const [heliusDevnetRpcUrl, setHeliusDevnetRpcUrlState] = useState(() =>
    loadUrl(STORAGE_KEYS.heliusDevnet),
  )

  // Always have an RPC — fall back to Solana's public cluster URL
  const mainnetRpcUrl = customMainnetRpc || clusterApiUrl('mainnet-beta')
  const devnetRpcUrl = customDevnetRpc || clusterApiUrl('devnet')
  const hasHeliusRpc = heliusDevnetRpcUrl.length > 0

  const effectiveUrl = network === 'mainnet' ? mainnetRpcUrl : devnetRpcUrl
  const rpcSubscriptionsUrl =
    network === 'mainnet' ? RPC_SUBSCRIPTIONS_URLS.mainnet : RPC_SUBSCRIPTIONS_URLS.devnet
  const rpc = useMemo(() => createSolanaRpc(effectiveUrl), [effectiveUrl])

  const rpcSubscriptions = useMemo(
    () => createSolanaRpcSubscriptions(rpcSubscriptionsUrl),
    [rpcSubscriptionsUrl],
  )
  const toggleNetwork = () => {
    setNetwork((prev) => (prev === 'mainnet' ? 'devnet' : 'mainnet'))
  }

  const setCustomMainnetRpc = (url: string) => {
    setCustomMainnetRpcState(saveUrl(STORAGE_KEYS.mainnet, url))
  }

  const setCustomDevnetRpc = (url: string) => {
    setCustomDevnetRpcState(saveUrl(STORAGE_KEYS.devnet, url))
  }

  const setHeliusDevnetRpcUrl = (url: string) => {
    setHeliusDevnetRpcUrlState(saveUrl(STORAGE_KEYS.heliusDevnet, url))
  }

  return (
    <NetworkContext.Provider
      value={{
        network,
        rpc,
        rpcSubscriptions,
        toggleNetwork,
        customMainnetRpc,
        customDevnetRpc,
        heliusDevnetRpcUrl,
        hasHeliusRpc,
        setCustomMainnetRpc,
        setCustomDevnetRpc,
        setHeliusDevnetRpcUrl,
      }}
    >
      {children}
    </NetworkContext.Provider>
  )
}

export function useNetwork() {
  const ctx = useContext(NetworkContext)
  if (!ctx) throw new Error('useNetwork must be used within NetworkProvider')
  return ctx
}
