import { createContext, useContext, useMemo, useState } from 'react'
import { createSolanaRpc } from '@solana/kit'
import config from '@/config'

export type Network = 'mainnet' | 'devnet'

const RPC_URLS: Record<Network, string> = {
  mainnet: config.EXPO_PUBLIC_MAIN_NET_RPC_URL,
  devnet: config.EXPO_PUBLIC_DEV_NET_RPC_URL,
}

type NetworkContextValue = {
  network: Network
  rpc: ReturnType<typeof createSolanaRpc>
  toggleNetwork: () => void
}

const NetworkContext = createContext<NetworkContextValue | null>(null)

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [network, setNetwork] = useState<Network>('mainnet')
  const rpc = useMemo(() => createSolanaRpc(RPC_URLS[network]), [network])

  const toggleNetwork = () => {
    setNetwork((prev) => (prev === 'mainnet' ? 'devnet' : 'mainnet'))
  }

  return (
    <NetworkContext.Provider value={{ network, rpc, toggleNetwork }}>
      {children}
    </NetworkContext.Provider>
  )
}

export function useNetwork() {
  const ctx = useContext(NetworkContext)
  if (!ctx) throw new Error('useNetwork must be used within NetworkProvider')
  return ctx
}
