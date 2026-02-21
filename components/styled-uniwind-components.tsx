import Animated from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'

export const SafeAreaViewUniwind = withUniwind(SafeAreaView)

export const AnimatedViewUniwind = withUniwind(Animated.View)
