import { create } from 'zustand'

type WalletRefreshState = {
  refreshCount: number
  triggerRefresh: () => void
}

export const useWalletRefreshStore = create<WalletRefreshState>()((set) => ({
  refreshCount: 0,
  triggerRefresh: () => set((s) => ({ refreshCount: s.refreshCount + 1 })),
}))
