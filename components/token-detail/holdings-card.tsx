import { View } from 'react-native'
import { Card } from '@/components/ui/card'
import { Text } from '@/components/ui/text'
import { AnimatedCard } from '@/components/ui/animated-card'
import { SectionLabel } from '@/components/ui/section-label'
import { formatAmount, formatUsd } from '@/utils/format-number'

type HoldingsCardProps = {
  amount: number
  symbol: string | null
  usdValue: number | null
}

export function HoldingsCard({ amount, symbol, usdValue }: HoldingsCardProps) {
  return (
    <AnimatedCard delay={100}>
      <Card className="overflow-hidden p-0">
        <View className="px-5 pb-5 pt-4">
          <SectionLabel label="Your Holdings" />
          <Text className="text-foreground text-3xl font-bold tabular-nums">
            {formatAmount(amount)}
          </Text>
          {symbol ? (
            <Text className="text-primary mt-1 text-base font-semibold">{symbol}</Text>
          ) : (
            <Text variant="muted" className="mt-1 text-base">
              tokens
            </Text>
          )}
          {usdValue != null && (
            <Text variant="muted" className="mt-2 text-sm tabular-nums">
              ≈ {formatUsd(usdValue)}
            </Text>
          )}
        </View>
      </Card>
    </AnimatedCard>
  )
}
