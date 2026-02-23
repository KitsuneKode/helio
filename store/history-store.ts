import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { storage } from '@/lib/storage'
import { HISTORY_STORAGE_KEY, MAX_TOKENS, MAX_WALLETS } from '@/constants/history'

type HistoryTokenEntry = {
  type: 'token'
  mint: string
  timestamp: number
}

type HistoryWalletEntry = {
  type: 'wallet'
  address: string
  timestamp: number
}

type HistoryState = {
  tokens: HistoryTokenEntry[]
  wallets: HistoryWalletEntry[]
  trackToken: (mint: string) => void
  trackWallet: (address: string) => void
  clearAll: () => void
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      tokens: [],
      wallets: [],

      trackToken: (mint) => {
        const filtered = get().tokens.filter((e) => e.mint !== mint)
        const updated = [
          { type: 'token' as const, mint, timestamp: Date.now() },
          ...filtered,
        ].slice(0, MAX_TOKENS) satisfies HistoryTokenEntry[]
        set({ tokens: updated })
      },

      trackWallet: (address) => {
        const filtered = get().wallets.filter((e) => e.address !== address)
        const updated: HistoryWalletEntry[] = [
          { type: 'wallet' as const, address, timestamp: Date.now() },
          ...filtered,
        ].slice(0, MAX_WALLETS)
        set({ wallets: updated })
      },

      clearAll: () => {
        set({ tokens: [], wallets: [] })
      },
    }),
    {
      name: HISTORY_STORAGE_KEY,
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        tokens: state.tokens,
        wallets: state.wallets,
      }),
    },
  ),
)
