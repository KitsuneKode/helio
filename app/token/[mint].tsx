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
import { ThemeToggle } from '@/components/theme-toggle-button'
import { short } from '@/utils/format-text'
import { SafeAreaViewUniwind } from '@/components/styled-uniwind-components'
import { fetchTokenMarketData, type TokenMarketData } from '@/lib/market'
import { fetchTokenJupiterDetail, type TokenJupiterDetail } from '@/lib/token-details'

// ─── Formatters ────────────────────────────────────────────────────────────

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
  return `$${price.toPrecision(4)}`
}

// ─── Sub-components ────────────────────────────────────────────────────────

function AnimatedCard({ delay, children }: { delay: number; children: React.ReactNode }) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(12)

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 280 }))
    translateY.value = withDelay(delay, withTiming(0, { duration: 280 }))
  }, [])

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return <Animated.View style={style}>{children}</Animated.View>
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Text className="text-muted-foreground mb-3 text-xs font-semibold tracking-widest uppercase">
      {label}
    </Text>
  )
}

function PriceChangeBadge({ period, change }: { period: string; change: number | null }) {
  if (change === null) return null
  const pos = change >= 0
  return (
    <View
      className={[
        'items-center rounded-xl px-3 py-2',
        pos ? 'bg-green-500/10' : 'bg-destructive/10',
      ].join(' ')}>
      <Text className="text-muted-foreground mb-0.5 text-xs">{period}</Text>
      <Text
        className={[
          'text-xs font-semibold tabular-nums',
          pos ? 'text-green-500' : 'text-destructive',
        ].join(' ')}>
        {pos ? '+' : ''}
        {change.toFixed(2)}%
      </Text>
    </View>
  )
}

function LinkRow({
  label,
  onPress,
  badge,
  badgeColor,
  badgeTextColor,
}: {
  label: string
  onPress: () => void
  badge: string
  badgeColor: string
  badgeTextColor: string
}) {
  return (
    <Pressable onPress={onPress} className="active:opacity-60">
      <View className="flex-row items-center justify-between px-5 py-4">
        <View className="flex-row items-center gap-3">
          <View
            className={[
              'h-8 w-8 items-center justify-center rounded-full',
              badgeColor,
            ].join(' ')}>
            <Text className={['text-xs font-bold', badgeTextColor].join(' ')}>{badge}</Text>
          </View>
          <Text className="text-foreground font-medium">{label}</Text>
        </View>
        <Text variant="muted" className="text-base">
          ↗
        </Text>
      </View>
    </Pressable>
  )
}

