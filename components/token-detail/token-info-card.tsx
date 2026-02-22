import { useEffect, useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import { Copy01Icon, CheckmarkCircle01Icon } from '@hugeicons/core-free-icons'
import { Card, CardContent } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { Separator } from '@/components/ui/separator'
import { AnimatedCard } from '@/components/ui/animated-card'
import { SectionLabel } from '@/components/ui/section-label'
import { short } from '@/utils/format-text'
import type { TokenJupiterDetail } from '@/types'

type TokenInfoCardProps = {
  mint: string
  detail: TokenJupiterDetail | null
  loading: boolean
}

export function TokenInfoCard({ mint, detail, loading }: TokenInfoCardProps) {
  const [copiedMint, setCopiedMint] = useState(false)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    }
  }, [])

  const handleCopyMint = () => {
    Clipboard.setStringAsync(mint)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setCopiedMint(true)
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    copyTimerRef.current = setTimeout(() => setCopiedMint(false), 2000)
  }

  return (
    <AnimatedCard delay={260}>
      <Card className="gap-0 overflow-hidden p-0">
        <View className="px-5 pt-4 pb-1">
          <SectionLabel label="Token Info" />
        </View>
        <CardContent className="gap-0 px-0 py-0">
          {/* Mint address with copy */}
          <Pressable onPress={handleCopyMint} className="active:opacity-60">
            <View className="flex-row items-center justify-between px-5 py-4">
              <View className="mr-3 flex-1">
                <Text variant="muted" className="mb-1 text-xs uppercase tracking-wider">
                  Mint Address
                </Text>
                <Text className="text-foreground font-mono text-sm" numberOfLines={1}>
                  {short(mint, 12)}
                </Text>
              </View>
              <View className="bg-muted flex-row items-center gap-1.5 rounded-lg px-2.5 py-1.5">
                {copiedMint ? (
                  <Icon icon={CheckmarkCircle01Icon} className="text-primary size-3.5" />
                ) : (
                  <Icon icon={Copy01Icon} className="text-muted-foreground size-3.5" />
                )}
                <Text
                  variant="small"
                  className={copiedMint ? 'text-primary font-semibold' : 'text-muted-foreground'}
                >
                  {copiedMint ? 'Copied!' : 'Copy'}
                </Text>
              </View>
            </View>
          </Pressable>

          {/* Decimals */}
          {!loading && detail?.decimals != null && (
            <>
              <Separator className="mx-5" />
              <View className="px-5 py-4">
                <Text variant="muted" className="mb-1 text-xs uppercase tracking-wider">
                  Decimals
                </Text>
                <Text className="text-foreground font-semibold">{detail.decimals}</Text>
              </View>
            </>
          )}

          {/* Tags */}
          {!loading && detail?.tags && detail.tags.length > 0 && (
            <>
              <Separator className="mx-5" />
              <View className="px-5 py-4">
                <Text variant="muted" className="mb-2 text-xs uppercase tracking-wider">
                  Tags
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {detail.tags.map((tag) => (
                    <View key={tag} className="bg-primary/10 rounded-full px-3 py-1">
                      <Text className="text-primary text-xs font-medium">{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}

          <Separator className="mx-5" />
          <View className="px-5 py-4">
            <Text variant="muted" className="mb-1 text-xs uppercase tracking-wider">
              Network
            </Text>
            <Text className="text-foreground font-semibold">Solana Mainnet</Text>
          </View>
        </CardContent>
      </Card>
    </AnimatedCard>
  )
}
