// import { createMMKV } from 'react-native-mmkv'
// import { MMKV_TOKEN_METADATA_ID } from '@/constants/cache'
//
// export type TokenMetadata = {
//   name: string
//   symbol: string
//   logoURI?: string
//   decimals?: number
// }
//
// const storage = createMMKV({
//   id: MMKV_TOKEN_METADATA_ID,
//   encryptionKey: 'hunter2',
//   mode: 'multi-process',
// })
//
// export const getCachedTokenMeta = (mint: string): TokenMetadata | null => {
//   const raw = storage.getString(`meta_${mint}`)
//   if (!raw) return null
//   try {
//     return JSON.parse(raw) as TokenMetadata
//   } catch {
//     return null
//   }
// }
//
// export const setCachedTokenMeta = (mint: string, meta: TokenMetadata): void => {
//   storage.set(`meta_${mint}`, JSON.stringify(meta))
// }
