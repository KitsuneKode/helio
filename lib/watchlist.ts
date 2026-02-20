// import { createMMKV } from 'react-native-mmkv'
//
// const WATCHLIST_KEY = 'watchlist_v1'
// const storage = createMMKV({ id: 'watchlist' })
//
// export const getWatchlist = (): string[] => {
//   const raw = storage.getString(WATCHLIST_KEY)
//   if (!raw) return []
//   try {
//     return JSON.parse(raw) as string[]
//   } catch {
//     return []
//   }
// }
//
// export const isWatched = (address: string): boolean => {
//   return getWatchlist().includes(address)
// }
//
// export const toggleWatchlist = (address: string): boolean => {
//   const list = getWatchlist()
//   const idx = list.indexOf(address)
//   if (idx === -1) {
//     list.push(address)
//     storage.set(WATCHLIST_KEY, JSON.stringify(list))
//     return true
//   } else {
//     list.splice(idx, 1)
//     storage.set(WATCHLIST_KEY, JSON.stringify(list))
//     return false
//   }
// }
