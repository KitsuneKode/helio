import { Pressable, Text } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

type SwapArrowButtonProps = {
  onPress: () => void
}

function SwapArrowButton({ onPress }: SwapArrowButtonProps) {
  const rotate = useSharedValue(0)

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }))

  const handlePress = async () => {
    rotate.value = withSpring(rotate.value + 180, { damping: 12, stiffness: 200 })
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  return (
    <Pressable onPress={handlePress} className="self-center active:opacity-70">
      <Animated.View
        style={[
          animStyle,
          {
            height: 40,
            width: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(99,102,241,0.12)',
            borderWidth: 1,
            borderColor: 'rgba(99,102,241,0.2)',
          },
        ]}
      >
        <Text style={{ fontSize: 18 }}>⇅</Text>
      </Animated.View>
    </Pressable>
  )
}

export { SwapArrowButton }
