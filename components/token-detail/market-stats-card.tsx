import { View } from 'react-native'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { AnimatedCard } from '@/components/ui/animated-card'
import { SectionLabel } from '@/components/ui/section-label'
import { MarketStat } from './market-stat'
import { formatUsd, formatPrice } from '@/utils/format-number'
import type { TokenJupiterDetail } from '@/lib/solana/token-details'

type MarketStatsCardProps = {
  detail: TokenJupiterDetail | null
  loading: boolean
}

export function MarketStatsCard({ detail, loading }: MarketStatsCardProps) {
  const priceUsd = detail?.priceUsd ?? null
  const priceChange24h = detail?.stats24h?.priceChange ?? null
  const priceChangePositive = priceChange24h != null && priceChange24h >= 0

  const stats24h = detail?.stats24h
  const volume24h =
    stats24h && (stats24h.buyVolume != null || stats24h.sellVolume != null)
      ? (stats24h.buyVolume ?? 0) + (stats24h.sellVolume ?? 0)
      : null

  const buySellLabel =
    stats24h?.numBuys != null && stats24h?.numSells != null
      ? `${stats24h.numBuys.toLocaleString()} / ${stats24h.numSells.toLocaleString()}`
      : null

  return (
    <AnimatedCard delay={200}>
      <Card className="overflow-hidden p-0">
        <View className="px-5 pt-4 pb-1">
          <SectionLabel label="Market Stats" />
        </View>
        <CardContent className="px-5 pb-5 pt-0">
          {loading ? (
            <View className="gap-3">
              {[1, 2, 3].map((i) => (
                <View key={i} className="flex-row gap-3">
                  <Skeleton className="h-12 flex-1 rounded-xl" />
                  <Skeleton className="h-12 flex-1 rounded-xl" />
                </View>
              ))}
            </View>
          ) : (
            <View className="gap-4">
              <View className="flex-row gap-3">
                <MarketStat
                  label="Price USD"
                  value={priceUsd != null ? formatPrice(priceUsd) : null}
                />
                <MarketStat
                  label="24h Change"
                  value={
                    priceChange24h != null
                      ? `${priceChangePositive ? '+' : ''}${priceChange24h.toFixed(2)}%`
                      : null
                  }
                  positive={priceChangePositive && priceChange24h != null}
                  negative={!priceChangePositive && priceChange24h != null}
                />
              </View>
              <Separator />
              <View className="flex-row gap-3">
                <MarketStat
                  label="Volume 24h"
                  value={volume24h != null ? formatUsd(volume24h) : null}
                />
                <MarketStat
                  label="Liquidity"
                  value={detail?.liquidity != null ? formatUsd(detail.liquidity) : null}
                />
              </View>
              <Separator />
              <View className="flex-row gap-3">
                <MarketStat
                  label="FDV"
                  value={detail?.fdv != null ? formatUsd(detail.fdv) : null}
                />
                <MarketStat label="Buys / Sells" value={buySellLabel} />
              </View>
            </View>
          )}
        </CardContent>
      </Card>
    </AnimatedCard>
  )
}
