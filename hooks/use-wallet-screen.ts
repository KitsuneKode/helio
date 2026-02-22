import { useEffect, useState } from 'react'
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
import { getMetaDataFromCacheOrFetch } from '@/lib/cache/token-metadata'
import { TOKEN_PAGE, TXN_PAGE } from '@/constants/solana'

type WalletData = {
  balance: GetBalanceResult
  allTokens: GetAllTokensBalanceResult[]
  visibleTokens: GetTokensResult
  transactions: GetTransactionsResult
  hasMoreTx: boolean
}

export function useWalletScreen() {
  const { rpc, network } = useNetwork()

  const [value, setValue] = useState<string>('')
  const [loading, setLoading] = useState(false)
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
    setValue('')
    setWalletData(null)
  }, [network])

  const resetResults = () => setWalletData(null)

  const handleChangeValue = (text: string) => setValue(text)

  const handleClear = () => {
    setValue('')
    resetResults()
  }

  const handleSearch = async () => {
    const addr = value.trim()

    if (!addr) {
      setValue(addr)
      return Alert.alert('Validation Error', 'Please enter a public key')
    }

    const { success, address: publicKey } = isValidPublicKey(addr)
    if (!success) return Alert.alert('Validation Error', 'Please enter a valid public key')

    Keyboard.dismiss()
    setLoading(true)
    try {
      const [bal, tokn, txns] = await Promise.all([
        getBalance(rpc, publicKey),
        getAllTokens(rpc, publicKey),
        getAllTransactions(rpc, publicKey),
      ])

      const firstPage = tokn.slice(0, TOKEN_PAGE)

      setWalletData({
        balance: bal,
        allTokens: tokn,
        visibleTokens: firstPage,
        transactions: txns,
        hasMoreTx: txns.length === TXN_PAGE,
      })

      if (firstPage.length > 0) {
        getMetaDataFromCacheOrFetch(firstPage.map((t) => t.mint)).then((metaMap) => {
          patchVisible(firstPage.map((t) => ({ ...t, ...metaMap.get(t.mint) })))
        })
      }
    } catch (err) {
      console.error('Error fetching data:', err as Error)
      Alert.alert('Something went Wrong', 'Failed to fetch data. Please try again later.')
    } finally {
      setLoading(false)
    }
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
      const metaMap = await getMetaDataFromCacheOrFetch(nextSlice.map((t) => t.mint))

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

  return {
    value,
    loading,
    loadingMoreTxn,
    loadingMoreTkn,
    walletData,
    hasSearched,
    hasMoreTokens,
    canShowLess,
    handleChangeValue,
    handleClear,
    handleSearch,
    handleLoadMoreTransactions,
    handleLoadMoreTokens,
    handleShowLessTokens,
    handleTokenPress,
    handleTransactionPress,
  }
}

export type UseWalletScreenResult = ReturnType<typeof useWalletScreen>
