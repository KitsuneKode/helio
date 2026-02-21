/**
 * Swap3 — Definitive swap screen
 *
 * Fixes from previous iterations:
 *  - Label clipping: label on its own row, input+chip side-by-side (matches swap v1)
 *  - Dynamic font size: shrinks for large amounts (≤5 = 40px, ≤7 = 34px, ≤9 = 28px, 10+ = 24px)
 *  - Theme-consistent colors: bg-primary CTA, text-foreground amounts, theme-aware TextInput
 *  - ThemeToggle in header (replaces non-functional settings button)
 *  - Animation: opposite translateY on card contents (pay ↓, receive ↑) gives real swap feel
 *    no more panelScale squeeze that caused the "bouncy rerender" look
 *  - Slippage section placed BEFORE quote card
 *  - No hardcoded hex design tokens — uses theme className throughout
 */

import { useCallback, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useUniwind } from 'uniwind'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimatedViewUniwind, SafeAreaViewUniwind } from '@/components/styled-uniwind-components'
import { ThemeToggle } from '@/components/theme-toggle-button'
import { ArrowUpDownIcon, ArrowDown01Icon, ZapIcon } from '@hugeicons/core-free-icons'
import { fetchSwapQuote, type SwapQuote } from '@/lib/swap'

// ─── Tokens ───────────────────────────────────────────────────────────────────

type Token = {
  mint: string
  symbol: string
  logo: string
  decimals: number
}

const SOL: Token = {
  mint: 'So11111111111111111111111111111111111111112',
  symbol: 'SOL',
  logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  decimals: 9,
}

const USDC: Token = {
  mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  symbol: 'USDC',
  logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  decimals: 6,
}

const SLIPPAGE_OPTS = ['0.5', '1.0', '2.0'] as const
type SlippageOpt = (typeof SLIPPAGE_OPTS)[number]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rawToDisplay(raw: string, decimals: number): string {
  const n = parseInt(raw, 10)
  if (isNaN(n)) return '0'
  const val = n / 10 ** decimals
  return val.toLocaleString(undefined, { maximumFractionDigits: decimals > 4 ? 4 : decimals })
}

function parsePriceImpact(pct: string): { str: string; bad: boolean } {
  const n = parseFloat(pct)
  if (isNaN(n) || n < 0.01) return { str: '< 0.01%', bad: false }
  return { str: `${n.toFixed(2)}%`, bad: n > 2 }
}

/** Shrink font as value string grows so 7+ digit amounts never overflow */
function getAmountFontSize(val: string): number {
  if (val.length <= 5) return 40
  if (val.length <= 7) return 34
  if (val.length <= 9) return 28
  return 24
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TokenLogo({ uri, size = 28 }: { uri: string; size?: number }) {
  const [err, setErr] = useState(false)
  return err ? (
    <View className="bg-primary/15 rounded-full" style={{ width: size, height: size }} />
  ) : (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      onError={() => setErr(true)}
    />
  )
}

// Scale micro-animation on press, pill bg-muted styling
function TokenChip({ token }: { token: Token }) {
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withTiming(0.93, { duration: 80 })
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 18, stiffness: 350 })
      }}
    >
      {/* AnimatedViewUniwind with only style= (no className) — avoids HOC merge issue */}
      <AnimatedViewUniwind style={animStyle}>
        <View className="bg-muted flex-row items-center gap-2 rounded-full px-3 py-2">
          <TokenLogo uri={token.logo} size={24} />
          <Text className="text-foreground text-sm font-bold">{token.symbol}</Text>
          <Icon icon={ArrowDown01Icon} className="text-muted-foreground size-3.5" />
        </View>
      </AnimatedViewUniwind>
    </Pressable>
  )
}

function SwapInfoRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text className="text-muted-foreground text-xs font-medium">{label}</Text>
      <Text
        className={`text-xs font-semibold ${highlight ? 'text-destructive' : 'text-foreground'}`}
      >
        {value}
      </Text>
    </View>
  )
}

