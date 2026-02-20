import { SafeAreaViewUniwind } from '@/components/styled-uniwind-components'
import { ThemeToggle } from '@/components/theme-toggle-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LabelUniwind } from '@/components/ui/label'
import { Text } from '@/components/ui/text'
import { HeaderText } from '@/components/wallet-screen/header'
import { BalanceCard } from '@/components/wallet-screen/balance-card'
import { TransactionListItem } from '@/components/wallet-screen/transaction-list-item'
import { TokenListItem } from '@/components/wallet-screen/token-list-item'
import { WalletPrompt } from '@/components/wallet-screen/wallet-prompt'
import { EmptyTokens } from '@/components/wallet-screen/empty-tokens'
import { EmptyTransactions } from '@/components/wallet-screen/empty-transactions'
import { NetworkToggle } from '@/components/wallet-screen/network-toggle'
import { SearchLoading } from '@/components/wallet-screen/search-loading'
import { BackToTopButton } from '@/components/wallet-screen/back-to-top-button'
import { useNetwork } from '@/context/network-context'
import type {
  GetBalanceResult,
  GetTokensResult,
  GetTransactionsResult,
  TokenBalance,
} from '@/lib/solana'
import {
  getAllTokens,
  getAllTransactions,
  getBalance,
  isValidPublicKey,
  TX_PAGE_SIZE,
} from '@/lib/solana'
import { useTokenMetaStore } from '@/store/token-meta-store'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native'
import { useSharedValue } from 'react-native-reanimated'

const TOKEN_PAGE = 10

