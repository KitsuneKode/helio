import { View } from 'react-native'
import { Card } from '../ui/card'
import { Text } from '../ui/text'
import { short } from '@/utils/format-text'

type Props = {
  balance: number
  address: string
}

export const BalanceCard = ({ balance, address }: Props) => {
  return (
    <Card className="relative mt-10 flex-1 p-4">
      <View className="flex-1 items-center">
        <Text className="text-xl" numberOfLines={1}>
          {short('YubQzu18FDqJRyNfG8JqHmsdbxhnoQqcKUHBdUkN6tP')}
        </Text>

        <View className="flex-row items-baseline gap-4">
          <Text className="text-xl">{balance.toFixed(4)}</Text>
          <Text className="text-xl">SOL</Text>
        </View>
      </View>
    </Card>
  )
}
