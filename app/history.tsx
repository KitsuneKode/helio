import { useCallback, useEffect, useRef, useState } from 'react'
import { FlatList, Image, Pressable, ScrollView, View } from 'react-native'
import { router } from 'expo-router'
import { ArrowLeft01Icon, Coins01Icon, Wallet01Icon } from '@hugeicons/core-free-icons'
import { SafeAreaViewUniwind } from '@/components/styled-uniwind-components'
import { Text } from '@/components/ui/text'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { Separator } from '@/components/ui/separator'
import { SectionLabel } from '@/components/ui/section-label'
import { AnimatedCard } from '@/components/ui/animated-card'
import { ThemeToggle } from '@/components/theme-toggle-button'
import { useHistoryStore } from '@/store/history-store'
import { useNetwork } from '@/context/network-context'
import { getMetaDataFromCacheOrFetch } from '@/lib/cache/token-metadata'
import { short } from '@/utils/format-text'
import type { TokenMetadata } from '@/types'
import { BackToTopButton } from '@/components/back-to-top-button'
import { useSharedValue } from 'react-native-reanimated'

type SectionHeader = { type: 'section-header'; label: string; key: string }
type TokenRow = { type: 'token'; mint: string; metadata?: TokenMetadata; key: string }
type WalletRow = { type: 'wallet'; address: string; key: string }
type ListItem = SectionHeader | TokenRow | WalletRow

export default function HistoryScreen() {
  const { network } = useNetwork()
  const tokens = useHistoryStore((s) => s.data[network].tokens)
  const wallets = useHistoryStore((s) => s.data[network].wallets)
  const clearAll = useHistoryStore((s) => s.clearAll)

  const [metaMap, setMetaMap] = useState<Map<string, TokenMetadata>>(new Map())

  const scrollRef = useRef<ScrollView>(null)
  const scrollY = useSharedValue(0)

  useEffect(() => {
    if (tokens.length === 0) return
    let cancelled = false
    getMetaDataFromCacheOrFetch({ mints: tokens.map((t) => t.mint), network }).then((map) => {
      if (!cancelled) setMetaMap(map)
    })
    return () => {
      cancelled = true
    }
  }, [tokens])

  const data: ListItem[] = []

  if (tokens.length > 0) {
    data.push({ type: 'section-header', label: 'Recently Viewed Tokens', key: 'sh-tokens' })
    for (const t of tokens) {
      data.push({ type: 'token', mint: t.mint, metadata: metaMap.get(t.mint), key: `t-${t.mint}` })
    }
  }

  if (wallets.length > 0) {
    data.push({ type: 'section-header', label: 'Recent Wallet Searches', key: 'sh-wallets' })
    for (const w of wallets) {
      data.push({ type: 'wallet', address: w.address, key: `w-${w.address}` })
    }
  }

  const isEmpty = tokens.length === 0 && wallets.length === 0

  const renderItem = useCallback(
    ({ item, index }: { item: ListItem; index: number }) => {
      if (item.type === 'section-header') {
        return (
          <View className="px-4 pt-4">
            <SectionLabel label={item.label} />
          </View>
        )
      }

      if (item.type === 'token') {
        const meta = item.metadata
        return (
          <AnimatedCard delay={index * 60}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/token/[mint]',
                  params: {
                    mint: item.mint,
                    tokenName: meta?.tokenName ?? '',
                    symbol: meta?.symbol ?? '',
                    logoURI: meta?.logoURI ?? '',
                  },
                })
              }
              className="flex-row items-center px-4 py-3"
            >
              {meta?.logoURI ? (
                <Image source={{ uri: meta.logoURI }} className="size-10 rounded-full" />
              ) : (
                <View className="bg-muted size-10 items-center justify-center rounded-full">
                  <Icon icon={Coins01Icon} className="text-muted-foreground size-5" />
                </View>
              )}
              <View className="ml-3 flex-1">
                <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
                  {meta?.tokenName ?? short(item.mint, 6)}
                </Text>
                <Text className="text-muted-foreground text-xs">
                  {meta?.symbol ? `$${meta.symbol}` : short(item.mint, 4)}
                </Text>
              </View>
            </Pressable>
          </AnimatedCard>
        )
      }

      return (
        <AnimatedCard delay={index * 60}>
          <Pressable
            onPress={() => router.push({ pathname: '/', params: { walletAddress: item.address } })}
            className="flex-row items-center px-4 py-3"
          >
            <View className="bg-muted size-10 items-center justify-center rounded-full">
              <Icon icon={Wallet01Icon} className="text-muted-foreground size-5" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-foreground text-sm font-medium">{short(item.address, 6)}</Text>
              <Text className="text-muted-foreground text-xs">Tap to search</Text>
            </View>
          </Pressable>
        </AnimatedCard>
      )
    },
    [metaMap],
  )

  const renderSeparator = useCallback(({ leadingItem }: { leadingItem: ListItem }) => {
    if (leadingItem.type === 'section-header') return null
    return <Separator />
  }, [])

  return (
    <SafeAreaViewUniwind className="bg-background flex-1" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={() => router.back()} className="p-1 active:opacity-60">
          <Icon icon={ArrowLeft01Icon} className="text-foreground size-6" />
        </Pressable>
        <Text className="text-foreground text-base font-semibold">History</Text>
        <ThemeToggle />
      </View>

      {isEmpty ? (
        <View className="flex-1 items-center justify-center px-8">
          <Card className="w-full items-center border-dashed p-6">
            <Icon icon={Coins01Icon} className="text-muted-foreground mb-3 size-10" />
            <Text className="text-muted-foreground text-center text-sm">
              No history yet. Viewed tokens and searched wallets will appear here.
            </Text>
          </Card>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          ItemSeparatorComponent={renderSeparator}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListFooterComponent={
            <View className="items-center px-4 pt-6">
              <Pressable onPress={() => clearAll(network)}>
                <Text className="text-destructive text-sm font-medium">Clear History</Text>
              </Pressable>
            </View>
          }
        />
      )}
      <BackToTopButton scrollY={scrollY} scrollRef={scrollRef} />
    </SafeAreaViewUniwind>
  )
}
