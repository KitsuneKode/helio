import * as React from 'react'
import { Image, Pressable, TextInput, View } from 'react-native'
import { Text } from '@/components/ui/text'
import { Icon } from '@/components/ui/icon'
import { Coins01Icon } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'

type TokenOption = {
  mint: string
  symbol: string
  logoURI?: string
  decimals: number
}

type TokenInputProps = {
  label: string
  token: TokenOption
  amount: string
  onAmountChange?: (v: string) => void
  editable?: boolean
  onTokenPress?: () => void
  isLoading?: boolean
}

function TokenInput({
  label,
  token,
  amount,
  onAmountChange,
  editable = true,
  onTokenPress,
  isLoading = false,
}: TokenInputProps) {
  const [imgError, setImgError] = React.useState(false)
  const showImg = !!(token.logoURI && !imgError)

  return (
    <View className="px-4 py-4">
      <Text variant="muted" className="mb-3 text-xs tracking-widest uppercase">
        {label}
      </Text>
      <View className="flex-row items-center gap-3">
        {/* Token selector button */}
        <Pressable onPress={onTokenPress} className="flex-row items-center gap-2 active:opacity-70">
          <View className="bg-primary/10 h-9 w-9 items-center justify-center overflow-hidden rounded-full">
            {showImg ? (
              <Image
                source={{ uri: token.logoURI }}
                style={{ width: 36, height: 36, borderRadius: 18 }}
                onError={() => setImgError(true)}
              />
            ) : (
              <Icon icon={Coins01Icon} className="text-primary size-5" />
            )}
          </View>
          <Text className="text-foreground text-base font-bold">{token.symbol}</Text>
          <Text variant="muted" className="text-base">
            ▾
          </Text>
        </Pressable>

        {/* Amount field */}
        <View className="flex-1 items-end">
          {editable ? (
            <TextInput
              value={amount}
              onChangeText={onAmountChange}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="#9ca3af"
              className="text-foreground text-right text-2xl font-bold"
              style={{ minWidth: 80 }}
            />
          ) : (
            <Text
              className={cn(
                'text-right text-2xl font-bold tabular-nums',
                isLoading ? 'text-muted-foreground' : 'text-foreground',
              )}
            >
              {isLoading ? '…' : amount || '0'}
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}

export { TokenInput }
export type { TokenOption }
