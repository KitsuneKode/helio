import { useEffect, useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import { CheckmarkCircle01Icon, Copy01Icon } from '@hugeicons/core-free-icons'
import { Card, CardContent } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { Separator } from '@/components/ui/separator'
import { SectionLabel } from '@/components/ui/section-label'
import { AnimatedCard } from '@/components/ui/animated-card'
import { format } from 'date-fns'
import { formatDate } from '@/utils/format-date'

type TransactionInfoCardProps = {
  signature: string
  slot: number
  blockTime: number | null
  delay: number
}

export function TransactionInfoCard({
  signature,
  slot,
  blockTime,
  delay,
}: TransactionInfoCardProps) {
  const [copiedSig, setCopiedSig] = useState(false)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    }
  }, [])

  const handleCopySig = async () => {
    await Clipboard.setStringAsync(signature)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setCopiedSig(true)
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    copyTimerRef.current = setTimeout(() => setCopiedSig(false), 2000)
  }

  return (
    <AnimatedCard delay={delay}>
      <Card className="mb-4 gap-0 overflow-hidden p-0">
        <View className="px-5 pt-4 pb-1">
          <SectionLabel label="Transaction Details" />
        </View>
        <CardContent className="gap-0 px-0 py-0">
          {/* Signature */}
          <View className="px-5 py-4">
            <Text variant="muted" className="mb-2 text-xs uppercase tracking-wider">
              Signature
            </Text>
            <Pressable onPress={handleCopySig} className="active:opacity-60">
              <View className="flex-row items-start gap-3">
                <Text
                  className="text-foreground flex-1 font-mono text-xs leading-5"
                  numberOfLines={3}
                >
                  {signature}
                </Text>
                <View className="bg-muted mt-0.5 flex-row items-center gap-1.5 rounded-lg px-2.5 py-1.5">
                  {copiedSig ? (
                    <Icon icon={CheckmarkCircle01Icon} className="text-primary size-3.5" />
                  ) : (
                    <Icon icon={Copy01Icon} className="text-muted-foreground size-3.5" />
                  )}
                  <Text
                    variant="small"
                    className={
                      copiedSig ? 'text-primary font-semibold' : 'text-muted-foreground'
                    }
                  >
                    {copiedSig ? 'Copied!' : 'Copy'}
                  </Text>
                </View>
              </View>
            </Pressable>
          </View>

          <Separator className="mx-5" />

          {/* Block / Slot */}
          <View className="px-5 py-4">
            <Text variant="muted" className="mb-1 text-xs uppercase tracking-wider">
              Block / Slot
            </Text>
            <Text className="text-foreground text-sm font-semibold tabular-nums">
              {slot.toLocaleString()}
            </Text>
          </View>

          {/* Timestamp */}
          {blockTime && (
            <>
              <Separator className="mx-5" />
              <View className="px-5 py-4">
                <Text variant="muted" className="mb-1 text-xs uppercase tracking-wider">
                  Timestamp
                </Text>
                <Text className="text-foreground text-sm">
                  {format(new Date(blockTime * 1000), 'EEE MMM d, yyyy h:mm:ss a')}
                </Text>
                <Text variant="muted" className="mt-0.5 text-xs">
                  {formatDate(new Date(blockTime * 1000))}
                </Text>
              </View>
            </>
          )}
        </CardContent>
      </Card>
    </AnimatedCard>
  )
}
