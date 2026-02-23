import { View } from 'react-native'
import { Text } from '../ui/text'
import { NetworkToggle } from '@/components/network-toggle'
import { ThemeToggle } from '@/components/theme-toggle-button'
import { WalletConnectButton } from '@/components/wallet-connect-button'

export function Header() {
  return (
    <View className="mt-4 flex-row items-center justify-between pb-6">
      <View className="justify-start gap-0.5">
        <Text className="text-foreground text-2xl font-bold tracking-tight">Helio</Text>
        <Text className="text-muted-foreground text-xs">Your Solana Companion</Text>
      </View>
      <View className="flex-row items-center gap-1">
        <WalletConnectButton compact />
        <NetworkToggle />
        <ThemeToggle />
      </View>
    </View>
  )
}
