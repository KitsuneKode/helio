import { Pressable, View } from 'react-native'
import { useNetwork, type Network } from '@/context/network-context'
import { Text } from '@/components/ui/text'

const SEGMENTS: { label: string; value: Network }[] = [
  { label: 'Main', value: 'mainnet' },
  { label: 'Dev', value: 'devnet' },
]

export function NetworkToggle() {
  const { network, toggleNetwork } = useNetwork()

  return (
    <View className="bg-muted flex-row items-center gap-0.5 rounded-full p-1">
      {SEGMENTS.map(({ label, value }) => {
        const active = network === value
        return (
          <Pressable
            key={value}
            onPress={() => !active && toggleNetwork()}
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
