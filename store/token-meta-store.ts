import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { StateStorage } from 'zustand/middleware'
import { createMMKV } from 'react-native-mmkv'
import { getAllTokenMetadataFromJupiter, type SolanaRpc } from '@/lib/solana'

export type TokenMeta = { tokenName?: string; symbol?: string; logoURI?: string }

// MMKV storage adapter for Zustand persist middleware
const mmkv = createMMKV({ id: 'token-meta-v1' })

const mmkvStorage: StateStorage = {
  getItem: (name) => mmkv.getString(name) ?? null,
  setItem: (name, value) => mmkv.set(name, value),
  removeItem: (name) => mmkv.remove(name),
}

type TokenMetaState = {
  cache: Record<string, TokenMeta>
  fetching: Record<string, boolean>
  fetchBatch: (rpc: SolanaRpc, mints: string[]) => Promise<Map<string, TokenMeta>>
}

export const useTokenMetaStore = create<TokenMetaState>()(
  persist(
    (set, get) => ({
      cache: {},
      fetching: {},

      fetchBatch: async (rpc, mints) => {
        const { cache, fetching } = get()
        const result = new Map<string, TokenMeta>()
        const toFetch: string[] = []

        for (const mint of mints) {
          if (cache[mint]) {
            result.set(mint, cache[mint])
          } else if (!fetching[mint]) {
            toFetch.push(mint)
          }
        }

        if (toFetch.length > 0) {
          set((s) => ({
            fetching: { ...s.fetching, ...Object.fromEntries(toFetch.map((m) => [m, true])) },
          }))

          try {
            const metaMap = await getAllTokenMetadataFromJupiter(toFetch)
            const newEntries: Record<string, TokenMeta> = {}

            for (const [mint, meta] of metaMap) {
              const entry: TokenMeta = {
                tokenName: meta.tokenName || undefined,
                symbol: meta.symbol || undefined,
                logoURI: meta.logoURI || undefined,
              }
              newEntries[mint] = entry
              result.set(mint, entry)
            }

            set((s) => {
              const updatedFetching = { ...s.fetching }
              for (const m of toFetch) delete updatedFetching[m]
              return { cache: { ...s.cache, ...newEntries }, fetching: updatedFetching }
            })
          } catch (err) {
            console.warn('fetchBatch: Jupiter fetch failed', err)
            set((s) => {
              const updatedFetching = { ...s.fetching }
              for (const m of toFetch) delete updatedFetching[m]
              return { fetching: updatedFetching }
            })
          }
        }

        // Pick up any mints resolved by a concurrent fetchBatch
        const finalCache = get().cache
        for (const mint of mints) {
          if (!result.has(mint) && finalCache[mint]) {
            result.set(mint, finalCache[mint])
          }
        }

        return result
      },
    }),
    {
      name: 'token-meta',
      storage: createJSONStorage(() => mmkvStorage),
      // Only persist the cache — fetching is runtime state
      partialize: (state) => ({ cache: state.cache }),
    },
  ),
)
