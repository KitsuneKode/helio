import { ActivityIndicator, Pressable, View } from 'react-native'
import { Text } from '@/components/ui/text'
import { useResolveClassNames } from 'uniwind'

type SwapCtaProps = {
  canSwap: boolean
  ctaLabel: string
  parsedPay: number
  onPress: () => void
}

export function SwapCta({ canSwap, ctaLabel, onPress, parsedPay }: SwapCtaProps) {
  const { color } = useResolveClassNames('text-primary-foreground/50')

  return (
    <Pressable
      className="mt-5 items-center justify-center rounded-2xl py-4 active:opacity-85 bg-primary"
      onPress={onPress}
      disabled={!canSwap}
    >
      {!canSwap ? (
        <View className="flex-row items-center gap-2.5 ">
          {parsedPay > 0 ? (
            <>
              <ActivityIndicator size="small" className="text-xl" color={color} />
              <Text className="text-primary-foreground/50 text-xl font-semibold">Loading ...</Text>
            </>
          ) : (
            <Text className="text-primary-foreground/50 text-xl font-semibold">
              Enter an Amount
            </Text>
          )}
        </View>
      ) : (
        <Text className="text-xl font-semibold text-primary-foreground">{ctaLabel}</Text>
      )}
    </Pressable>
  )
}
