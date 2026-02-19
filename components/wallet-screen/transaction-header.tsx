import { View } from 'react-native'
import { Text } from '../ui/text'

export const TransactionHeader = () => {
  return (
    <View className="flex-1">
      <Text variant="large">Recent Transactions</Text>
    </View>
  )
}
