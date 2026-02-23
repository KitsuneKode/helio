import { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, View } from 'react-native'
import { Link, router } from 'expo-router'
import { Wallet01Icon, Coins01Icon, ArrowRight02FreeIcons } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { SectionLabel } from '@/components/ui/section-label'
import { useHistoryStore } from '@/store/history-store'
import { useWatchlistStore } from '@/store/watchlist-store'
import { useNetwork } from '@/context/network-context'
import { getMetaDataFromCacheOrFetch } from '@/lib/cache/token-metadata'
import { short } from '@/utils/format-text'
import type { TokenMetadata } from '@/types'
import { Button } from '../ui/button'

type Props = {
  onQuickSearch: (address: string) => void
}

export const WalletPrompt = ({ onQuickSearch }: Props) => {
  const { network } = useNetwork()
  const recentWallets = useHistoryStore((s) => s.data[network].wallets)
  const watchlist = useWatchlistStore((s) => s.watchlist)

  const [watchlistMeta, setWatchlistMeta] = useState<Map<string, TokenMetadata>>(new Map())

  useEffect(() => {
    if (watchlist.length === 0) return
    let cancelled = false
    getMetaDataFromCacheOrFetch(watchlist).then((map) => {
      if (!cancelled) setWatchlistMeta(map)
    })
    return () => {
      cancelled = true
    }
  }, [watchlist])

  const hasRecentWallets = recentWallets.length > 0
  const hasFavorites = watchlist.length > 0

  return (
    <View className="flex-1 items-center justify-center gap-8 py-16">
      {/* Concentric rings */}
      <View className="bg-primary/5 h-36 w-36 items-center justify-center rounded-full">
        <View className="bg-primary/10 h-24 w-24 items-center justify-center rounded-full">
          <View className="bg-primary/20 h-16 w-16 items-center justify-center rounded-full">
            <Icon icon={Wallet01Icon} className="text-primary size-8" />
          </View>
        </View>
      </View>

      <View className="items-center gap-2">
        <Text variant="large" className="text-foreground tracking-tight">
          Explore a Wallet
        </Text>
        <Text variant="muted" className="max-w-[240px] text-center text-sm leading-relaxed">
          Enter a Solana address above to inspect its balance, token holdings, and on-chain history.
        </Text>
      </View>

      {/* Recent Searches */}
      {hasRecentWallets && (
        <View className="w-full">
          <View className="px-1 flex-row items-center justify-between">
            <SectionLabel label="Recent Searches" />

            <Link href={'/history'} asChild>
              <Button variant="outline" hitSlop={24}>
                <Icon icon={ArrowRight02FreeIcons} className="siz-5" />
              </Button>
            </Link>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2 px-1">
              {recentWallets.slice(0, 5).map((w) => (
                <Pressable
                  key={w.address}
                  onPress={() => onQuickSearch(w.address)}
                  className="bg-muted flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
                >
                  <Icon icon={Wallet01Icon} className="text-muted-foreground size-3.5" />
                  <Text className="text-foreground text-xs">{short(w.address, 4)}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Favorites */}
      {hasFavorites && (
        <View className="w-full">
          <View className="px-1 flex-row items-center justify-between">
            <SectionLabel label="Favorites" />
            <Link href={'/watchlist'} asChild>
              <Button variant="outline" hitSlop={24}>
                <Icon icon={ArrowRight02FreeIcons} />
              </Button>
            </Link>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2 px-1">
              {watchlist.slice(0, 5).map((addr) => {
                const meta = watchlistMeta.get(addr)
                const isToken = !!meta

                if (isToken) {
                  return (
                    <Pressable
                      key={addr}
                      onPress={() =>
                        router.push({
                          pathname: '/token/[mint]',
                          params: {
                            mint: addr,
                            tokenName: meta.tokenName ?? '',
                            symbol: meta.symbol ?? '',
                            logoURI: meta.logoURI ?? '',
                          },
                        })
                      }
                      className="bg-muted flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
                    >
                      {meta.logoURI ? (
                        <Image source={{ uri: meta.logoURI }} className="size-4 rounded-full" />
                      ) : (
                        <Icon icon={Coins01Icon} className="text-muted-foreground size-3.5" />
                      )}
                      <Text className="text-foreground text-xs">
                        {meta.symbol ?? short(addr, 4)}
                      </Text>
                    </Pressable>
                  )
                }

                return (
                  <Pressable
                    key={addr}
                    onPress={() => onQuickSearch(addr)}
                    className="bg-muted flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
                  >
                    <Icon icon={Wallet01Icon} className="text-muted-foreground size-3.5" />
                    <Text className="text-foreground text-xs">{short(addr, 4)}</Text>
                  </Pressable>
                )
              })}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  )
}
