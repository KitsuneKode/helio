import { Pressable, View } from 'react-native'
import { ArrowUpDownIcon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { AnimatedViewUniwind } from '@/components/styled-uniwind-components'
import { useAnimatedStyle, type SharedValue } from 'react-native-reanimated'

type SwapFlipButtonProps = {
  flipRotate: SharedValue<number>
  onPress: () => void
}

export function SwapFlipButton({ flipRotate, onPress }: SwapFlipButtonProps) {
  const flipButtonStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${flipRotate.value}deg` }],
  }))

  return (
    <View className="items-center" style={{ marginVertical: -16, zIndex: 10 }}>
      <Pressable onPress={onPress}>
        <AnimatedViewUniwind style={flipButtonStyle}>
          <View className="bg-background border-border h-10 w-10 items-center justify-center rounded-xl border-2">
            <Icon icon={ArrowUpDownIcon} className="text-primary size-5" />
          </View>
        </AnimatedViewUniwind>
      </Pressable>
    </View>
  )
}
