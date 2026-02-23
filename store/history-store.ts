import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { storage } from '@/lib/storage'
import { HISTORY_STORAGE_KEY, MAX_TOKENS, MAX_WALLETS } from '@/constants/history'
import type { Network } from '@/context/network-context'

export type HistoryTokenEntry = {
  type: 'token'
  mint: string
  timestamp: number
}

export type HistoryWalletEntry = {
  type: 'wallet'
  address: string
  timestamp: number
}

type NetworkHistory = {
  tokens: HistoryTokenEntry[]
  wallets: HistoryWalletEntry[]
}

const emptyHistory: NetworkHistory = { tokens: [], wallets: [] }

type HistoryState = {
  data: Record<Network, NetworkHistory>
  trackToken: (mint: string, network: Network) => void
  trackWallet: (address: string, network: Network) => void
  clearAll: (network: Network) => void
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      data: {
        mainnet: { ...emptyHistory },
        devnet: { ...emptyHistory },
      },

      trackToken: (mint, network) => {
        const current = get().data[network]
        const filtered = current.tokens.filter((e) => e.mint !== mint)
        const updated = [
          { type: 'token' as const, mint, timestamp: Date.now() },
          ...filtered,
        ].slice(0, MAX_TOKENS) satisfies HistoryTokenEntry[]
        set({
          data: { ...get().data, [network]: { ...current, tokens: updated } },
        })
      },

      trackWallet: (address, network) => {
        const current = get().data[network]
        const filtered = current.wallets.filter((e) => e.address !== address)
        const updated: HistoryWalletEntry[] = [
          { type: 'wallet' as const, address, timestamp: Date.now() },
          ...filtered,
        ].slice(0, MAX_WALLETS)
        set({
          data: { ...get().data, [network]: { ...current, wallets: updated } },
        })
      },

      clearAll: (network) => {
        set({
          data: { ...get().data, [network]: { ...emptyHistory } },
        })
      },
    }),
    {
      name: HISTORY_STORAGE_KEY,
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({ data: state.data }),
    },
  ),
)
