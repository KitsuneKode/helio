import { View } from 'react-native'
import { Text } from '../ui/text'

export const HeaderText = () => {
  return (
    <View className="border-card flex-1 justify-start gap-0.5">
      <Text className="text-primary pl-2 text-start text-3xl font-bold">SolScan</Text>

      <Text className="text-muted-foreground/40 text-md pl-2" variant="h2">
        Explore any Solana wallet
      </Text>
    </View>
  )
}
