import { View } from 'react-native'
import { Wallet01Icon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'

export const WalletPrompt = () => {
  return (
    <View className="flex-1 items-center justify-center gap-8 py-16">
      {/* Concentric rings */}
      <View className="bg-primary/5 h-36 w-36 items-center justify-center rounded-full">
        <View className="bg-primary/10 h-24 w-24 items-center justify-center rounded-full">
          <View className="bg-primary/20 h-16 w-16 items-center justify-center rounded-full">
            <Icon icon={Wallet01Icon} className="text-primary size-8" />
          </View>
        </View>
      </View>

      <View className="items-center gap-2">
        <Text variant="large" className="text-foreground tracking-tight">
          Explore a Wallet
        </Text>
        <Text variant="muted" className="max-w-[240px] text-center text-sm leading-relaxed">
          Enter a Solana address above to inspect its balance, token holdings, and on-chain history.
        </Text>
      </View>
    </View>
  )
}
