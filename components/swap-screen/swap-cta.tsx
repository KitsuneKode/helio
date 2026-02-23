import { useEffect } from 'react'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { CancelCircleIcon, CheckmarkCircle01Icon } from '@hugeicons/core-free-icons'
import {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { AnimatedViewUniwind } from '@/components/styled-uniwind-components'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { useResolveClassNames } from 'uniwind'

type SwapStatus = 'idle' | 'building' | 'signing' | 'success' | 'failed'

type SwapCtaProps = {
  canSwap: boolean
  ctaLabel: string
  parsedPay: number
  onPress: () => void
  connected: boolean
  connecting: boolean
  onConnect: () => void
  insufficientBalance: boolean
  fromSymbol: string
  swapStatus: SwapStatus
}

export function SwapCta({
  canSwap,
  ctaLabel,
  onPress,
  parsedPay,
  connected,
  connecting,
  onConnect,
  insufficientBalance,
  fromSymbol,
  swapStatus,
}: SwapCtaProps) {
  const { color } = useResolveClassNames('text-primary-foreground/50')

  const scale = useSharedValue(1)
  const translateX = useSharedValue(0)

  useEffect(() => {
    if (swapStatus === 'success') {
      scale.value = withSequence(
        withSpring(1.05, { damping: 8, stiffness: 400 }),
        withSpring(1, { damping: 12, stiffness: 200 }),
      )
    } else if (swapStatus === 'failed') {
      translateX.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      )
    }
  }, [swapStatus, scale, translateX])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: translateX.value }],
  }))

  if (swapStatus === 'success') {
    return (
      <AnimatedViewUniwind
        style={animatedStyle}
        className="mt-5 items-center justify-center rounded-2xl py-4 bg-primary"
      >
        <View className="flex-row items-center gap-2.5">
          <Icon icon={CheckmarkCircle01Icon} className="text-primary-foreground size-6" />
          <Text className="text-xl font-semibold text-primary-foreground">Swap Sent!</Text>
        </View>
      </AnimatedViewUniwind>
    )
  }

  if (swapStatus === 'failed') {
    return (
      <AnimatedViewUniwind
        style={animatedStyle}
        className="mt-5 items-center justify-center rounded-2xl py-4 bg-destructive/80"
      >
        <View className="flex-row items-center gap-2.5">
          <Icon icon={CancelCircleIcon} className="text-destructive-foreground size-6" />
          <Text className="text-xl font-semibold text-destructive-foreground">Swap Failed</Text>
        </View>
      </AnimatedViewUniwind>
    )
  }

  if (swapStatus === 'building') {
    return (
      <Pressable
        className="mt-5 items-center justify-center rounded-2xl py-4 bg-primary/30"
        disabled
      >
        <View className="flex-row items-center gap-2.5">
          <ActivityIndicator size="small" color={color} />
          <Text className="text-primary-foreground/40 text-xl font-semibold">
            Preparing Swap...
          </Text>
        </View>
      </Pressable>
    )
  }

  if (swapStatus === 'signing') {
    return (
      <Pressable
        className="mt-5 items-center justify-center rounded-2xl py-4 bg-primary/30"
        disabled
      >
        <View className="flex-row items-center gap-2.5">
          <ActivityIndicator size="small" color={color} />
          <Text className="text-primary-foreground/40 text-xl font-semibold">
            Confirm in Wallet...
          </Text>
        </View>
      </Pressable>
    )
  }

  if (!connected && !connecting) {
    return (
      <Pressable
        className="mt-5 items-center justify-center rounded-2xl py-4 active:opacity-85 bg-primary"
        onPress={onConnect}
      >
        <Text className="text-xl font-semibold text-primary-foreground">Connect Wallet</Text>
      </Pressable>
    )
  }

  if (connecting) {
    return (
      <Pressable
        className="mt-5 items-center justify-center rounded-2xl py-4 bg-primary/30"
        disabled
      >
        <View className="flex-row items-center gap-2.5">
          <ActivityIndicator size="small" color={color} />
          <Text className="text-primary-foreground/40 text-xl font-semibold">Connecting...</Text>
        </View>
      </Pressable>
    )
  }

  if (insufficientBalance) {
    return (
      <Pressable
        className="mt-5 items-center justify-center rounded-2xl py-4 bg-primary/30"
        disabled
      >
        <Text className="text-primary-foreground/40 text-xl font-semibold">
          Insufficient {fromSymbol}
        </Text>
      </Pressable>
    )
  }

  return (
    <Pressable
      className="mt-5 items-center justify-center rounded-2xl py-4 active:opacity-85 bg-primary"
      onPress={onPress}
      disabled={!canSwap}
    >
      {!canSwap ? (
        <View className="flex-row items-center gap-2.5">
          {parsedPay > 0 ? (
            <>
              <ActivityIndicator size="small" className="text-xl" color={color} />
              <Text className="text-primary-foreground/50 text-xl font-semibold">Loading ...</Text>
            </>
          ) : (
            <Text className="text-primary-foreground/50 text-xl font-semibold">
              Enter an Amount
            </Text>
          )}
        </View>
      ) : (
        <Text className="text-xl font-semibold text-primary-foreground">{ctaLabel}</Text>
      )}
    </Pressable>
  )
}
