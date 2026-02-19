import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const SwapScreen = () => {
  return (
    <SafeAreaView className="bg-background flex-1 items-center justify-center">
      <View className="text-primary flex-1">
        <Text className="flex-1">Helloo</Text>
      </View>
    </SafeAreaView>
  )
}

export default SwapScreen
