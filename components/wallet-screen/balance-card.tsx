import { useState } from 'react'
import { Pressable, View, Image } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import { Copy01Icon } from '@hugeicons/core-free-icons'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { short } from '@/utils/format-text'
import { WatchButton } from '@/components/wallet-screen/watch-button'

type Props = {
  balance: number
  address: string
}

export const BalanceCard = ({ balance, address }: Props) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await Clipboard.setStringAsync(address)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="mt-6 gap-0 overflow-hidden p-0">
      {/* Header strip */}
      <View className="bg-primary/10 flex-row items-center gap-3 px-5 py-4 justify-between">
        <View className="flex-row gap-3 justify-center items-center">
          <Image
            source={{
              uri: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
            }}
            className="size-6 rounded-2xl"
          />
          <Text variant="small" className="text-muted-foreground tracking-widest uppercase">
            SOL Balance
          </Text>
        </View>
        <WatchButton address={address} />
      </View>

      {/* Balance */}
      <View className="items-center py-8">
        <View className="flex-row items-baseline gap-2">
          <Text className="text-foreground text-5xl font-bold tracking-tight">
            {balance.toFixed(4)}
          </Text>
          <Text className="text-primary text-xl font-semibold">SOL</Text>
        </View>
      </View>

      {/* Address + copy */}
      <View className="border-border border-t px-5 py-4">
        <Pressable
          onPress={handleCopy}
          className="flex-row items-center justify-between active:opacity-60"
        >
          <View className="mr-4 flex-1">
            <Text variant="muted" className="mb-1 text-xs tracking-wider uppercase">
              Wallet Address
            </Text>
            <Text className="text-foreground font-mono text-sm">{short(address, 8)}</Text>
          </View>

          <View className="bg-muted flex-row items-center gap-2 rounded-lg px-3 py-2">
            <Icon icon={Copy01Icon} className="text-muted-foreground size-4" />
            <Text
              variant="small"
              className={copied ? 'text-primary font-semibold' : 'text-muted-foreground'}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Text>
          </View>
        </Pressable>
      </View>
    </Card>
  )
}