// Mirrors the exact structure of the 4-row quote card so height never jumps on load
function QuoteCardSkeleton() {
  return (
    <View className="bg-card border-border mt-4 rounded-2xl border px-5 py-4">
      <View className="flex-row items-center justify-between py-1.5">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-3 w-36 rounded" />
      </View>
      <View className="bg-border my-1 h-px" />
      <View className="flex-row items-center justify-between py-1.5">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-3 w-14 rounded" />
      </View>
      <View className="bg-border my-1 h-px" />
      <View className="flex-row items-center justify-between py-1.5">
        <Skeleton className="h-3 w-10 rounded" />
        <Skeleton className="h-3 w-24 rounded" />
      </View>
      <View className="bg-border my-1 h-px" />
      <View className="flex-row items-center justify-between py-1.5">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-3 w-28 rounded" />
      </View>
    </View>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function Swap3Screen() {
  const { theme } = useUniwind()
  const isDark = (theme ?? 'light') === 'dark'
  // Theme-aware colors for TextInput (className not supported on native TextInput)
  const inputTextColor = isDark ? '#F4F4F5' : '#18181B'
  // zinc-500 (#71717A) is legible in both themes — dark enough on white, light enough on dark
  const placeholderColor = '#71717A'

  const [payAmount, setPayAmount] = useState('')
  const [slippage, setSlippage] = useState<SlippageOpt>('0.5')
  const [flipped, setFlipped] = useState(false)
  const [quote, setQuote] = useState<SwapQuote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)

  const fromToken = flipped ? USDC : SOL
  const toToken = flipped ? SOL : USDC

  // ── Shared values ─────────────────────────────────────────────────────────

  const flipRotate = useSharedValue(0) // flip button rotation (degrees)
  const flipOpacity = useSharedValue(1) // unified fade: amounts + chips all fade together on flip
  const outputOpacity = useSharedValue(1) // receive dims independently while fetching quote

  const flipButtonStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${flipRotate.value}deg` }],
  }))

  // Chips + pay amount share the same flipOpacity — everything fades as one unit
  const flipFadeStyle = useAnimatedStyle(() => ({
    opacity: flipOpacity.value,
  }))

  // Receive: multiplies both signals — dims for loading AND fades for flip
  const receiveContentStyle = useAnimatedStyle(() => ({
    opacity: flipOpacity.value * outputOpacity.value,
  }))

  // ── Quote fetching ────────────────────────────────────────────────────────

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerQuote = useCallback(
    (amount: string, from: Token, to: Token, slip: string) => {
      const parsed = parseFloat(amount)
      if (!amount || isNaN(parsed) || parsed <= 0) {
        setQuote(null)
        setQuoteError(null)
        setQuoteLoading(false)
        outputOpacity.value = withTiming(1, { duration: 120 })
        return
      }

      setQuoteLoading(true)
      setQuoteError(null)
      outputOpacity.value = withTiming(0.35, { duration: 150 })

      const rawAmount = Math.round(parsed * 10 ** from.decimals)
      const slippageBps = Math.round(parseFloat(slip) * 100)

      fetchSwapQuote(from.mint, to.mint, rawAmount, slippageBps).then((q) => {
        setQuoteLoading(false)
        if (!q) {
          setQuote(null)
          setQuoteError('No route found for this pair.')
          outputOpacity.value = withTiming(1, { duration: 120 })
        } else {
          setQuote(q)
          setQuoteError(null)
          outputOpacity.value = withTiming(1, { duration: 200 })
        }
      })
    },
    [outputOpacity],
  )

  const handleAmountChange = (val: string) => {
    setPayAmount(val)
    setQuote(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => triggerQuote(val, fromToken, toToken, slippage), 600)
  }

  const handleSlippage = (val: SlippageOpt) => {
    Haptics.selectionAsync()
    setSlippage(val)
    if (payAmount && parseFloat(payAmount) > 0) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => triggerQuote(payAmount, fromToken, toToken, val), 300)
    }
  }

  // ── Flip — premium unified fade ───────────────────────────────────────────
  //
  // Everything (chips + amounts) fades to 0 together (90ms ease-in),
  // state swaps at the darkest point via runOnJS, then fades back to 1 (200ms ease-out).
  // No translateY — no layout jump, no bounce. Just a clean refresh in place.
  // The rotating flip button is the sole movement cue.

  const handleFlip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    const newFlipped = !flipped
    const newFrom = newFlipped ? USDC : SOL
    const newTo = newFlipped ? SOL : USDC
    const currentPayAmount = payAmount
    const currentSlippage = slippage

    // Flip button rotates 180° — smooth cubic ease-out
    flipRotate.value = withTiming(flipRotate.value + 180, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    })

    // Everything fades out together, state changes at darkest point, fades back in
    const applyFlip = () => {
      setFlipped(newFlipped)
      setQuote(null)
      setQuoteError(null)
      if (currentPayAmount && parseFloat(currentPayAmount) > 0) {
        triggerQuote(currentPayAmount, newFrom, newTo, currentSlippage)
      } else {
        outputOpacity.value = withTiming(1, { duration: 120 })
      }
    }

    flipOpacity.value = withTiming(0, { duration: 90, easing: Easing.in(Easing.quad) }, () => {
      runOnJS(applyFlip)()
      flipOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) })
    })
  }

  // ── Derived values ────────────────────────────────────────────────────────

  const parsedPay = parseFloat(payAmount) || 0
  const receiveDisplay = quote ? rawToDisplay(quote.outAmount, toToken.decimals) : ''

  const payFontSize = getAmountFontSize(payAmount || '0')
  const receiveFontSize = getAmountFontSize(receiveDisplay || '0')

  const rateStr =
    quote && parsedPay > 0
      ? (() => {
          const out = parseInt(quote.outAmount) / 10 ** toToken.decimals
          const rate = (out / parsedPay).toLocaleString(undefined, { maximumFractionDigits: 4 })
          return `1 ${fromToken.symbol} ≈ ${rate} ${toToken.symbol}`
        })()
      : null

  const impact = quote ? parsePriceImpact(quote.priceImpactPct) : null
  const minReceived = quote
    ? `${rawToDisplay(quote.otherAmountThreshold, toToken.decimals)} ${toToken.symbol}`
    : null

  const isReady = !!quote && !quoteLoading && parsedPay > 0
  const canSwap = isReady

  const ctaLabel = quoteLoading
    ? 'Getting quote…'
    : canSwap
      ? `Swap ${fromToken.symbol} → ${toToken.symbol}`
      : quoteError
        ? 'No route available'
        : parsedPay > 0
          ? 'Getting quote…'
          : 'Enter an amount'

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaViewUniwind className="bg-background flex-1" edges={['top', 'bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="pb-12"
      >
        <View className="px-5 pb-4 pt-4">
          {/* ── Header — matches swap v1 style ── */}
          <View className="mb-6 flex-row items-center justify-between">
            <View>
              <Text className="text-foreground text-2xl font-bold tracking-tight">Swap</Text>
              <Text className="text-muted-foreground mt-0.5 text-xs font-medium">
                via Jupiter Aggregator
              </Text>
            </View>
            <ThemeToggle />
          </View>

          {/* ── YOU SELL card — bg-card (bright/input feel) ── */}
          <View className="bg-card border-border rounded-t-2xl border border-b-0 px-5 pb-8 pt-5 ">
            <View className="mb-4 flex-row items-center justify-between">
              <Text
                numberOfLines={1}
                className="text-muted-foreground text-xs font-semibold uppercase tracking-widest"
              >
                You Sell
              </Text>
              {/* flipFadeStyle fades the chip alongside the amount on flip */}
              <AnimatedViewUniwind style={flipFadeStyle}>
                <TokenChip token={fromToken} />
              </AnimatedViewUniwind>
            </View>
            <AnimatedViewUniwind style={flipFadeStyle}>
              <TextInput
                value={payAmount}
                onChangeText={handleAmountChange}
                placeholder="0"
                placeholderTextColor={placeholderColor}
                keyboardType="decimal-pad"
                style={{
                  fontSize: payFontSize,
                  fontWeight: '800',
                  color: inputTextColor,
                  letterSpacing: -1,
                }}
              />
            </AnimatedViewUniwind>
          </View>

          {/* ── FLIP button — overlaps seam ── */}
          <View className="items-center" style={{ marginVertical: -16, zIndex: 10 }}>
            <Pressable onPress={handleFlip}>
              {/* Rotation in style only; bg/border via inner View className */}
              <AnimatedViewUniwind style={flipButtonStyle}>
                <View className="bg-background border-border h-10 w-10 items-center justify-center rounded-xl border-2">
                  <Icon icon={ArrowUpDownIcon} className="text-primary size-5" />
                </View>
              </AnimatedViewUniwind>
            </Pressable>
          </View>

          {/* ── YOU BUY card — bg-muted (output/read-only feel, visually distinct from sell) ── */}
          <View className="bg-muted/30 border-border shadow-2xl rounded-b-2xl border border-t-0 px-5 py-3">
            <View className="mb-2 flex-row items-center justify-between">
              <Text
                numberOfLines={1}
                className="text-muted-foreground text-xs font-semibold uppercase tracking-widest"
              >
                You Buy
              </Text>
              <AnimatedViewUniwind style={flipFadeStyle}>
                <TokenChip token={toToken} />
              </AnimatedViewUniwind>
            </View>
            {/* receiveContentStyle: flipOpacity * outputOpacity — fades on flip AND dims while loading */}
            <AnimatedViewUniwind style={receiveContentStyle}>
              <Text
                numberOfLines={1}
                className={receiveDisplay ? 'text-foreground' : 'text-foreground/40'}
                style={{
                  fontSize: receiveFontSize,
                  fontWeight: '800',
                  letterSpacing: -1,
                  lineHeight: receiveFontSize + 14,
                }}
              >
                {receiveDisplay || '0'}
              </Text>
            </AnimatedViewUniwind>

            {quoteError && (
              <Text className="text-destructive mt-2 text-xs font-medium justify-center items-center align-center">
                {quoteError}
              </Text>
            )}
          </View>

          {/* ── Slippage (before quote card) ── */}
          <View className="mt-4">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                Slippage Tolerance
              </Text>
              <Text className="text-primary text-xs font-bold">{slippage}%</Text>
            </View>
            <View className="flex-row gap-2">
              {SLIPPAGE_OPTS.map((opt) => {
                const active = slippage === opt
                return (
                  <Pressable
                    key={opt}
                    onPress={() => handleSlippage(opt)}
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
          </View>

          {/* ── Quote card — detailed 4-row layout (when ready) ── */}
          {isReady && rateStr && (
            <View className="bg-card border-border mt-4 rounded-2xl border px-5 py-4">
              <SwapInfoRow label="Exchange Rate" value={rateStr} />
              <View className="bg-border my-1 h-px" />
              <SwapInfoRow
                label="Price Impact"
                value={impact?.str ?? '< 0.01%'}
                highlight={impact?.bad}
              />
              <View className="bg-border my-1 h-px" />
              <SwapInfoRow label="Route" value={`${fromToken.symbol} → ${toToken.symbol}`} />
              <View className="bg-border my-1 h-px" />
              <SwapInfoRow label="Min. Received" value={minReceived ?? ''} />
            </View>
          )}

          {/* Skeleton mirrors exact quote card structure — no layout jump on load */}
          {quoteLoading && parsedPay > 0 && <QuoteCardSkeleton />}

          {/* ── CTA — bg-primary/30 when not ready, full bg-primary when loading or ready ── */}
          <Pressable
            className={[
              'mt-5 items-center justify-center rounded-2xl py-4 active:opacity-85',
              canSwap || (quoteLoading && parsedPay > 0) ? 'bg-primary' : 'bg-primary/30',
            ].join(' ')}
            onPress={() => {
              if (!payAmount || parsedPay <= 0) {
                Alert.alert('Enter an amount', 'Type how much you want to swap first.')
                return
              }
              if (quoteLoading) return
              if (quoteError) {
                Alert.alert(
                  'No route',
                  'No swap route found for this pair. Try a different amount.',
                )
                return
              }
              if (canSwap) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
                // TODO: wallet connect + execute swap via Jupiter
              }
            }}
          >
            {quoteLoading && parsedPay > 0 ? (
              <View className="flex-row items-center gap-2.5">
                <ActivityIndicator size="small" color={isDark ? '#000000' : '#ffffff'} />
                <Text className="text-primary-foreground text-xl font-semibold">
                  Getting quote…
                </Text>
              </View>
            ) : (
              <Text
                className={[
                  'text-xl font-semibold',
                  canSwap ? 'text-primary-foreground' : 'text-primary-foreground/50',
                ].join(' ')}
              >
                {ctaLabel}
              </Text>
            )}
          </Pressable>

          {/* ── Footer ── */}
          <View className="mt-5 flex-row items-center justify-center gap-1.5">
            <Icon icon={ZapIcon} className="text-primary size-3.5" />
            <Text className="text-muted-foreground text-xs font-semibold">
              Powered by <Text className="text-primary text-xs font-bold">Jupiter</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaViewUniwind>
  )
}
