import { useCallback } from 'react'
import { AnimatedViewUniwind } from '@/components/styled-uniwind-components'
import { Pressable, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  type SharedValue,
} from 'react-native-reanimated'
import { FavouriteIcon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { useWatchlistStore } from '@/store/watchlist-store'

type Props = {
  address: string
}

// ─── Burst Particle ─────────────────────────────────────────────────────────

type ParticleProps = {
  angle: number
  delay: number
  scale: SharedValue<number>
  opacity: SharedValue<number>
  color: string
}

function Particle({ angle, delay: _delay, scale, opacity, color }: ParticleProps) {
  const rad = (angle * Math.PI) / 180
  const distance = 28

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: Math.cos(rad) * distance * scale.value },
      { translateY: Math.sin(rad) * distance * scale.value },
      { scale: 1 - scale.value * 0.3 },
    ],
    opacity: opacity.value,
  }))

  return (
    <AnimatedViewUniwind
      style={[
        {
          position: 'absolute',
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: color,
          marginLeft: -3,
          marginTop: -3,
        },
        style,
      ]}
    />
  )
}

// ─── Config ──────────────────────────────────────────────────────────────────

const PARTICLE_CONFIGS = [
  { angle: 0, color: '#ff4d6d', delay: 0 },
  { angle: 60, color: '#ff6b6b', delay: 20 },
  { angle: 120, color: '#ff8fa3', delay: 40 },
  { angle: 180, color: '#c9184a', delay: 10 },
  { angle: 240, color: '#ff0054', delay: 30 },
  { angle: 300, color: '#ffb3c1', delay: 50 },
] as const

// ─── WatchButton ─────────────────────────────────────────────────────────────

export function WatchButton({ address }: Props) {
  const toggleWatchlist = useWatchlistStore((s) => s.toggleWatchlist)
  const isWatched = useWatchlistStore((s) => s.isWatched(address))

  const heartScale = useSharedValue(1)

  // Particle shared values
  const pScale0 = useSharedValue(0)
  const pScale1 = useSharedValue(0)
  const pScale2 = useSharedValue(0)
  const pScale3 = useSharedValue(0)
  const pScale4 = useSharedValue(0)
  const pScale5 = useSharedValue(0)

  const pOpacity0 = useSharedValue(0)
  const pOpacity1 = useSharedValue(0)
  const pOpacity2 = useSharedValue(0)
  const pOpacity3 = useSharedValue(0)
  const pOpacity4 = useSharedValue(0)
  const pOpacity5 = useSharedValue(0)

  const particleScales = [pScale0, pScale1, pScale2, pScale3, pScale4, pScale5]
  const particleOpacities = [pOpacity0, pOpacity1, pOpacity2, pOpacity3, pOpacity4, pOpacity5]

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }))

  const burstParticles = useCallback(() => {
    particleScales.forEach((ps, i) => {
      const d = PARTICLE_CONFIGS[i].delay
      ps.value = 0
      particleOpacities[i].value = 0
      ps.value = withDelay(d, withTiming(1, { duration: 300 }))
      particleOpacities[i].value = withDelay(
        d,
        withSequence(withTiming(1, { duration: 80 }), withTiming(0, { duration: 300 })),
      )
    })
  }, [particleScales, particleOpacities])

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    toggleWatchlist(address)

    // Quick squish → clean spring back (no double-spring wobble)
    heartScale.value = withSequence(
      withTiming(0.8, { duration: 60 }),
      withSpring(1, { damping: 10, stiffness: 300 }),
    )

    // Particles burst only when adding to watchlist
    if (!isWatched) burstParticles()
  }, [address, isWatched, toggleWatchlist, heartScale, burstParticles])

  return (
    <Pressable onPress={handlePress} hitSlop={12}>
      <View className="size-6 items-center justify-center overflow-visible">
        {/* Burst particles */}
        {PARTICLE_CONFIGS.map((cfg, i) => (
          <Particle
            key={cfg.angle}
            angle={cfg.angle}
            delay={cfg.delay}
            scale={particleScales[i]}
            opacity={particleOpacities[i]}
            color={cfg.color}
          />
        ))}

        {/* Animated heart */}
        <AnimatedViewUniwind style={heartStyle}>
          <Icon
            icon={FavouriteIcon}
            className={
              isWatched ? 'text-rose-500 size-[22px]' : 'text-muted-foreground size-[22px]'
            }
            fill={isWatched ? 'currentColor' : 'none'}
            strokeWidth={isWatched ? 0 : 1.75}
          />
        </AnimatedViewUniwind>
      </View>
    </Pressable>
  )
}