const TransactionScreen = () => {
  const { rpc, network } = useNetwork()
  const fetchBatch = useTokenMetaStore((s) => s.fetchBatch)
  const scrollRef = useRef<ScrollView>(null)
  const scrollY = useSharedValue(0)

  const [value, setValue] = useState<string>('')
  const [balance, setBalance] = useState<GetBalanceResult | null>(null)
  const [allTokens, setAllTokens] = useState<TokenBalance[]>([])
  const [visibleTokens, setVisibleTokens] = useState<GetTokensResult>([])
  const [loadingTokenMeta, setLoadingTokenMeta] = useState(false)
  const [transactions, setTransactions] = useState<GetTransactionsResult>([])
  const [hasMoreTx, setHasMoreTx] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const hasMoreTokens = visibleTokens.length < allTokens.length
  const canShowLess = visibleTokens.length > TOKEN_PAGE

  // Reset everything when the user switches networks
  useEffect(() => {
    setValue('')
    setBalance(null)
    setAllTokens([])
    setVisibleTokens([])
    setTransactions([])
    setHasMoreTx(false)
    setHasSearched(false)
  }, [network])

  const resetResults = () => {
    setBalance(null)
    setAllTokens([])
    setVisibleTokens([])
    setTransactions([])
    setHasMoreTx(false)
    setHasSearched(false)
  }

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

      setBalance(bal)
      setAllTokens(tokn)
      setTransactions(txns)
      setHasMoreTx(txns.length === TX_PAGE_SIZE)
      setHasSearched(true)

      // Load first page of metadata
      const firstPage = tokn.slice(0, TOKEN_PAGE)
      if (firstPage.length > 0) {
        setLoadingTokenMeta(true)
        try {
          const metaMap = await fetchBatch(rpc, firstPage.map((t) => t.mint))
          setVisibleTokens(firstPage.map((t) => ({ ...t, ...metaMap.get(t.mint) })))
        } finally {
          setLoadingTokenMeta(false)
        }
      } else {
        setVisibleTokens([])
      }
    } catch (err) {
      console.error('Error fetching data:', err as Error)
      Alert.alert('Something went Wrong', 'Failed to fetch data. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMoreTransactions = async () => {
    const lastSig = transactions[transactions.length - 1]?.signature
    if (!lastSig) return

    const { success, address: publicKey } = isValidPublicKey(value.trim())
    if (!success) return

    setLoadingMore(true)
    try {
      const more = await getAllTransactions(rpc, publicKey, lastSig)
      setTransactions((prev) => [...prev, ...more])
      setHasMoreTx(more.length === TX_PAGE_SIZE)
    } catch (err) {
      console.error('Load more transactions error:', (err as Error).message)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleLoadMoreTokens = async () => {
    const nextSlice = allTokens.slice(visibleTokens.length, visibleTokens.length + TOKEN_PAGE)
    if (nextSlice.length === 0) return
    setLoadingTokenMeta(true)
    try {
      const metaMap = await fetchBatch(rpc, nextSlice.map((t) => t.mint))
      setVisibleTokens((prev) => [...prev, ...nextSlice.map((t) => ({ ...t, ...metaMap.get(t.mint) }))])
    } catch (err) {
      console.error('Load more tokens error:', err)
    } finally {
      setLoadingTokenMeta(false)
    }
  }

  const handleShowLessTokens = () => {
    setVisibleTokens((prev) => prev.slice(0, TOKEN_PAGE))
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

  return (
    <SafeAreaViewUniwind className="bg-background flex-1" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          className="flex-1 px-5"
          scrollEventThrottle={16}
          onScroll={(e) => {
            scrollY.value = e.nativeEvent.contentOffset.y
          }}>
          {/* Header */}
          <View className="mt-4 flex-row items-center justify-between pb-6">
            <HeaderText />
            <View className="flex-row items-center gap-1">
              <NetworkToggle />
              <ThemeToggle />
            </View>
          </View>

          {/* Search */}
          <View className="flex-1 gap-4">
            <View className="flex-1 gap-2">
              <LabelUniwind
                className="text-muted-foreground/75 mx-2 text-[1.25rem]"
                htmlFor="input"
                nativeID="input">
                Enter a wallet address
              </LabelUniwind>
              <Input
                id="input"
                className="border-input ring-muted h-14 ring-1"
                placeholder="83astBRguLMdt2h...."
                value={value}
                onChangeText={handleChangeValue}
                returnKeyType="done"
                enablesReturnKeyAutomatically
                onSubmitEditing={handleSearch}
              />
            </View>
            <View className="flex-row gap-4">
              <Button className="h-12 flex-1" onPress={handleSearch} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-background text-xl">Search</Text>
                )}
              </Button>
              <Button
                className="border-input ring-muted h-12 px-10 ring-1"
                variant="outline"
                disabled={loading}
                onPress={handleClear}>
                <Text className="text-xl">Clear</Text>
              </Button>
            </View>
          </View>

          {/* Results */}
          {loading ? (
            <SearchLoading />
          ) : !hasSearched ? (
            <WalletPrompt />
          ) : (
            <>
              {balance !== null && (
                <BalanceCard balance={balance.balance} address={balance.address} />
              )}

              {/* Tokens */}
              <FlatList
                ListHeaderComponent={
                  <View className="pt-6 pb-2">
                    <Text variant="large" className="text-foreground">
                      Tokens
                    </Text>
                  </View>
                }
                ListEmptyComponent={<EmptyTokens />}
                ListFooterComponent={
                  hasMoreTokens || canShowLess ? (
                    <View className="border-border mx-1 flex-row border-t">
                      {canShowLess && (
                        <Pressable
                          onPress={handleShowLessTokens}
                          className="flex-1 items-center py-3 active:opacity-60">
                          <Text variant="small" className="text-muted-foreground">
                            Show less
                          </Text>
                        </Pressable>
                      )}
                      {canShowLess && hasMoreTokens && (
                        <View className="bg-border w-px" />
                      )}
                      {hasMoreTokens && (
                        <Pressable
                          onPress={handleLoadMoreTokens}
                          disabled={loadingTokenMeta}
                          className="flex-1 items-center py-3 active:opacity-60">
                          {loadingTokenMeta ? (
                            <ActivityIndicator size="small" />
                          ) : (
                            <Text variant="small" className="text-primary">
                              Load {Math.min(TOKEN_PAGE, allTokens.length - visibleTokens.length)} more
                            </Text>
                          )}
                        </Pressable>
                      )}
                    </View>
                  ) : null
                }
                scrollEnabled={false}
                keyExtractor={(item) => item.mint}
                data={visibleTokens}
                renderItem={({ item, index }) => (
                  <>
                    {index !== 0 && <View className="bg-border mx-1 h-px" />}
                    <TokenListItem item={item} onPress={handleTokenPress} />
                  </>
                )}
              />

              {/* Transactions */}
              <FlatList
                ListHeaderComponent={
                  <View className="pt-6 pb-2">
                    <Text variant="large" className="text-foreground">
                      Recent Transactions
                    </Text>
                  </View>
                }
                ListEmptyComponent={<EmptyTransactions />}
                ListFooterComponent={
                  hasMoreTx ? (
                    <Pressable
                      onPress={handleLoadMoreTransactions}
                      disabled={loadingMore}
                      className="active:opacity-60">
                      <View className="border-border mx-1 items-center border-t py-3">
                        {loadingMore ? (
                          <ActivityIndicator size="small" />
                        ) : (
                          <Text variant="small" className="text-primary">
                            Load more
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  ) : null
                }
                scrollEnabled={false}
                keyExtractor={(item) => item.signature}
                data={transactions}
                renderItem={({ item, index }) => (
                  <>
                    {index !== 0 && <View className="bg-border mx-1 h-px" />}
                    <TransactionListItem item={item} onPress={handleTransactionPress} />
                  </>
                )}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating back-to-top button */}
      <BackToTopButton scrollY={scrollY} scrollRef={scrollRef} />
    </SafeAreaViewUniwind>
  )
}

export default TransactionScreen
