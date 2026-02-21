import { Pressable, View } from 'react-native'
import * as Linking from 'expo-linking'
import { Card, CardContent } from '@/components/ui/card'
import { Text } from '@/components/ui/text'
import { Separator } from '@/components/ui/separator'
import { AnimatedCard } from '@/components/ui/animated-card'
import { SectionLabel } from '@/components/ui/section-label'
import type { TokenJupiterDetail } from '@/lib/solana/token-details'

type LinksCardProps = {
  mint: string
  detail: TokenJupiterDetail | null
  loading: boolean
}

function LinkRow({
  label,
  onPress,
  badge,
  badgeColor,
  badgeTextColor,
}: {
  label: string
  onPress: () => void
  badge: string
  badgeColor: string
  badgeTextColor: string
}) {
  return (
    <Pressable onPress={onPress} className="active:opacity-60">
      <View className="flex-row items-center justify-between px-5 py-4">
        <View className="flex-row items-center gap-3">
          <View
            className={['h-8 w-8 items-center justify-center rounded-full', badgeColor].join(' ')}
          >
            <Text className={['text-xs font-bold', badgeTextColor].join(' ')}>{badge}</Text>
          </View>
          <Text className="text-foreground font-medium">{label}</Text>
        </View>
        <Text variant="muted" className="text-base">
          ↗
        </Text>
      </View>
    </Pressable>
  )
}

export function LinksCard({ mint, detail, loading }: LinksCardProps) {
  const openLink = (url: string) => Linking.openURL(url)

  return (
    <AnimatedCard delay={320}>
      <Card className="gap-0 overflow-hidden p-0">
        <View className="px-5 pt-4 pb-1">
          <SectionLabel label="Links" />
        </View>
        <CardContent className="px-0 py-0">
          <LinkRow
            label="View on Solscan"
            onPress={() => openLink(`https://solscan.io/token/${mint}`)}
            badge="S"
            badgeColor="bg-primary/10"
            badgeTextColor="text-primary"
          />
          <Separator className="mx-5" />
          <LinkRow
            label="View on Jupiter"
            onPress={() => openLink(`https://jup.ag/tokens/${mint}`)}
            badge="J"
            badgeColor="bg-green-500/10"
            badgeTextColor="text-green-500"
          />
          {!loading && detail?.website && (
            <>
              <Separator className="mx-5" />
              <LinkRow
                label="Website"
                onPress={() => openLink(detail.website!)}
                badge="W"
                badgeColor="bg-muted"
                badgeTextColor="text-muted-foreground"
              />
            </>
          )}
          {!loading && detail?.twitter && (
            <>
              <Separator className="mx-5" />
              <LinkRow
                label="Twitter / X"
                onPress={() => openLink(detail.twitter!)}
                badge="𝕏"
                badgeColor="bg-muted"
                badgeTextColor="text-foreground"
              />
            </>
          )}
        </CardContent>
      </Card>
    </AnimatedCard>
  )
}
