import { create } from 'zustand'
import { storage } from '@/lib/storage'

const WATCHLIST_KEY = 'watchlist'

function loadWatchlist(): string[] {
  try {
    const raw = storage.getItem(WATCHLIST_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function saveWatchlist(list: string[]) {
  storage.setItem(WATCHLIST_KEY, JSON.stringify(list))
}

type WatchlistState = {
  watchlist: string[]
  isWatched: (address: string) => boolean
  addToWatchlist: (address: string) => void
  removeFromWatchlist: (address: string) => void
  toggleWatchlist: (address: string) => void
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  watchlist: loadWatchlist(),

  isWatched: (address) => get().watchlist.includes(address),

  addToWatchlist: (address) => {
    const next = [...get().watchlist, address]
    saveWatchlist(next)
    set({ watchlist: next })
  },

  removeFromWatchlist: (address) => {
    const next = get().watchlist.filter((a) => a !== address)
    saveWatchlist(next)
    set({ watchlist: next })
  },

  toggleWatchlist: (address) => {
    if (get().isWatched(address)) {
      get().removeFromWatchlist(address)
    } else {
      get().addToWatchlist(address)
    }
  },
}))
