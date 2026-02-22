import Animated from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

export const SafeAreaViewUniwind = withUniwind(SafeAreaView)

export const AnimatedViewUniwind = withUniwind(Animated.View)

export const KeyboardAwareScrollViewUniwind = withUniwind(KeyboardAwareScrollView)
