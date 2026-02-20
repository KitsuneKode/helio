// import { create } from 'zustand'
// import { getWatchlist, toggleWatchlist as mmkvToggle, isWatched } from '@/lib/watchlist'
//
// type WatchlistStore = {
//   watchlist: string[]
//   isWatched: (address: string) => boolean
//   toggle: (address: string) => boolean
// }
//
// export const useWatchlistStore = create<WatchlistStore>((set, get) => ({
//   watchlist: getWatchlist(),
//
//   isWatched: (address: string) => get().watchlist.includes(address),
//
//   toggle: (address: string) => {
//     const added = mmkvToggle(address)
//     set({ watchlist: getWatchlist() })
//     return added
//   },
// }))
