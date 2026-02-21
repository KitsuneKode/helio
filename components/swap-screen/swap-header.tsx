import { View } from 'react-native'
import { ThemeToggle } from '@/components/theme-toggle-button'
import { Text } from '@/components/ui/text'

export function SwapHeader() {
  return (
    <View className="mb-6 flex-row items-center justify-between">
      <View>
        <Text className="text-foreground text-2xl font-bold tracking-tight">Swap</Text>
        <Text className="text-muted-foreground mt-0.5 text-xs font-medium">
          via Jupiter Aggregator
        </Text>
      </View>
      <ThemeToggle />
    </View>
  )
}