// ─── Screen ────────────────────────────────────────────────────────────────

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
  const [jupiterDetail, setJupiterDetail] = useState<TokenJupiterDetail | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  // Hero fade-in
  const heroOpacity = useSharedValue(0)
  const heroTranslate = useSharedValue(20)
  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroTranslate.value }],
  }))

  useEffect(() => {
    heroOpacity.value = withTiming(1, { duration: 400 })
    heroTranslate.value = withTiming(0, { duration: 400 })

    // Parallel fetch: market data + Jupiter detail
    Promise.all([fetchTokenMarketData(mint), fetchTokenJupiterDetail(mint)]).then(
      ([market, detail]) => {
        setMarketData(market)
        setJupiterDetail(detail)
        setDataLoading(false)
      },
    )
  }, [mint])

  // Derived values
  const parsedAmount = parseFloat(amount ?? '0')
  const displayName = tokenName || jupiterDetail?.name || short(mint, 6)
  const displaySymbol = symbol || jupiterDetail?.symbol || null
  const resolvedLogoURI = (logoURI && logoURI !== '') ? logoURI : jupiterDetail?.logoURI ?? null
  const showImage = !!(resolvedLogoURI && !imgError)

  const priceUsd = marketData?.priceUsd ?? null
  const priceChange24h = marketData?.priceChange24h ?? null
  const usdValue = priceUsd != null ? parsedAmount * priceUsd : null
  const priceChangePositive = priceChange24h != null && priceChange24h >= 0

  const handleCopyMint = async () => {
    await Clipboard.setStringAsync(mint)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setCopiedMint(true)
    setTimeout(() => setCopiedMint(false), 2000)
  }

  const openLink = (url: string) => Linking.openURL(url)

  return (
    <SafeAreaViewUniwind className="bg-background flex-1" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={() => router.back()} className="p-1 active:opacity-60">
          <Icon icon={ArrowLeft01Icon} className="text-foreground size-6" />
        </Pressable>
        <Text className="text-foreground text-base font-semibold">Token Details</Text>
        <ThemeToggle />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* ── Hero ── */}
        <Animated.View style={heroStyle}>
          <View className="items-center gap-3 px-5 pb-4 pt-6">
            {/* Logo */}
            <View className="bg-muted h-24 w-24 items-center justify-center overflow-hidden rounded-full">
              {showImage ? (
                <Image
                  source={{ uri: resolvedLogoURI! }}
                  style={{ width: 96, height: 96, borderRadius: 48 }}
                  onError={() => setImgError(true)}
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
                <Text className="text-primary font-mono text-sm font-semibold">
                  ${displaySymbol}
                </Text>
              </View>
            )}

            {/* Price + 24h change */}
            {dataLoading ? (
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
                    ].join(' ')}>
                    <Text
                      className={[
                        'text-sm font-semibold tabular-nums',
                        priceChangePositive ? 'text-green-500' : 'text-destructive',
                      ].join(' ')}>
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

          {/* ── Quick Stats Row (horizontal scroll) ── */}
          {dataLoading ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              className="mb-3">
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
              className="mb-3">
              <View className="flex-row gap-2 py-1">
                {[
                  {
                    label: 'Market Cap',
                    value: marketData?.fdv != null ? formatUsd(marketData.fdv) : null,
                  },
                  {
                    label: 'Volume 24h',
                    value: marketData?.volume24h != null ? formatUsd(marketData.volume24h) : null,
                  },
                  {
                    label: 'Liquidity',
                    value:
                      marketData?.liquidity != null ? formatUsd(marketData.liquidity) : null,
                  },
                  {
                    label: 'Txns 24h',
                    value:
                      marketData?.txns24h != null
                        ? marketData.txns24h.toLocaleString()
                        : null,
                  },
                ]
                  .filter((s) => s.value != null)
                  .map((stat) => (
                    <View
                      key={stat.label}
                      className="bg-muted min-w-[80px] rounded-2xl px-4 py-3">
                      <Text className="text-muted-foreground mb-1 text-xs">{stat.label}</Text>
                      <Text className="text-foreground text-sm font-semibold tabular-nums">
                        {stat.value}
                      </Text>
                    </View>
                  ))}
              </View>
            </ScrollView>
          )}

          {/* ── Period Change Badges ── */}
          {!dataLoading && (
            <View className="mb-5 flex-row flex-wrap gap-2 px-5">
              <PriceChangeBadge period="5m" change={marketData?.priceChange5m ?? null} />
              <PriceChangeBadge period="1h" change={marketData?.priceChange1h ?? null} />
              <PriceChangeBadge period="6h" change={marketData?.priceChange6h ?? null} />
              <PriceChangeBadge period="24h" change={marketData?.priceChange24h ?? null} />
            </View>
          )}
        </Animated.View>

        {/* ── Cards section ── */}
        <View className="gap-4 px-5 pb-10">
          {/* Your Holdings */}
          <AnimatedCard delay={100}>
            <Card className="overflow-hidden p-0">
              <View className="px-5 pb-5 pt-4">
                <SectionLabel label="Your Holdings" />
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

          {/* About — only shown if Jupiter returns description */}
          {!dataLoading && jupiterDetail?.description ? (
            <AnimatedCard delay={160}>
              <Card className="overflow-hidden p-0">
                <View className="px-5 pb-5 pt-4">
                  <SectionLabel label="About" />
                  <Text className="text-foreground text-sm leading-6" numberOfLines={6}>
                    {jupiterDetail.description}
                  </Text>
                </View>
              </Card>
            </AnimatedCard>
          ) : null}

          {/* Market Stats */}
          <AnimatedCard delay={200}>
            <Card className="overflow-hidden p-0">
              <View className="px-5 pt-4 pb-1">
                <SectionLabel label="Market Stats" />
              </View>
              <CardContent className="px-5 pb-5 pt-0">
                {dataLoading ? (
                  <View className="gap-3">
                    <View className="flex-row gap-3">
                      <Skeleton className="h-12 flex-1 rounded-xl" />
                      <Skeleton className="h-12 flex-1 rounded-xl" />
                    </View>
                    <View className="flex-row gap-3">
                      <Skeleton className="h-12 flex-1 rounded-xl" />
                      <Skeleton className="h-12 flex-1 rounded-xl" />
                    </View>
                    <View className="flex-row gap-3">
                      <Skeleton className="h-12 flex-1 rounded-xl" />
                      <Skeleton className="h-12 flex-1 rounded-xl" />
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
                        value={
                          priceChange24h != null
                            ? `${priceChangePositive ? '+' : ''}${priceChange24h.toFixed(2)}%`
                            : null
                        }
                        positive={priceChangePositive && priceChange24h != null}
                        negative={!priceChangePositive && priceChange24h != null}
                      />
                    </View>
                    <Separator />
                    <View className="flex-row gap-3">
                      <MarketStat
                        label="Volume 24h"
                        value={
                          marketData?.volume24h != null ? formatUsd(marketData.volume24h) : null
                        }
                      />
                      <MarketStat
                        label="Liquidity"
                        value={
                          marketData?.liquidity != null ? formatUsd(marketData.liquidity) : null
                        }
                      />
                    </View>
                    <Separator />
                    <View className="flex-row gap-3">
                      <MarketStat
                        label="FDV"
                        value={marketData?.fdv != null ? formatUsd(marketData.fdv) : null}
                      />
                      <MarketStat
                        label="Buys / Sells"
                        value={
                          marketData?.buys24h != null && marketData?.sells24h != null
                            ? `${marketData.buys24h.toLocaleString()} / ${marketData.sells24h.toLocaleString()}`
                            : null
                        }
                      />
                    </View>
                  </View>
                )}
              </CardContent>
            </Card>
          </AnimatedCard>

          {/* Token Info */}
          <AnimatedCard delay={260}>
            <Card className="gap-0 overflow-hidden p-0">
              <View className="px-5 pt-4 pb-1">
                <SectionLabel label="Token Info" />
              </View>
              <CardContent className="gap-0 px-0 py-0">
                {/* Mint address with copy */}
                <Pressable onPress={handleCopyMint} className="active:opacity-60">
                  <View className="flex-row items-center justify-between px-5 py-4">
                    <View className="mr-3 flex-1">
                      <Text variant="muted" className="mb-1 text-xs uppercase tracking-wider">
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
                        }>
                        {copiedMint ? 'Copied!' : 'Copy'}
                      </Text>
                    </View>
                  </View>
                </Pressable>

                {/* Decimals */}
                {!dataLoading && jupiterDetail?.decimals != null && (
                  <>
                    <Separator className="mx-5" />
                    <View className="px-5 py-4">
                      <Text variant="muted" className="mb-1 text-xs uppercase tracking-wider">
                        Decimals
                      </Text>
                      <Text className="text-foreground font-semibold">
                        {jupiterDetail.decimals}
                      </Text>
                    </View>
                  </>
                )}

                {/* Tags */}
                {!dataLoading && jupiterDetail?.tags && jupiterDetail.tags.length > 0 && (
                  <>
                    <Separator className="mx-5" />
                    <View className="px-5 py-4">
                      <Text variant="muted" className="mb-2 text-xs uppercase tracking-wider">
                        Tags
                      </Text>
                      <View className="flex-row flex-wrap gap-2">
                        {jupiterDetail.tags.map((tag) => (
                          <View key={tag} className="bg-primary/10 rounded-full px-3 py-1">
                            <Text className="text-primary text-xs font-medium">{tag}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </>
                )}

                <Separator className="mx-5" />
                <View className="px-5 py-4">
                  <Text variant="muted" className="mb-1 text-xs uppercase tracking-wider">
                    Network
                  </Text>
                  <Text className="text-foreground font-semibold">Solana Mainnet</Text>
                </View>
              </CardContent>
            </Card>
          </AnimatedCard>

          {/* Links */}
          <AnimatedCard delay={320}>
            <Card className="gap-0 overflow-hidden p-0">
              <View className="px-5 pt-4 pb-1">
                <SectionLabel label="Links" />
              </View>
              <CardContent className="px-0 py-0">
                <LinkRow
                  label="View on Solscan"
                  onPress={() => openLink(`https://solscan.io/token/${mint}`)}
                  badge="S"
                  badgeColor="bg-primary/10"
                  badgeTextColor="text-primary"
                />
                <Separator className="mx-5" />
                <LinkRow
                  label="View on Jupiter"
                  onPress={() => openLink(`https://jup.ag/tokens/${mint}`)}
                  badge="J"
                  badgeColor="bg-green-500/10"
                  badgeTextColor="text-green-500"
                />
                {!dataLoading && jupiterDetail?.website && (
                  <>
                    <Separator className="mx-5" />
                    <LinkRow
                      label="Website"
                      onPress={() => openLink(jupiterDetail.website!)}
                      badge="W"
                      badgeColor="bg-muted"
                      badgeTextColor="text-muted-foreground"
                    />
                  </>
                )}
                {!dataLoading && jupiterDetail?.twitter && (
                  <>
                    <Separator className="mx-5" />
                    <LinkRow
                      label="Twitter / X"
                      onPress={() => openLink(jupiterDetail.twitter!)}
                      badge="𝕏"
                      badgeColor="bg-muted"
                      badgeTextColor="text-foreground"
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </AnimatedCard>
        </View>
      </ScrollView>
    </SafeAreaViewUniwind>
  )
}
