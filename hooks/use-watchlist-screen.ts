import { useCallback, useEffect, useMemo, useState } from 'react'
import { useWatchlistStore } from '@/store/watchlist-store'
import { getMetaDataFromCacheOrFetch } from '@/lib/cache/token-metadata'
import { TokenMetadata } from '@/types'
import { useNetwork } from '@/context/network-context'

const PAGE_SIZE = 10

export type WatchlistToken = { address: string; metadata: TokenMetadata }

export function useWatchlistScreen() {
  const watchlist = useWatchlistStore((s) => s.watchlist)
  const removeFromWatchlist = useWatchlistStore((s) => s.removeFromWatchlist)
  const { network } = useNetwork()
  const [tokens, setTokens] = useState<WatchlistToken[]>([])
  const [wallets, setWallets] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const [tokenPage, setTokenPage] = useState(1)
  const [walletPage, setWalletPage] = useState(1)

  useEffect(() => {
    if (watchlist.length === 0) {
      setTokens([])
      setWallets([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    getMetaDataFromCacheOrFetch({ mints: watchlist, network }).then((metaMap) => {
      if (cancelled) return

      const classifiedTokens: WatchlistToken[] = []
      const classifiedWallets: string[] = []

      for (const addr of watchlist) {
        const meta = metaMap.get(addr)
        if (meta) {
          classifiedTokens.push({ address: addr, metadata: meta })
        } else {
          classifiedWallets.push(addr)
        }
      }

      setTokens(classifiedTokens)
      setWallets(classifiedWallets)
      setTokenPage(1)
      setWalletPage(1)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [watchlist, network])

  const visibleTokens = useMemo(() => tokens.slice(0, tokenPage * PAGE_SIZE), [tokens, tokenPage])

  const visibleWallets = useMemo(
    () => wallets.slice(0, walletPage * PAGE_SIZE),
    [wallets, walletPage],
  )

  const hasMoreTokens = visibleTokens.length < tokens.length
  const hasMoreWallets = visibleWallets.length < wallets.length
  const hasMore = hasMoreTokens || hasMoreWallets

  const loadMore = useCallback(() => {
    if (hasMoreTokens) {
      setTokenPage((p) => p + 1)
    } else if (hasMoreWallets) {
      setWalletPage((p) => p + 1)
    }
  }, [hasMoreTokens, hasMoreWallets])

  const removeItem = useCallback(
    (address: string) => {
      removeFromWatchlist(address)
    },
    [removeFromWatchlist],
  )

  return {
    watchlist,
    visibleTokens,
    visibleWallets,
    loading,
    hasMore,
    loadMore,
    removeItem,
  }
}
