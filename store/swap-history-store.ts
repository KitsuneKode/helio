import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { storage } from '@/lib/storage'
import { MAX_SWAP_ENTRIES, SWAP_HISTORY_STORAGE_KEY } from '@/constants/history'
import type { Network } from '@/context/network-context'
import type { Token } from '@/types'

export type SwapHistoryEntry = {
  id: string
  fromToken: Token
  toToken: Token
  fromAmount: string
  toAmount: string
  timestamp: number
  status: 'success' | 'failed'
  signature: string | null
}

type NetworkSwapHistory = {
  entries: SwapHistoryEntry[]
}

const emptyHistory: NetworkSwapHistory = { entries: [] }

type SwapHistoryState = {
  data: Record<Network, NetworkSwapHistory>
  addSwapEntry: (entry: SwapHistoryEntry, network: Network) => void
  clearSwapHistory: (network: Network) => void
}

export const useSwapHistoryStore = create<SwapHistoryState>()(
  persist(
    (set, get) => ({
      data: {
        mainnet: { ...emptyHistory },
        devnet: { ...emptyHistory },
      },

      addSwapEntry: (entry, network) => {
        const current = get().data[network]
        const filtered = entry.signature
          ? current.entries.filter((e) => e.signature !== entry.signature)
          : current.entries
        const updated = [entry, ...filtered].slice(0, MAX_SWAP_ENTRIES)
        set({
          data: { ...get().data, [network]: { entries: updated } },
        })
      },

      clearSwapHistory: (network) => {
        set({
          data: { ...get().data, [network]: { ...emptyHistory } },
        })
      },
    }),
    {
      name: SWAP_HISTORY_STORAGE_KEY,
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({ data: state.data }),
    },
  ),
)
