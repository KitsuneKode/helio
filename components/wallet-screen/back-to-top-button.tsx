import { Pressable } from 'react-native'
import type { ScrollView } from 'react-native'
import type { RefObject } from 'react'
import { AnimatedViewUniwind } from '@/components/styled-uniwind-components'
import {
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'
import { ArrowUp01Icon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'

type Props = {
  scrollY: SharedValue<number>
  scrollRef: RefObject<ScrollView | null>
}

export const BackToTopButton = ({ scrollY, scrollRef }: Props) => {
  const opacity = useDerivedValue(() => withTiming(scrollY.value > 250 ? 1 : 0, { duration: 200 }))

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: opacity.value > 0 ? 'auto' : 'none',
  }))

  const handlePress = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true })
  }

  return (
    <AnimatedViewUniwind
      style={[
        animatedStyle,
        {
          position: 'absolute',
          bottom: 24,
          right: 20,
          zIndex: 50,
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        className="active:opacity-80 bg-primary/50"
        style={{
          borderRadius: 24,
          width: 48,
          height: 48,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon icon={ArrowUp01Icon} size={24} className=" text-primary-foreground" />
      </Pressable>
    </AnimatedViewUniwind>
  )
}
