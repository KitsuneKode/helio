import { create } from 'zustand'

type SwapResetState = {
  resetCount: number
  triggerReset: () => void
}

export const useSwapResetStore = create<SwapResetState>()((set) => ({
  resetCount: 0,
  triggerReset: () => set((s) => ({ resetCount: s.resetCount + 1 })),
}))
