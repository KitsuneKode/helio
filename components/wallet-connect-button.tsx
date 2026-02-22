import { ActivityIndicator, Alert, Pressable, View } from 'react-native'
import { Wallet01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { useUserWallet } from '@/context/user-wallet-context'

type Props = {
  compact?: boolean
}

export function WalletConnectButton({ compact }: Props) {
  const { publicKey, connected, connecting, connect, disconnect } = useUserWallet()

  const handlePress = async () => {
    if (connected) {
      disconnect()
      return
    }
    try {
      await connect()
    } catch {
      Alert.alert(
        'Connection Failed',
        'Could not connect to wallet. Make sure Phantom is installed.',
      )
    }
  }

  // Compact mode uses the existing Button component
  if (compact) {
    if (connecting) {
      return (
        <Button variant="outline" size="sm" disabled>
          <ActivityIndicator size="small" />
        </Button>
      )
    }

    if (connected && publicKey) {
      const addr = publicKey.toBase58()
      const short = `${addr.slice(0, 4)}...${addr.slice(-4)}`
      return (
        <Button variant="default" size="sm" onPress={handlePress}>
          <Text>{short}</Text>
        </Button>
      )
    }

    return (
      <Button variant="outline" size="sm" onPress={handlePress}>
        <Icon icon={Wallet01Icon} className="size-4" />
      </Button>
    )
  }

  // Full mode uses a Pressable for proper sizing
  if (connecting) {
    return (
      <Pressable
        disabled
        className="border-border bg-muted flex-row items-center justify-center gap-2.5 rounded-xl border px-5 py-4"
      >
        <ActivityIndicator size="small" />
        <Text className="text-muted-foreground text-lg font-semibold">Connecting...</Text>
      </Pressable>
    )
  }

  if (connected && publicKey) {
    const addr = publicKey.toBase58()
    const short = `${addr.slice(0, 4)}...${addr.slice(-4)}`
    return (
      <Pressable
        onPress={handlePress}
        className="bg-primary flex-row items-center justify-center gap-2.5 rounded-xl px-5 py-4 active:opacity-85"
      >
        <Icon icon={Wallet01Icon} className="size-5 text-primary-foreground" />
        <Text className="text-primary-foreground text-lg font-semibold">{short}</Text>
      </Pressable>
    )
  }

  return (
    <Pressable
      onPress={handlePress}
      className="border-border bg-card flex-row items-center justify-center gap-2.5 rounded-xl border px-5 py-4 active:opacity-85"
    >
      <Icon icon={Wallet01Icon} className="text-foreground size-5" />
      <Text className="text-foreground text-lg font-semibold">Connect Wallet</Text>
    </Pressable>
  )
}
