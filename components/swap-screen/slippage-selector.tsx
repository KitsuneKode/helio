import { Pressable, View } from 'react-native'
import { Text } from '@/components/ui/text'
import { type SlippageOpt } from '@/types'
import { SLIPPAGE_OPTS } from '@/constants/swap'

type SlippageSelectorProps = {
  slippage: SlippageOpt
  onChange: (value: SlippageOpt) => void
}

export function SlippageSelector({ slippage, onChange }: SlippageSelectorProps) {
  return (
    <View className="mt-4">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
          Slippage Tolerance
        </Text>
        <Text className="text-primary text-xs font-bold">{slippage}%</Text>
      </View>
      <View className="flex-row gap-2">
        {SLIPPAGE_OPTS.map((opt) => {
          const active = slippage === opt
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              className={[
                'flex-1 items-center rounded-xl border py-2.5 active:opacity-70',
                active ? 'bg-primary/15 border-primary/40' : 'bg-card border-border',
              ].join(' ')}
            >
              <Text
                className={`text-sm font-bold ${active ? 'text-primary' : 'text-muted-foreground'}`}
              >
                {opt}%
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
