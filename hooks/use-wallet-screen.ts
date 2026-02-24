import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Keyboard } from 'react-native'
import { router } from 'expo-router'
import { useNetwork } from '@/context/network-context'
import {
  GetBalanceResult,
  GetTokensResult,
  GetTransactionsResult,
  GetAllTokensBalanceResult,
} from '@/types'
import { getAllTokens, getAllTransactions, getBalance, isValidPublicKey } from '@/lib/solana'
import { useHistoryStore } from '@/store/history-store'
import { useWalletResetStore } from '@/store/wallet-reset-store'
import { useWalletRefreshStore } from '@/store/wallet-refresh-store'
import { getMetaDataFromCacheOrFetch } from '@/lib/cache/token-metadata'
import { fetchTokenJupiterDetail } from '@/lib/solana/token-details'
import { TOKEN_PAGE, TXN_PAGE } from '@/constants/solana'
const SOL_MINT = '11111111111111111111111111111111'

type WalletData = {
  balance: GetBalanceResult
  allTokens: GetAllTokensBalanceResult[]
  visibleTokens: GetTokensResult
  transactions: GetTransactionsResult
  hasMoreTx: boolean
  solPriceUsd: number | null
}

export function useWalletScreen(initialAddress?: string) {
  const { rpc, network, heliusDevnetRpcUrl } = useNetwork()
  const resetCount = useWalletResetStore((s) => s.resetCount)
  const refreshCount = useWalletRefreshStore((s) => s.refreshCount)
  const autoSearchDone = useRef(false)
  const mountedRef = useRef(true)

  const [value, setValue] = useState<string>(initialAddress ?? '')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMoreTxn, setLoadingMoreTxn] = useState(false)
  const [loadingMoreTkn, setLoadingMoreTkn] = useState(false)
  const [walletData, setWalletData] = useState<WalletData | null>(null)

  const hasSearched = walletData !== null
  const hasMoreTokens = walletData
    ? walletData.visibleTokens.length < walletData.allTokens.length
    : false
  const canShowLess = walletData ? walletData.visibleTokens.length > TOKEN_PAGE : false

  const patchVisible = (tokens: GetTokensResult) =>
    setWalletData((prev) => (prev ? { ...prev, visibleTokens: tokens } : prev))

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Clear and refetch for new network — never show cross-network stale data
  const prevNetworkRef = useRef(network)
  useEffect(() => {
    if (network === prevNetworkRef.current) return
    prevNetworkRef.current = network

    const addr = value.trim()
    setWalletData(null)
    if (addr) {
      handleSearchAddress(addr)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network])

  // Clear when Home tab is re-pressed (via reset signal)
  const initialResetCount = useRef(resetCount)
  useEffect(() => {
    if (resetCount !== initialResetCount.current) {
      setValue('')
      setWalletData(null)
    }
  }, [resetCount])

  // Refresh data when triggered (e.g. after sending SOL)
  const initialRefreshCount = useRef(refreshCount)
  useEffect(() => {
    if (refreshCount !== initialRefreshCount.current) {
      const addr = value.trim()
      if (addr && walletData) {
        handleSearchAddress(addr, { silent: true })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshCount])

  const resetResults = () => setWalletData(null)

  const handleChangeValue = (text: string) => setValue(text)

  const handleClear = () => {
    setValue('')
    resetResults()
  }

  const handleSearchAddress = useCallback(
    async (addr: string, options?: { silent?: boolean }) => {
      const { success, address: publicKey } = isValidPublicKey(addr)
      if (!success) return Alert.alert('Validation Error', 'Please enter a valid public key')

      Keyboard.dismiss()
      if (!options?.silent) setLoading(true)
      try {
        const [bal, tokn, txns, solDetail] = await Promise.all([
          getBalance(rpc, publicKey),
          getAllTokens(rpc, publicKey),
          getAllTransactions(rpc, publicKey),
          fetchTokenJupiterDetail(SOL_MINT, network, heliusDevnetRpcUrl || undefined),
        ])

        console.log('token', tokn)
        const firstPage = tokn.slice(0, TOKEN_PAGE)

        setWalletData({
          balance: bal,
          allTokens: tokn,
          visibleTokens: firstPage,
          transactions: txns,
          hasMoreTx: txns.length === TXN_PAGE,
          solPriceUsd: solDetail.priceUsd,
        })

        useHistoryStore.getState().trackWallet(addr, network)

        if (firstPage.length > 0) {
          const metaMap = await getMetaDataFromCacheOrFetch({
            mints: firstPage.map((t) => t.mint),
            network,
            heliusRpcUrl: heliusDevnetRpcUrl || undefined,
          })
          if (!mountedRef.current) return
          patchVisible(firstPage.map((t) => ({ ...t, ...metaMap.get(t.mint) })))
        }
      } catch (err) {
        console.error('Error fetching data:', err as Error)
        Alert.alert('Something went Wrong', 'Failed to fetch data. Please try again later.')
      } finally {
        setLoading(false)
      }
    },
    [rpc, network, heliusDevnetRpcUrl],
  )

  const handleRefresh = useCallback(async () => {
    const addr = value.trim()
    if (!addr) return
    setRefreshing(true)
    try {
      await handleSearchAddress(addr, { silent: true })
    } finally {
      setRefreshing(false)
    }
  }, [value, handleSearchAddress])

  const handleSearch = async () => {
    const addr = value.trim()

    if (!addr) {
      setValue(addr)
      return Alert.alert('Validation Error', 'Please enter a public key')
    }

    await handleSearchAddress(addr)
  }

  const handleLoadMoreTransactions = async () => {
    if (!walletData) return
    const lastSig = walletData.transactions[walletData.transactions.length - 1]?.signature
    if (!lastSig) return

    const { success, address: publicKey } = isValidPublicKey(value.trim())
    if (!success) return

    setLoadingMoreTxn(true)
    try {
      const more = await getAllTransactions(rpc, publicKey, lastSig)
      setWalletData((prev) =>
        prev
          ? {
              ...prev,
              transactions: [...prev.transactions, ...more],
              hasMoreTx: more.length === TXN_PAGE,
            }
          : prev,
      )
    } catch (err) {
      console.error('Load more transactions error:', (err as Error).message)
    } finally {
      setLoadingMoreTxn(false)
    }
  }

  const handleLoadMoreTokens = async () => {
    if (!walletData) return
    setLoadingMoreTkn(true)
    const from = walletData.visibleTokens.length
    const nextSlice = walletData.allTokens.slice(from, from + TOKEN_PAGE)
    if (nextSlice.length === 0) {
      setLoadingMoreTkn(false)
      return
    }

    setWalletData((prev) =>
      prev ? { ...prev, visibleTokens: [...prev.visibleTokens, ...nextSlice] } : prev,
    )
    try {
      const metaMap = await getMetaDataFromCacheOrFetch({
        mints: nextSlice.map((t) => t.mint),
        network,
        heliusRpcUrl: heliusDevnetRpcUrl || undefined,
      })

      setWalletData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          visibleTokens: [
            ...prev.visibleTokens.slice(0, from),
            ...nextSlice.map((t) => ({ ...t, ...metaMap.get(t.mint) })),
          ],
        }
      })
    } catch (err) {
      console.error('Load more tokens metadata error:', (err as Error).message)
      Alert.alert('Error', 'Failed to load more tokens metadata. Please try again later.')
    } finally {
      setLoadingMoreTkn(false)
    }
  }

  const handleShowLessTokens = () => {
    if (!walletData) return
    patchVisible(walletData.visibleTokens.slice(0, TOKEN_PAGE))
  }

  const handleTokenPress = (token: GetTokensResult[number]) => {
    router.push({
      pathname: '/token/[mint]',
      params: {
        mint: token.mint,
        amount: String(token.amount),
        tokenName: token.tokenName ?? '',
        symbol: token.symbol ?? '',
        logoURI: token.logoURI ?? '',
      },
    })
  }

  const handleTransactionPress = (signature: string) => {
    router.push({ pathname: '/transaction/[signature]', params: { signature } })
  }
  // Auto-search when navigated with an address param
  useEffect(() => {
    if (initialAddress && !autoSearchDone.current) {
      autoSearchDone.current = true
      setValue(initialAddress)
      const timer = setTimeout(() => {
        handleSearchAddress(initialAddress)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [initialAddress, handleSearchAddress])

  return {
    value,
    loading,
    refreshing,
    loadingMoreTxn,
    loadingMoreTkn,
    walletData,
    hasSearched,
    hasMoreTokens,
    canShowLess,
    handleChangeValue,
    handleClear,
    handleSearch,
    handleRefresh,
    handleLoadMoreTransactions,
    handleLoadMoreTokens,
    handleShowLessTokens,
    handleTokenPress,
    handleTransactionPress,
    handleQuickSearch: (address: string) => {
      setValue(address)
      handleSearchAddress(address)
    },
  }
}

export type UseWalletScreenResult = ReturnType<typeof useWalletScreen>
