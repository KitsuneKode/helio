import { View } from 'react-native'
import { Coins01Icon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'

export const EmptyTokens = () => {
  return (
    <View className="border-border mx-1 mt-1 mb-4 rounded-xl border border-dashed">
      <View className="items-center gap-2 px-6 py-8">
        <Icon icon={Coins01Icon} className="text-muted-foreground/40 size-7" />
        <View className="items-center gap-1">
          <Text variant="small" className="text-foreground">
            No tokens
          </Text>
          <Text variant="muted" className="max-w-[180px] text-center text-xs leading-relaxed">
            This wallet holds no SPL tokens.
          </Text>
        </View>
      </View>
    </View>
  )
}
