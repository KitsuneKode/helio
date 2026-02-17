import { ScrollView, TouchableOpacity, Text } from 'react-native'

const TransactionScreen = () => {
  return (
    <ScrollView contentContainerClassName="flex-1 items-center justify-center">
      <TouchableOpacity activeOpacity={0.8} className="m-4 rounded-lg bg-amber-500 p-4">
        <Text className="text-amber-300">hi</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

export default TransactionScreen
