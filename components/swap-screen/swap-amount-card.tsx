import { useState, type ReactNode } from 'react'
import { Image, Pressable, TextInput, View } from 'react-native'
import { ArrowDown01Icon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { AnimatedViewUniwind } from '@/components/styled-uniwind-components'
import type { Token } from '@/types/swap-screen'
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'

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

type SwapAmountCardProps = {
  fromToken: Token
  toToken: Token
  payAmount: string
  onAmountChange: (value: string) => void
  payFontSize: number
  receiveDisplay: string
  receiveFontSize: number
  quoteError: string | null
  inputTextColor: string
  placeholderColor: string
  flipOpacity: SharedValue<number>
  outputOpacity: SharedValue<number>
  middleSlot?: ReactNode
}

export function SwapAmountCard({
  fromToken,
  toToken,
  payAmount,
  onAmountChange,
  payFontSize,
  receiveDisplay,
  receiveFontSize,
  quoteError,
  inputTextColor,
  placeholderColor,
  flipOpacity,
  outputOpacity,
  middleSlot,
}: SwapAmountCardProps) {
  const flipFadeStyle = useAnimatedStyle(() => ({
    opacity: flipOpacity.value,
  }))

  const receiveContentStyle = useAnimatedStyle(() => ({
    opacity: flipOpacity.value * outputOpacity.value,
  }))

  return (
    <>
      <View className="bg-card border-border rounded-t-2xl border border-b-0 px-5 pb-8 pt-5">
        <View className="mb-4 flex-row items-center justify-between">
          <Text
            numberOfLines={1}
            className="text-muted-foreground text-xs font-semibold uppercase tracking-widest"
          >
            You Sell
          </Text>
          <AnimatedViewUniwind style={flipFadeStyle}>
            <TokenChip token={fromToken} />
          </AnimatedViewUniwind>
        </View>
        <AnimatedViewUniwind style={flipFadeStyle}>
          <TextInput
            value={payAmount}
            onChangeText={onAmountChange}
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

      {middleSlot}

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
    </>
  )
}
