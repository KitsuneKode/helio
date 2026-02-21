import { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import * as Linking from 'expo-linking'
import { useLocalSearchParams, router } from 'expo-router'
import {
  ArrowLeft01Icon,
  Coins01Icon,
  Copy01Icon,
  CheckmarkCircle01Icon,
} from '@hugeicons/core-free-icons'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated'
import { Card, CardContent } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { MarketStat } from '@/components/token/market-stat'
import { short } from '@/utils/format-text'
import { SafeAreaViewUniwind } from '@/components/styled-uniwind-components'
import { fetchTokenMarketData, type TokenMarketData } from '@/lib/market'

const formatAmount = (amount: number) => {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(2)}K`
  return amount.toLocaleString(undefined, { maximumFractionDigits: 6 })
}

const formatUsd = (value: number) => {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}`
}

const formatPrice = (price: number) => {
  if (price >= 1)
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
  if (price >= 0.01) return `$${price.toFixed(4)}`
  // For very small prices, show significant digits
  return `$${price.toPrecision(4)}`
}

function AnimatedCard({
  delay,
  children,
  className,
}: {
  delay: number
  children: React.ReactNode
  className?: string
}) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(16)

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }))
    translateY.value = withDelay(delay, withTiming(0, { duration: 300 }))
  }, [opacity, translateY, delay])

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <Animated.View style={style} className={className}>
      {children}
    </Animated.View>
  )
}

