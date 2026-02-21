import { View } from 'react-native'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'

type MarketStatProps = {
  label: string
  value: string | null
  positive?: boolean
  negative?: boolean
}

function MarketStat({ label, value, positive, negative }: MarketStatProps) {
  const valueColor = positive ? 'text-green-500' : negative ? 'text-destructive' : 'text-foreground'

  return (
    <View className="flex-1 gap-1">
      <Text variant="muted" className="text-xs tracking-wider uppercase">
        {label}
      </Text>
      {value != null ? (
        <Text className={cn('text-sm font-semibold tabular-nums', valueColor)}>{value}</Text>
      ) : (
        <Text variant="muted" className="text-sm">
          —
        </Text>
      )}
    </View>
  )
}

export { MarketStat }
