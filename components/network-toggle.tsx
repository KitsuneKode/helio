import { Alert, Pressable, View } from 'react-native'
import { router } from 'expo-router'
import { useNetwork, type Network } from '@/context/network-context'
import { Text } from '@/components/ui/text'
import { storage } from '@/lib/storage'

export const DEVNET_WARNING_DISMISSED_KEY = 'devnet-warning-dismissed'

const SEGMENTS: { label: string; value: Network }[] = [
  { label: 'Main', value: 'mainnet' },
  { label: 'Dev', value: 'devnet' },
]

export function NetworkToggle() {
  const { network, toggleNetwork, hasHeliusRpc } = useNetwork()

  function handlePress(value: Network) {
    if (value === network) return

    if (value === 'devnet' && !hasHeliusRpc && storage.getItem(DEVNET_WARNING_DISMISSED_KEY) !== 'true') {
      Alert.alert(
        'Helius RPC Not Set',
        "Token metadata won't be available on devnet without a Helius RPC URL. You can add one in Settings.",
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go to Settings',
            onPress: () => {
              toggleNetwork()
              router.push('/(tabs)/settings')
            },
          },
          {
            text: "Don't Show Again",
            onPress: () => {
              storage.setItem(DEVNET_WARNING_DISMISSED_KEY, 'true')
              toggleNetwork()
            },
          },
          { text: 'Switch Anyway', onPress: toggleNetwork },
        ],
      )
      return
    }

    toggleNetwork()
  }

  return (
    <View className="bg-muted flex-row items-center gap-0.5 rounded-full p-1">
      {SEGMENTS.map(({ label, value }) => {
        const active = network === value
        return (
          <Pressable
            key={value}
            onPress={() => handlePress(value)}
            className={['rounded-full px-3 py-1', active ? 'bg-primary' : ''].join(' ')}
          >
            <Text
              variant="small"
              className={[
                'text-xs',
                active ? 'text-primary-foreground font-semibold' : 'text-muted-foreground',
              ].join(' ')}
            >
              {label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