export default function TokenDetailScreen() {
  const { mint, amount, tokenName, symbol, logoURI } = useLocalSearchParams<{
    mint: string
    amount: string
    tokenName?: string
    symbol?: string
    logoURI?: string
  }>()

  const [imgError, setImgError] = useState(false)
  const [copiedMint, setCopiedMint] = useState(false)
  const [marketData, setMarketData] = useState<TokenMarketData | null>(null)
  const [marketLoading, setMarketLoading] = useState(true)

  // Hero animation
  const heroOpacity = useSharedValue(0)
  const heroTranslate = useSharedValue(20)
  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroTranslate.value }],
  }))

  useEffect(() => {
    heroOpacity.value = withTiming(1, { duration: 400 })
    heroTranslate.value = withTiming(0, { duration: 400 })

    fetchTokenMarketData(mint).then((data) => {
      setMarketData(data)
      setMarketLoading(false)
    })
  }, [mint, heroOpacity, heroTranslate])

  const parsedAmount = parseFloat(amount ?? '0')
  const displayName = tokenName || short(mint, 6)
  const displaySymbol = symbol || null
  const showImage = !!(logoURI && !imgError)

  const priceUsd = marketData?.priceUsd ?? null
  const priceChange = marketData?.priceChange24h ?? null
  const usdValue = priceUsd != null ? parsedAmount * priceUsd : null

  const handleCopyMint = async () => {
    await Clipboard.setStringAsync(mint)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setCopiedMint(true)
    setTimeout(() => setCopiedMint(false), 2000)
  }

  const openLink = (url: string) => {
    Linking.openURL(url)
  }

  const priceChangePositive = priceChange != null && priceChange >= 0
  const priceChangeStr =
    priceChange != null
      ? `${priceChangePositive ? '+' : ''}${priceChange.toFixed(2)}% ${priceChangePositive ? '▲' : '▼'}`
      : null

  return (
    <SafeAreaViewUniwind className="bg-background flex-1" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()} className="p-1 active:opacity-60">
          <Icon icon={ArrowLeft01Icon} className="text-foreground size-6" />
        </Pressable>
        <Text className="text-foreground ml-3 text-lg font-semibold">Token Details</Text>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <Animated.View style={heroStyle} className="items-center gap-3 py-8">
          <View className="bg-primary/10 h-24 w-24 items-center justify-center overflow-hidden rounded-full">
            {showImage ? (
              <Image
                source={{ uri: logoURI }}
                style={{ width: 96, height: 96, borderRadius: 48 }}
                onError={() => setImgError(true)}
              />
            ) : (
              <Icon icon={Coins01Icon} className="text-primary size-11" />
            )}
          </View>

          <Text className="text-foreground text-center text-2xl font-bold">{displayName}</Text>

          {displaySymbol && (
            <View className="bg-primary/10 rounded-full px-4 py-1">
              <Text className="text-primary font-mono text-sm font-semibold">${displaySymbol}</Text>
            </View>
          )}

          {/* Price + change */}
          {marketLoading ? (
            <View className="flex-row items-center gap-2">
              <Skeleton className="h-7 w-24 rounded-md" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </View>
          ) : priceUsd != null ? (
            <View className="flex-row items-center gap-2">
              <Text className="text-foreground text-xl font-bold tabular-nums">
                {formatPrice(priceUsd)}
              </Text>
              {priceChangeStr && (
                <View
                  className={[
                    'rounded-full px-3 py-1',
                    priceChangePositive ? 'bg-green-500/15' : 'bg-destructive/15',
                  ].join(' ')}
                >
                  <Text
                    className={[
                      'text-xs font-semibold tabular-nums',
                      priceChangePositive ? 'text-green-500' : 'text-destructive',
                    ].join(' ')}
                  >
                    {priceChangeStr}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text variant="muted" className="text-sm">
              No price data
            </Text>
          )}
        </Animated.View>

        {/* Holdings */}
        <AnimatedCard delay={60} className="mb-4">
          <Card className="gap-0 overflow-hidden p-0">
            <View className="bg-primary/10 px-5 py-3">
              <Text variant="muted" className="text-xs tracking-wider uppercase">
                Your Holdings
              </Text>
            </View>
            <View className="px-5 py-5">
              <Text className="text-foreground text-3xl font-bold tabular-nums">
                {formatAmount(parsedAmount)}
              </Text>
              {displaySymbol ? (
                <Text className="text-primary mt-1 text-base font-semibold">{displaySymbol}</Text>
              ) : (
                <Text variant="muted" className="mt-1 text-base">
                  tokens
                </Text>
              )}
              {usdValue != null && (
                <Text variant="muted" className="mt-2 text-sm tabular-nums">
                  ≈ {formatUsd(usdValue)}
                </Text>
              )}
            </View>
          </Card>
        </AnimatedCard>

        {/* Market Data */}
        <AnimatedCard delay={120} className="mb-4">
          <Card className="gap-0 overflow-hidden p-0">
            <View className="bg-primary/10 px-5 py-3">
              <Text variant="muted" className="text-xs tracking-wider uppercase">
                Market Data
              </Text>
            </View>
            <CardContent className="px-5 py-4">
              {marketLoading ? (
                <View className="gap-3">
                  <View className="flex-row gap-3">
                    <Skeleton className="h-10 flex-1 rounded-md" />
                    <Skeleton className="h-10 flex-1 rounded-md" />
                  </View>
                  <View className="flex-row gap-3">
                    <Skeleton className="h-10 flex-1 rounded-md" />
                    <Skeleton className="h-10 flex-1 rounded-md" />
                  </View>
                  <View className="flex-row gap-3">
                    <Skeleton className="h-10 flex-1 rounded-md" />
                    <Skeleton className="h-10 flex-1 rounded-md" />
                  </View>
                </View>
              ) : (
                <View className="gap-4">
                  <View className="flex-row gap-3">
                    <MarketStat
                      label="Price USD"
                      value={priceUsd != null ? formatPrice(priceUsd) : null}
                    />
                    <MarketStat
                      label="24h Change"
                      value={priceChangeStr}
                      positive={priceChangePositive && priceChange != null}
                      negative={!priceChangePositive && priceChange != null}
                    />
                  </View>
                  <Separator />
                  <View className="flex-row gap-3">
                    <MarketStat
                      label="Volume 24h"
                      value={marketData?.volume24h != null ? formatUsd(marketData.volume24h) : null}
                    />
                    <MarketStat
                      label="Liquidity"
                      value={marketData?.liquidity != null ? formatUsd(marketData.liquidity) : null}
                    />
                  </View>
                  <Separator />
                  <View className="flex-row gap-3">
                    <MarketStat
                      label="Market Cap"
                      value={marketData?.fdv != null ? formatUsd(marketData.fdv) : null}
                    />
                    <MarketStat
                      label="24h Txns"
                      value={
                        marketData?.txns24h != null ? marketData.txns24h.toLocaleString() : null
                      }
                    />
                  </View>
                </View>
              )}
            </CardContent>
          </Card>
        </AnimatedCard>

        {/* Links */}
        <AnimatedCard delay={180} className="mb-4">
          <Card className="gap-0 overflow-hidden p-0">
            <View className="bg-primary/10 px-5 py-3">
              <Text variant="muted" className="text-xs tracking-wider uppercase">
                Explorer Links
              </Text>
            </View>
            <CardContent className="px-0 py-0">
              <Pressable
                onPress={() => openLink(`https://solscan.io/token/${mint}`)}
                className="active:opacity-60"
              >
                <View className="flex-row items-center justify-between px-5 py-4">
                  <View className="flex-row items-center gap-3">
                    <View className="bg-primary/10 h-8 w-8 items-center justify-center rounded-full">
                      <Text className="text-primary text-xs font-bold">S</Text>
                    </View>
                    <Text className="text-foreground font-medium">View on Solscan</Text>
                  </View>
                  <Text variant="muted" className="text-base">
                    ↗
                  </Text>
                </View>
              </Pressable>

              <Separator className="mx-5" />

              <Pressable
                onPress={() => openLink(`https://jup.ag/tokens/${mint}`)}
                className="active:opacity-60"
              >
                <View className="flex-row items-center justify-between px-5 py-4">
                  <View className="flex-row items-center gap-3">
                    <View className="bg-green-500/10 h-8 w-8 items-center justify-center rounded-full">
                      <Text className="text-xs font-bold text-green-500">J</Text>
                    </View>
                    <Text className="text-foreground font-medium">View on Jupiter</Text>
                  </View>
                  <Text variant="muted" className="text-base">
                    ↗
                  </Text>
                </View>
              </Pressable>
            </CardContent>
          </Card>
        </AnimatedCard>

        {/* Token Info */}
        <AnimatedCard delay={240} className="mb-8">
          <Card className="gap-0 overflow-hidden p-0">
            <View className="bg-primary/10 px-5 py-3">
              <Text variant="muted" className="text-xs tracking-wider uppercase">
                Token Info
              </Text>
            </View>
            <CardContent className="gap-0 px-0 py-0">
              {/* Mint address */}
              <Pressable onPress={handleCopyMint} className="active:opacity-60">
                <View className="flex-row items-center justify-between px-5 py-4">
                  <View className="flex-1 mr-3">
                    <Text variant="muted" className="mb-1 text-xs tracking-wider uppercase">
                      Mint Address
                    </Text>
                    <Text className="text-foreground font-mono text-sm" numberOfLines={1}>
                      {short(mint, 12)}
                    </Text>
                  </View>
                  <View className="bg-muted flex-row items-center gap-1.5 rounded-lg px-2.5 py-1.5">
                    {copiedMint ? (
                      <Icon icon={CheckmarkCircle01Icon} className="text-primary size-3.5" />
                    ) : (
                      <Icon icon={Copy01Icon} className="text-muted-foreground size-3.5" />
                    )}
                    <Text
                      variant="small"
                      className={
                        copiedMint ? 'text-primary font-semibold' : 'text-muted-foreground'
                      }
                    >
                      {copiedMint ? 'Copied!' : 'Copy'}
                    </Text>
                  </View>
                </View>
              </Pressable>

              <Separator className="mx-5" />

              <View className="px-5 py-4">
                <Text variant="muted" className="mb-1 text-xs tracking-wider uppercase">
                  Network
                </Text>
                <Text className="text-foreground font-semibold">Solana Mainnet</Text>
              </View>
            </CardContent>
          </Card>
        </AnimatedCard>
      </ScrollView>
    </SafeAreaViewUniwind>
  )
}
