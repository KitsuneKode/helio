import { useState } from 'react'
import { Pressable, ScrollView, TextInput, View, Image } from 'react-native'
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
import { SafeAreaViewUniwind } from '@/components/styled-uniwind-components'
import {
  ArrowUpDownIcon,
  ChevronDown,
  Settings01Icon,
  InformationCircleIcon,
  ZapIcon,
} from '@hugeicons/core-free-icons'

// ─────────────────────────────────────────────────────────────────────────────
// Mock token data — demonstrating the UI with SOL & USDC
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_SOL = {
  symbol: 'SOL',
  name: 'Solana',
  logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  price: 185.42,
}
const MOCK_USDC = {
  symbol: 'USDC',
  name: 'USD Coin',
  logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  price: 1.0,
}

const SLIPPAGE_OPTIONS = ['0.5', '1.0', '2.0']

// ─────────────────────────────────────────────────────────────────────────────
// Token logo with fallback
// ─────────────────────────────────────────────────────────────────────────────

const TokenLogo = ({ uri, size = 36 }: { uri: string; size?: number }) => {
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

// ─────────────────────────────────────────────────────────────────────────────
// Token Selector chip (summary, non-interactive in this demo)
// ─────────────────────────────────────────────────────────────────────────────

const TokenChip = ({ token }: { token: typeof MOCK_SOL }) => (
  <View className="bg-muted flex-row items-center gap-2.5 rounded-full px-3 py-2">
    <TokenLogo uri={token.logo} size={26} />
    <Text className="text-foreground text-sm font-bold">{token.symbol}</Text>
    <Icon icon={ChevronDown} className="text-muted-foreground size-4" />
  </View>
)

// ─────────────────────────────────────────────────────────────────────────────
// Info row inside swap summary
// ─────────────────────────────────────────────────────────────────────────────

const SwapInfoRow = ({ label, value }: { label: string; value: string }) => (
  <View className="flex-row items-center justify-between py-1.5">
    <Text className="text-muted-foreground text-xs font-medium">{label}</Text>
    <Text className="text-foreground text-xs font-semibold">{value}</Text>
  </View>
)

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────

export default function SwapScreen() {
  const [payAmount, setPayAmount] = useState('')
  const [slippage, setSlippage] = useState('0.5')
  const [flipped, setFlipped] = useState(false)

  // Tokens (flippable)
  const fromToken = flipped ? MOCK_USDC : MOCK_SOL
  const toToken = flipped ? MOCK_SOL : MOCK_USDC

  // Derived receive amount from mock prices
  const parsedPay = parseFloat(payAmount) || 0
  const receiveAmount =
    parsedPay > 0
      ? ((parsedPay * fromToken.price) / toToken.price).toFixed(toToken.symbol === 'USDC' ? 2 : 6)
      : ''

  const payUsd =
    parsedPay > 0
      ? `≈ $${(parsedPay * fromToken.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
      : null

  // ── Flip animation ──
  const flipRotation = useSharedValue(0) // track cumulative half-turns
  const flipPressScale = useSharedValue(1)

  const handleFlip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    flipRotation.value = withSpring(flipRotation.value + 1, {
      damping: 14,
      stiffness: 200,
    })
    flipPressScale.value = withSpring(0.88, { damping: 12 }, () => {
      flipPressScale.value = withSpring(1)
    })
    setFlipped((f) => !f)
  }

  const flipStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(flipRotation.value, [0, 1], [0, 180])}deg` },
      { scale: flipPressScale.value },
    ],
  }))

  // ── Card entrance ──

  return (
    <SafeAreaViewUniwind className="bg-background flex-1" edges={['top', 'bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeIn.duration(250)} className="px-5 pt-6 pb-4">
          {/* Header */}
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

          {/* ── PAY card ── */}
          <Animated.View
            entering={FadeInDown.delay(80).springify().damping(18)}
            className="bg-card border-border rounded-2xl border px-5 pt-5 pb-4"
          >
            <Text className="text-muted-foreground mb-3 text-[10px] font-bold uppercase tracking-widest">
              You Pay
            </Text>
            <View className="flex-row items-center gap-3">
              {/* Amount input */}
              <TextInput
                value={payAmount}
                onChangeText={setPayAmount}
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

            {payUsd && (
              <Animated.Text
                entering={FadeIn.duration(300)}
                className="text-muted-foreground font-mono mt-1.5 text-xs"
              >
                {payUsd}
              </Animated.Text>
            )}
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

          {/* ── RECEIVE card ── */}
          <Animated.View
            entering={FadeInDown.delay(140).springify().damping(18)}
            className="bg-card border-border rounded-2xl border px-5 pt-5 pb-4"
          >
            <Text className="text-muted-foreground mb-3 text-[10px] font-bold uppercase tracking-widest">
              You Receive
            </Text>
            <View className="flex-row items-center gap-3">
              <Text
                className={[
                  'flex-1 text-5xl font-extrabold tracking-tighter',
                  receiveAmount ? 'text-foreground' : 'text-muted-foreground/40',
                ].join(' ')}
                numberOfLines={1}
              >
                {receiveAmount || '0'}
              </Text>
              <TokenChip token={toToken} />
            </View>

            {receiveAmount && parsedPay > 0 && (
              <Text className="text-muted-foreground font-mono mt-1.5 text-xs">
                ≈ $
                {(parseFloat(receiveAmount) * toToken.price).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </Text>
            )}
          </Animated.View>

          {/* ── Slippage selector ── */}
          <Animated.View entering={FadeInDown.delay(200).springify().damping(18)} className="mt-4">
            <View className="flex-row items-center justify-between mb-2">
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
                    onPress={() => {
                      Haptics.selectionAsync()
                      setSlippage(opt)
                    }}
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

          {/* ── Route info ── */}
          {parsedPay > 0 && (
            <Animated.View
              entering={FadeInDown.delay(60).springify().damping(20)}
              className="bg-card border-border mt-4 rounded-2xl border px-5 py-4"
            >
              <SwapInfoRow
                label="Exchange Rate"
                value={`1 ${fromToken.symbol} ≈ ${(fromToken.price / toToken.price).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${toToken.symbol}`}
              />
              <View className="bg-border my-1 h-px" />
              <SwapInfoRow label="Price Impact" value="< 0.01%" />
              <View className="bg-border my-1 h-px" />
              <SwapInfoRow label="Route" value={`${fromToken.symbol} → ${toToken.symbol}`} />
              <View className="bg-border my-1 h-px" />
              <SwapInfoRow
                label="Min. Received"
                value={`${(parseFloat(receiveAmount) * (1 - parseFloat(slippage) / 100)).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${toToken.symbol}`}
              />
            </Animated.View>
          )}

          {/* ── Swap CTA ── */}
          <Animated.View entering={FadeInDown.delay(280).springify().damping(18)} className="mt-4">
            <Pressable
              className={[
                'items-center justify-center rounded-2xl py-4 active:opacity-85',
                parsedPay > 0 ? 'bg-primary' : 'bg-primary/30',
              ].join(' ')}
              disabled={parsedPay <= 0}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)}
            >
              <Text
                className={`text-base font-extrabold tracking-wide ${parsedPay > 0 ? 'text-primary-foreground' : 'text-primary-foreground/40'}`}
              >
                {parsedPay > 0 ? `Swap ${fromToken.symbol} → ${toToken.symbol}` : 'Enter an amount'}
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
