import { useCallback, useState } from 'react'
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams, router } from 'expo-router'
import {
  ArrowLeft01Icon,
  Coins01Icon,
  Copy01Icon,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  BarChartFreeIcons,
  Diamond01Icon,
  Link01Icon,
} from '@hugeicons/core-free-icons'
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { Skeleton } from '@/components/ui/skeleton'
import { short } from '@/utils/format-text'
import { SafeAreaViewUniwind } from '@/components/styled-uniwind-components'
import {
  getTokenMarketData,
  formatUSD,
  formatPriceChange,
  type TokenMarketData,
} from '@/lib/market-data'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatAmount = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 })
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat card – 2-col grid cell
// ─────────────────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, delay }: { label: string; value: string; delay: number }) => (
  <Animated.View
    entering={FadeInDown.delay(delay).springify().damping(18)}
    className="bg-card border-border w-[47.5%] rounded-2xl border p-4"
  >
    <Text className="text-muted-foreground mb-1.5 text-[10px] font-bold uppercase tracking-widest">
      {label}
    </Text>
    <Text className="text-foreground font-mono text-base font-bold">{value}</Text>
  </Animated.View>
)

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function TokenDetailScreenAntigravity() {
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
  const [loadingMarket, setLoadingMarket] = useState(false)
  const [marketLoaded, setMarketLoaded] = useState(false)

  const fetchBtnScale = useSharedValue(1)
  const fetchBtnStyle = useAnimatedStyle(() => ({ transform: [{ scale: fetchBtnScale.value }] }))

  const parsedAmount = parseFloat(amount ?? '0')
  const displayName = tokenName || short(mint, 6)
  const displaySymbol = symbol || null
  const showImage = !!(logoURI && !imgError)
  const usdValue = marketData?.price != null ? parsedAmount * marketData.price : null
  const priceUp = (marketData?.priceChange24h ?? 0) >= 0

  const handleFetchMarket = useCallback(async () => {
    if (loadingMarket) return
    fetchBtnScale.value = withSequence(withSpring(0.91), withSpring(1))
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setLoadingMarket(true)
    try {
      const data = await getTokenMarketData(mint)
      setMarketData(data)
      setMarketLoaded(true)
    } finally {
      setLoadingMarket(false)
    }
  }, [mint, loadingMarket, fetchBtnScale])

  const handleCopyMint = async () => {
    await Clipboard.setStringAsync(mint)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setCopiedMint(true)
    setTimeout(() => setCopiedMint(false), 2000)
  }

  const openSolscan = () => Linking.openURL(`https://solscan.io/token/${mint}`)
  const openJupiter = () => Linking.openURL(`https://jup.ag/swap/SOL-${mint}`)
  const openDexscreener = () =>
    marketData?.pairUrl
      ? Linking.openURL(marketData.pairUrl)
      : Linking.openURL(`https://dexscreener.com/solana/${mint}`)

  return (
    <SafeAreaViewUniwind className="bg-background flex-1" edges={['top', 'bottom']}>
      {/* ── Header ── */}
      <Animated.View entering={FadeIn.duration(220)} className="flex-row items-center px-5 py-3">
        <Pressable onPress={() => router.back()} className="p-1 active:opacity-60" hitSlop={12}>
          <Icon icon={ArrowLeft01Icon} className="text-foreground size-6" />
        </Pressable>
        <Text className="text-foreground flex-1 text-center text-base font-semibold tracking-wide">
          Token Details
        </Text>
        <View className="w-8" />
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4">
        {/* ── Hero ── */}
        <Animated.View
          entering={FadeInDown.delay(60).springify().damping(16)}
          className="items-center py-8"
        >
          {/* Logo ring */}
          <View className="bg-primary/5 border-primary/20 mb-4 h-28 w-28 items-center justify-center rounded-full border-2">
            <View className="bg-primary/10 h-24 w-24 overflow-hidden rounded-full items-center justify-center">
              {showImage ? (
                <Image
                  source={{ uri: logoURI }}
                  style={{ width: 96, height: 96, borderRadius: 48 }}
                  onError={() => setImgError(true)}
                />
              ) : (
                <Icon icon={Coins01Icon} className="text-primary size-12" />
              )}
            </View>
          </View>

          {/* Name */}
          <Text
            className="text-foreground mb-2 text-center text-3xl font-bold tracking-tight"
            numberOfLines={1}
          >
            {displayName}
          </Text>

          {/* Symbol badge */}
          {displaySymbol && (
            <View className="bg-primary/10 border-primary/25 mb-5 rounded-full border px-4 py-1.5">
              <Text className="text-primary font-mono text-sm font-bold tracking-widest">
                ${displaySymbol}
              </Text>
            </View>
          )}

          {/* Price or fetch button */}
          {marketData?.price != null ? (
            <Animated.View entering={FadeIn.duration(350)} className="flex-row items-center gap-3">
              <Text className="text-foreground font-mono text-4xl font-extrabold tracking-tight">
                {formatUSD(marketData.price, 6)}
              </Text>
              {marketData.priceChange24h != null && (
                <View
                  className={[
                    'flex-row items-center gap-1.5 rounded-xl px-2.5 py-1.5',
                    priceUp ? 'bg-green-500/15' : 'bg-red-500/15',
                  ].join(' ')}
                >
                  <Icon
                    icon={priceUp ? TrendingUp : TrendingDown}
                    className={`size-3.5 ${priceUp ? 'text-green-400' : 'text-red-400'}`}
                  />
                  <Text
                    className={`text-sm font-bold ${priceUp ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {formatPriceChange(marketData.priceChange24h)}
                  </Text>
                </View>
              )}
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.delay(120).springify()} style={fetchBtnStyle}>
              <Pressable
                onPress={handleFetchMarket}
                disabled={loadingMarket}
                className="border-primary/30 bg-primary/10 flex-row items-center justify-center gap-2 rounded-full border px-6 py-3 active:opacity-70"
              >
                {loadingMarket ? (
                  <ActivityIndicator size="small" color="#4ade80" />
                ) : (
                  <>
                    <Icon icon={BarChartFreeIcons} className="text-primary size-4" />
                    <Text className="text-primary text-sm font-semibold">Load Market Data</Text>
                  </>
                )}
              </Pressable>
            </Animated.View>
          )}
        </Animated.View>

        {/* ── Holdings Card ── */}
        <Animated.View
          entering={FadeInDown.delay(160).springify().damping(18)}
          className="bg-card border-border mb-3 overflow-hidden rounded-2xl border"
        >
          <View className="border-border border-b px-5 py-3">
            <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
              Your Holdings
            </Text>
          </View>
          <View className="px-5 py-5">
            <View className="flex-row items-baseline gap-2">
              <Text className="text-foreground font-mono text-5xl font-extrabold tracking-tighter">
                {formatAmount(parsedAmount)}
              </Text>
              {displaySymbol && (
                <Text className="text-primary text-xl font-bold">{displaySymbol}</Text>
              )}
            </View>
            {usdValue != null ? (
              <Animated.Text
                entering={FadeIn.duration(350)}
                className="text-muted-foreground font-mono mt-2 text-base"
              >
                ≈ {formatUSD(usdValue)}
              </Animated.Text>
            ) : loadingMarket ? (
              <Skeleton className="mt-2 h-4 w-28 rounded-lg" />
            ) : null}
          </View>
        </Animated.View>

        {/* ── Market Data or prompt ── */}
        {marketLoaded && marketData ? (
          <Animated.View entering={FadeInDown.delay(40).springify().damping(18)}>
            <Text className="text-muted-foreground mb-3 mt-2 px-1 text-[10px] font-bold uppercase tracking-widest">
              Market Data
            </Text>
            <View className="mb-3 flex-row flex-wrap gap-2.5">
              <StatCard label="Price" value={formatUSD(marketData.price, 6)} delay={0} />
              <StatCard
                label="24h Change"
                value={formatPriceChange(marketData.priceChange24h)}
                delay={60}
              />
              <StatCard label="Market Cap" value={formatUSD(marketData.marketCap)} delay={120} />
              <StatCard label="24h Volume" value={formatUSD(marketData.volume24h)} delay={180} />
              <StatCard label="FDV" value={formatUSD(marketData.fdv)} delay={240} />
              <StatCard label="Liquidity" value={formatUSD(marketData.liquidity)} delay={300} />
            </View>
          </Animated.View>
        ) : loadingMarket ? (
          <View className="gap-3 mb-3">
            <Skeleton className="h-4 w-32 rounded-lg" />
            <View className="flex-row flex-wrap gap-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" style={{ width: '47.5%' }} />
              ))}
            </View>
          </View>
        ) : (
          // Fetch prompt card
          <Animated.View
            entering={FadeInDown.delay(220).springify().damping(18)}
            className="bg-card border-border mb-3 items-center rounded-2xl border px-6 py-8"
          >
            <View className="bg-primary/10 mb-3 rounded-2xl p-4">
              <Icon icon={Diamond01Icon} className="text-primary size-7" />
            </View>
            <Text className="text-foreground mb-1 text-base font-bold">Get Live Market Data</Text>
            <Text className="text-muted-foreground mb-5 text-center text-sm leading-5">
              Real-time price, volume, market cap and more.
            </Text>
            <Animated.View style={fetchBtnStyle}>
              <Pressable
                onPress={handleFetchMarket}
                disabled={loadingMarket}
                className="bg-primary items-center rounded-full px-8 py-3.5 active:opacity-80"
              >
                {loadingMarket ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text className="text-primary-foreground text-sm font-bold">
                    Fetch Market Data
                  </Text>
                )}
              </Pressable>
            </Animated.View>
          </Animated.View>
        )}

        {/* ── Contract ── */}
        <Animated.View
          entering={FadeInDown.delay(280).springify().damping(18)}
          className="bg-card border-border mb-3 overflow-hidden rounded-2xl border"
        >
          <View className="border-border border-b px-5 py-3">
            <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
              Contract
            </Text>
          </View>
          <Pressable
            onPress={handleCopyMint}
            className="flex-row items-center justify-between px-5 py-4 active:opacity-70"
          >
            <Text className="text-muted-foreground font-mono flex-1 text-sm" numberOfLines={1}>
              {short(mint, 16)}
            </Text>
            <View
              className={[
                'flex-row items-center gap-1.5 rounded-xl px-3 py-2',
                copiedMint ? 'bg-primary/15' : 'bg-muted',
              ].join(' ')}
            >
              <Icon
                icon={Copy01Icon}
                className={`size-3.5 ${copiedMint ? 'text-primary' : 'text-muted-foreground'}`}
              />
              <Text
                className={`text-xs font-semibold ${copiedMint ? 'text-primary' : 'text-muted-foreground'}`}
              >
                {copiedMint ? 'Copied!' : 'Copy'}
              </Text>
            </View>
          </Pressable>
        </Animated.View>

        {/* ── External Links ── */}
        <Animated.View entering={FadeInDown.delay(340).springify().damping(18)} className="mb-10">
          <Text className="text-muted-foreground mb-3 mt-2 px-1 text-[10px] font-bold uppercase tracking-widest">
            Explore
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <Pressable
              onPress={openSolscan}
              className="bg-card border-border flex-row items-center gap-2 rounded-full border px-5 py-3 active:opacity-70"
            >
              <Icon icon={ExternalLink} className="text-primary size-4" />
              <Text className="text-foreground text-sm font-semibold">Solscan</Text>
            </Pressable>
            <Pressable
              onPress={openJupiter}
              className="bg-card border-border flex-row items-center gap-2 rounded-full border px-5 py-3 active:opacity-70"
            >
              <Icon icon={Link01Icon} className="text-primary size-4" />
              <Text className="text-foreground text-sm font-semibold">Jupiter</Text>
            </Pressable>
            <Pressable
              onPress={openDexscreener}
              className="bg-card border-border flex-row items-center gap-2 rounded-full border px-5 py-3 active:opacity-70"
            >
              <Icon icon={BarChartFreeIcons} className="text-primary size-4" />
              <Text className="text-foreground text-sm font-semibold">DexScreener</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaViewUniwind>
  )
}
