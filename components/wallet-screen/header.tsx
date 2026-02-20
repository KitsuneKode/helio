import { View } from 'react-native'
import { Text } from '../ui/text'

export const HeaderText = () => {
  return (
    <View className="justify-start gap-0.5">
      <Text className="text-foreground text-2xl font-bold tracking-tight">SolScan</Text>
      <Text className="text-muted-foreground text-xs">Explore any Solana wallet</Text>
    </View>
  )
}
