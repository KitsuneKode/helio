import { useEffect } from 'react'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated'

type AnimatedCardProps = {
  delay: number
  children: React.ReactNode
}

export function AnimatedCard({ delay, children }: AnimatedCardProps) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(12)

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 280 }))
    translateY.value = withDelay(delay, withTiming(0, { duration: 280 }))
  }, [delay])

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return <Animated.View style={style}>{children}</Animated.View>
}
