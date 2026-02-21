import { ActivityIndicator, Pressable, View } from 'react-native'
import { Text } from '@/components/ui/text'

type SwapCtaProps = {
  canSwap: boolean
  quoteLoading: boolean
  parsedPay: number
  ctaLabel: string
  isDark: boolean
  onPress: () => void
}

export function SwapCta({
  canSwap,
  quoteLoading,
  parsedPay,
  ctaLabel,
  isDark,
  onPress,
}: SwapCtaProps) {
  return (
    <Pressable
      className={[
        'mt-5 items-center justify-center rounded-2xl py-4 active:opacity-85',
        canSwap || (quoteLoading && parsedPay > 0) ? 'bg-primary' : 'bg-primary/30',
      ].join(' ')}
      onPress={onPress}
    >
      {quoteLoading && parsedPay > 0 ? (
        <View className="flex-row items-center gap-2.5">
          <ActivityIndicator size="small" color={isDark ? '#000000' : '#ffffff'} />
          <Text className="text-primary-foreground text-xl font-semibold">Getting quote…</Text>
        </View>
      ) : (
        <Text
          className={[
            'text-xl font-semibold',
            canSwap ? 'text-primary-foreground' : 'text-primary-foreground/50',
          ].join(' ')}
        >
          {ctaLabel}
        </Text>
      )}
    </Pressable>
  )
}
