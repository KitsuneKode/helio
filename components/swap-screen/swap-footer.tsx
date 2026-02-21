import { View } from 'react-native'
import { ZapIcon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'

export function SwapFooter() {
  return (
    <View className="mt-5 flex-row items-center justify-center gap-1.5">
      <Icon icon={ZapIcon} className="text-primary size-3.5" />
      <Text className="text-muted-foreground text-xs font-semibold">
        Powered by <Text className="text-primary text-xs font-bold">Jupiter</Text>
      </Text>
    </View>
  )
}
