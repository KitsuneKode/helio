import { useEffect } from 'react'
import { Image, ScrollView, View } from 'react-native'
import { Coins01Icon } from '@hugeicons/core-free-icons'
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { Skeleton } from '@/components/ui/skeleton'
import { formatUsd, formatPrice } from '@/utils/format-number'
import type { TokenJupiterDetail } from '@/lib/solana/token-details'

type TokenHeroProps = {
  detail: TokenJupiterDetail | null
  loading: boolean
  logoURI: string | null
  displayName: string
  displaySymbol: string | null
  imgError: boolean
  onImgError: () => void
}

function PriceChangeBadge({ period, change }: { period: string; change: number | null }) {
  if (change === null) return null
  const pos = change >= 0
  return (
    <View
      className={[
        'items-center rounded-xl px-3 py-2',
        pos ? 'bg-green-500/10' : 'bg-destructive/10',
      ].join(' ')}
    >
      <Text className="text-muted-foreground mb-0.5 text-xs">{period}</Text>
      <Text
        className={[
          'text-xs font-semibold tabular-nums',
          pos ? 'text-green-500' : 'text-destructive',
        ].join(' ')}
      >
        {pos ? '+' : ''}
        {change.toFixed(2)}%
      </Text>
    </View>
  )
}

export function TokenHero({
  detail,
  loading,
  logoURI,
  displayName,
  displaySymbol,
  imgError,
  onImgError,
}: TokenHeroProps) {
  const heroOpacity = useSharedValue(0)
  const heroTranslate = useSharedValue(20)

  useEffect(() => {
    heroOpacity.value = withTiming(1, { duration: 400 })
    heroTranslate.value = withTiming(0, { duration: 400 })
  }, [])

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroTranslate.value }],
  }))

  const showImage = !!(logoURI && !imgError)
  const priceUsd = detail?.priceUsd ?? null
  const priceChange24h = detail?.stats24h?.priceChange ?? null
  const priceChangePositive = priceChange24h != null && priceChange24h >= 0

  const volume24h = (() => {
    const s = detail?.stats24h
    if (!s || (s.buyVolume == null && s.sellVolume == null)) return null
    return (s.buyVolume ?? 0) + (s.sellVolume ?? 0)
  })()

  const txns24h = (() => {
    const s = detail?.stats24h
    if (!s || (s.numBuys == null && s.numSells == null)) return null
    return (s.numBuys ?? 0) + (s.numSells ?? 0)
  })()

  return (
    <Animated.View style={heroStyle}>
      <View className="items-center gap-3 px-5 pb-4 pt-6">
        {/* Logo */}
        <View className="bg-muted h-24 w-24 items-center justify-center overflow-hidden rounded-full">
          {showImage ? (
            <Image
              source={{ uri: logoURI! }}
              style={{ width: 96, height: 96, borderRadius: 48 }}
              onError={onImgError}
            />
          ) : (
            <Icon icon={Coins01Icon} className="text-primary size-11" />
          )}
        </View>

        {/* Name */}
        <Text className="text-foreground text-center text-2xl font-bold">{displayName}</Text>

        {/* Symbol pill */}
        {displaySymbol && (
          <View className="bg-primary/10 rounded-full px-4 py-1">
            <Text className="text-primary font-mono text-sm font-semibold">${displaySymbol}</Text>
          </View>
        )}

        {/* Price + 24h change */}
        {loading ? (
          <View className="flex-row items-center gap-2">
            <Skeleton className="h-8 w-28 rounded-md" />
            <Skeleton className="h-7 w-20 rounded-full" />
          </View>
        ) : priceUsd != null ? (
          <View className="flex-row items-center gap-2">
            <Text className="text-foreground text-2xl font-bold tabular-nums">
              {formatPrice(priceUsd)}
            </Text>
            {priceChange24h != null && (
              <View
                className={[
                  'rounded-full px-3 py-1',
                  priceChangePositive ? 'bg-green-500/15' : 'bg-destructive/15',
                ].join(' ')}
              >
                <Text
                  className={[
                    'text-sm font-semibold tabular-nums',
                    priceChangePositive ? 'text-green-500' : 'text-destructive',
                  ].join(' ')}
                >
                  {priceChangePositive ? '+' : ''}
                  {priceChange24h.toFixed(2)}%
                </Text>
              </View>
            )}
          </View>
        ) : (
          <Text variant="muted" className="text-sm">
            No price data
          </Text>
        )}
      </View>

      {/* Quick Stats Row */}
      {loading ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          className="mb-3"
        >
          <View className="flex-row gap-2 py-1">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-20 rounded-2xl" />
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          className="mb-3"
        >
          <View className="flex-row gap-2 py-1">
            {[
              {
                label: 'FDV',
                value: detail?.fdv != null ? formatUsd(detail.fdv) : null,
              },
              {
                label: 'Volume 24h',
                value: volume24h != null ? formatUsd(volume24h) : null,
              },
              {
                label: 'Liquidity',
                value: detail?.liquidity != null ? formatUsd(detail.liquidity) : null,
              },
              {
                label: 'Txns 24h',
                value: txns24h != null ? txns24h.toLocaleString() : null,
              },
            ]
              .filter((s) => s.value != null)
              .map((stat) => (
                <View key={stat.label} className="bg-muted min-w-[80px] rounded-2xl px-4 py-3">
                  <Text className="text-muted-foreground mb-1 text-xs">{stat.label}</Text>
                  <Text className="text-foreground text-sm font-semibold tabular-nums">
                    {stat.value}
                  </Text>
                </View>
              ))}
          </View>
        </ScrollView>
      )}

      {/* Period Change Badges */}
      {!loading && (
        <View className="mb-5 flex-row flex-wrap gap-2 px-5">
          <PriceChangeBadge period="5m" change={detail?.stats5m?.priceChange ?? null} />
          <PriceChangeBadge period="1h" change={detail?.stats1h?.priceChange ?? null} />
          <PriceChangeBadge period="6h" change={detail?.stats6h?.priceChange ?? null} />
          <PriceChangeBadge period="24h" change={detail?.stats24h?.priceChange ?? null} />
        </View>
      )}
    </Animated.View>
  )
}
