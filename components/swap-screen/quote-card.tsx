import { View } from 'react-native'
import { Text } from '@/components/ui/text'

type SwapInfoRowProps = {
  label: string
  value: string
  highlight?: boolean
}

function SwapInfoRow({ label, value, highlight }: SwapInfoRowProps) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text className="text-muted-foreground text-xs font-medium">{label}</Text>
      <Text
        className={`text-xs font-semibold ${highlight ? 'text-destructive' : 'text-foreground'}`}
      >
        {value}
      </Text>
    </View>
  )
}

type QuoteCardProps = {
  rate: string
  priceImpact: { str: string; bad: boolean } | null
  route: string
  minReceived: string
}

export function QuoteCard({ rate, priceImpact, route, minReceived }: QuoteCardProps) {
  return (
    <View className="bg-card border-border mt-4 rounded-2xl border px-5 py-4">
      <SwapInfoRow label="Exchange Rate" value={rate} />
      <View className="bg-border my-1 h-px" />
      <SwapInfoRow
        label="Price Impact"
        value={priceImpact?.str ?? '< 0.01%'}
        highlight={priceImpact?.bad}
      />
      <View className="bg-border my-1 h-px" />
      <SwapInfoRow label="Route" value={route} />
      <View className="bg-border my-1 h-px" />
      <SwapInfoRow label="Min. Received" value={minReceived} />
    </View>
  )
}
