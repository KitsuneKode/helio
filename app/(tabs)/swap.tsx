import { useCallback, useEffect, useRef, useState } from 'react'
import { Image, Pressable, ScrollView, TextInput, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { Skeleton } from '@/components/ui/skeleton'
import { SafeAreaViewUniwind } from '@/components/styled-uniwind-components'
import {
  ArrowUpDownIcon,
  ArrowDown01Icon,
  Settings01Icon,
  InformationCircleIcon,
  ZapIcon,
} from '@hugeicons/core-free-icons'
import { fetchSwapQuote, type SwapQuote } from '@/lib/swap'

// ─────────────────────────────────────────────────────────────────────────────
// Token definitions
// ─────────────────────────────────────────────────────────────────────────────

type TokenOption = {
  mint: string
  symbol: string
  name: string
  logo: string
  decimals: number
}

const SOL: TokenOption = {
  mint: 'So11111111111111111111111111111111111111112',
  symbol: 'SOL',
  name: 'Solana',
  logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  decimals: 9,
}

const USDC: TokenOption = {
  mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  symbol: 'USDC',
  name: 'USD Coin',
  logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  decimals: 6,
}

// TODO: add more tokens + wire up to Jupiter token list API for search
const _POPULAR_TOKENS: TokenOption[] = [
  SOL,
  USDC,
  {
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    symbol: 'USDT',
    name: 'Tether USD',
    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg',
    decimals: 6,
  },
]

const SLIPPAGE_OPTIONS = ['0.5', '1.0', '2.0']

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function TokenLogo({ uri, size = 36 }: { uri: string; size?: number }) {
  const [err, setErr] = useState(false)
  return err ? (
    <View
      className="bg-primary/15 items-center justify-center rounded-full"
      style={{ width: size, height: size }}
    />
  ) : (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      onError={() => setErr(true)}
    />
  )
}

function TokenChip({ token }: { token: TokenOption }) {
  return (
    <View className="bg-muted flex-row items-center gap-2.5 rounded-full px-3 py-2">
      <TokenLogo uri={token.logo} size={26} />
      <Text className="text-foreground text-sm font-bold">{token.symbol}</Text>
      <Icon icon={ArrowDown01Icon} className="text-muted-foreground size-4" />
    </View>
  )
}

function SwapInfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text className="text-muted-foreground text-xs font-medium">{label}</Text>
      <Text className={`text-xs font-semibold ${highlight ? 'text-destructive' : 'text-foreground'}`}>
        {value}
      </Text>
    </View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function rawToDisplay(raw: string, decimals: number): string {
  const n = parseInt(raw, 10)
  if (isNaN(n)) return '0'
  const val = n / 10 ** decimals
  return val.toLocaleString(undefined, { maximumFractionDigits: decimals > 4 ? 4 : decimals })
}

function formatPriceImpact(pct: string): { str: string; bad: boolean } {
  const n = parseFloat(pct)
  if (isNaN(n) || n < 0.01) return { str: '< 0.01%', bad: false }
  return { str: `${n.toFixed(2)}%`, bad: n > 2 }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────

export default function SwapScreen() {
  const [payAmount, setPayAmount] = useState('')
  const [slippage, setSlippage] = useState('0.5')
  const [flipped, setFlipped] = useState(false)

  const [quote, setQuote] = useState<SwapQuote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)

  const fromToken = flipped ? USDC : SOL
  const toToken = flipped ? SOL : USDC

  // ── Quote fetching ──
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerQuote = useCallback(
    (amount: string, from: TokenOption, to: TokenOption, slip: string) => {
      const parsed = parseFloat(amount)
      if (!amount || isNaN(parsed) || parsed <= 0) {
        setQuote(null)
        setQuoteError(null)
        setQuoteLoading(false)
        return
      }
      setQuoteLoading(true)
      setQuoteError(null)
      const rawAmount = Math.round(parsed * 10 ** from.decimals)
      const slippageBps = Math.round(parseFloat(slip) * 100)
      fetchSwapQuote(from.mint, to.mint, rawAmount, slippageBps).then((q) => {
        setQuoteLoading(false)
        if (!q) {
          setQuote(null)
          setQuoteError('No route found for this pair.')
        } else {
          setQuote(q)
          setQuoteError(null)
        }
      })
    },
    [],
  )

  const handleAmountChange = (value: string) => {
    setPayAmount(value)
    setQuote(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      triggerQuote(value, fromToken, toToken, slippage)
    }, 600)
  }

  const handleSlippageChange = (val: string) => {
    Haptics.selectionAsync()
    setSlippage(val)
    if (payAmount && parseFloat(payAmount) > 0) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        triggerQuote(payAmount, fromToken, toToken, val)
      }, 300)
    }
  }

  // ── Flip ──
  const flipRotation = useSharedValue(0)
  const flipPressScale = useSharedValue(1)

  const handleFlip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    flipRotation.value = withSpring(flipRotation.value + 1, { damping: 14, stiffness: 200 })
    flipPressScale.value = withSpring(0.88, { damping: 12 }, () => {
      flipPressScale.value = withSpring(1)
    })
    setFlipped((f) => !f)
    setPayAmount('')
    setQuote(null)
    setQuoteError(null)
  }

  const flipStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(flipRotation.value, [0, 1], [0, 180])}deg` },
      { scale: flipPressScale.value },
    ],
  }))

  // ── Derived display values ──
  const parsedPay = parseFloat(payAmount) || 0
  const receiveDisplay = quote ? rawToDisplay(quote.outAmount, toToken.decimals) : ''
  const minReceivedDisplay = quote
    ? `${rawToDisplay(quote.otherAmountThreshold, toToken.decimals)} ${toToken.symbol}`
    : ''

  const rateStr =
    quote && parsedPay > 0
      ? (() => {
          const outAmt = parseInt(quote.outAmount) / 10 ** toToken.decimals
          const rate = (outAmt / parsedPay).toLocaleString(undefined, { maximumFractionDigits: 4 })
          return `1 ${fromToken.symbol} ≈ ${rate} ${toToken.symbol}`
        })()
      : parsedPay > 0
        ? null // loading
        : null

  const impact = quote ? formatPriceImpact(quote.priceImpactPct) : null

  const hasQuoteData = quote && parsedPay > 0
  const isReady = hasQuoteData && !quoteLoading

  return (
    <SafeAreaViewUniwind className="bg-background flex-1" edges={['top', 'bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeIn.duration(250)} className="px-5 pb-4 pt-6">

          {/* ── Header ── */}
          <View className="mb-6 flex-row items-center justify-between">
            <View>
              <Text className="text-foreground text-2xl font-extrabold tracking-tight">Swap</Text>
              <Text className="text-muted-foreground mt-0.5 text-xs font-medium">
                via Jupiter Aggregator
              </Text>
            </View>
            <Pressable className="bg-muted rounded-xl p-2.5 active:opacity-70">
              <Icon icon={Settings01Icon} className="text-muted-foreground size-5" />
            </Pressable>
          </View>

          {/* ── YOU PAY card ── */}
          <Animated.View
            entering={FadeInDown.delay(80).springify().damping(18)}
            className="bg-card border-border rounded-2xl border px-5 pb-4 pt-5"
          >
            <Text className="text-muted-foreground mb-3 text-[10px] font-bold uppercase tracking-widest">
              You Pay
            </Text>
            <View className="flex-row items-center gap-3">
              <TextInput
                value={payAmount}
                onChangeText={handleAmountChange}
                placeholder="0"
                placeholderTextColor="#555"
                keyboardType="decimal-pad"
                style={{
                  flex: 1,
                  fontSize: 40,
                  fontWeight: '800',
                  color: '#f0f0f0',
                  letterSpacing: -1,
                }}
              />
              <TokenChip token={fromToken} />
            </View>
          </Animated.View>

          {/* ── FLIP button ── */}
          <View className="my-[-14px] items-center" style={{ zIndex: 10 }}>
            <Animated.View style={flipStyle}>
              <Pressable
                onPress={handleFlip}
                className="bg-background border-border h-10 w-10 items-center justify-center rounded-xl border-2 active:opacity-70"
              >
                <Icon icon={ArrowUpDownIcon} className="text-primary size-5" />
              </Pressable>
            </Animated.View>
          </View>

          {/* ── YOU RECEIVE card ── */}
          <Animated.View
            entering={FadeInDown.delay(140).springify().damping(18)}
            className="bg-card border-border rounded-2xl border px-5 pb-4 pt-5"
          >
            <Text className="text-muted-foreground mb-3 text-[10px] font-bold uppercase tracking-widest">
              You Receive
            </Text>
            <View className="flex-row items-center gap-3">
              {quoteLoading ? (
                <View className="flex-1">
                  <Skeleton className="h-12 w-40 rounded-lg" />
                </View>
              ) : (
                <Text
                  className={[
                    'flex-1 text-5xl font-extrabold tracking-tighter',
                    receiveDisplay ? 'text-foreground' : 'text-muted-foreground/40',
                  ].join(' ')}
                  numberOfLines={1}
                >
                  {receiveDisplay || '0'}
                </Text>
              )}
              <TokenChip token={toToken} />
            </View>

            {quoteError && (
              <Text className="text-destructive mt-2 text-xs font-medium">{quoteError}</Text>
            )}
          </Animated.View>

          {/* ── Slippage selector ── */}
          <Animated.View
            entering={FadeInDown.delay(200).springify().damping(18)}
            className="mt-4"
          >
            <View className="mb-2 flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                  Slippage Tolerance
                </Text>
                <Icon icon={InformationCircleIcon} className="text-muted-foreground size-3.5" />
              </View>
              <Text className="text-primary text-xs font-bold">{slippage}%</Text>
            </View>
            <View className="flex-row gap-2">
              {SLIPPAGE_OPTIONS.map((opt) => {
                const active = slippage === opt
                return (
                  <Pressable
                    key={opt}
                    onPress={() => handleSlippageChange(opt)}
                    className={[
                      'flex-1 items-center rounded-xl border py-2.5 active:opacity-70',
                      active ? 'bg-primary/15 border-primary/40' : 'bg-card border-border',
                    ].join(' ')}
                  >
                    <Text
                      className={`text-sm font-bold ${active ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      {opt}%
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </Animated.View>

          {/* ── Route info (shown when quote is ready) ── */}
          {isReady && (
            <Animated.View
              entering={FadeInDown.delay(60).springify().damping(20)}
              className="bg-card border-border mt-4 rounded-2xl border px-5 py-4"
            >
              {rateStr && <SwapInfoRow label="Exchange Rate" value={rateStr} />}
              <View className="bg-border my-1 h-px" />
              <SwapInfoRow
                label="Price Impact"
                value={impact?.str ?? '< 0.01%'}
                highlight={impact?.bad}
              />
              <View className="bg-border my-1 h-px" />
              <SwapInfoRow
                label="Route"
                value={`${fromToken.symbol} → ${toToken.symbol}`}
              />
              <View className="bg-border my-1 h-px" />
              <SwapInfoRow label="Min. Received" value={minReceivedDisplay} />
            </Animated.View>
          )}

          {/* Show loading skeleton for route info while fetching */}
          {quoteLoading && parsedPay > 0 && (
            <Animated.View
              entering={FadeIn.duration(200)}
              className="bg-card border-border mt-4 rounded-2xl border px-5 py-4"
            >
              <View className="gap-3">
                <View className="flex-row justify-between">
                  <Skeleton className="h-3.5 w-28 rounded" />
                  <Skeleton className="h-3.5 w-32 rounded" />
                </View>
                <View className="flex-row justify-between">
                  <Skeleton className="h-3.5 w-20 rounded" />
                  <Skeleton className="h-3.5 w-16 rounded" />
                </View>
                <View className="flex-row justify-between">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton className="h-3.5 w-28 rounded" />
                </View>
              </View>
            </Animated.View>
          )}

          {/* ── Swap CTA ── */}
          <Animated.View
            entering={FadeInDown.delay(280).springify().damping(18)}
            className="mt-4"
          >
            <Pressable
              className={[
                'items-center justify-center rounded-2xl py-4 active:opacity-85',
                parsedPay > 0 && isReady ? 'bg-primary' : 'bg-primary/30',
              ].join(' ')}
              disabled={!isReady}
              onPress={() => {
                // TODO: wire up wallet connect + execute swap via Jupiter
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
              }}
            >
              <Text
                className={`text-base font-extrabold tracking-wide ${
                  parsedPay > 0 && isReady
                    ? 'text-primary-foreground'
                    : 'text-primary-foreground/40'
                }`}
              >
                {quoteLoading
                  ? 'Getting quote…'
                  : parsedPay > 0 && isReady
                    ? `Swap ${fromToken.symbol} → ${toToken.symbol}`
                    : parsedPay > 0
                      ? quoteError
                        ? 'No route available'
                        : 'Getting quote…'
                      : 'Enter an amount'}
              </Text>
            </Pressable>
          </Animated.View>

          {/* ── Powered by Jupiter ── */}
          <Animated.View
            entering={FadeInDown.delay(340).springify().damping(18)}
            className="mt-5 flex-row items-center justify-center gap-1.5"
          >
            <Icon icon={ZapIcon} className="text-primary size-3.5" />
            <Text className="text-muted-foreground text-xs font-semibold">
              Powered by <Text className="text-primary text-xs font-bold">Jupiter</Text>
            </Text>
          </Animated.View>

        </Animated.View>
      </ScrollView>
    </SafeAreaViewUniwind>
  )
}
