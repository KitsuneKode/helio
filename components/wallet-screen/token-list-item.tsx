import { useState } from 'react'
import { Image, Pressable, View } from 'react-native'
import { Coins01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { short } from '@/utils/format-text'
import type { GetTokensResult } from '@/types'

type Token = GetTokensResult[number]

type Props = {
  item: Token
  onPress?: (item: Token) => void
}

const formatAmount = (amount: number) => {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(2)}K`
  return amount.toLocaleString(undefined, { maximumFractionDigits: 4 })
}

export const TokenListItem = ({ item, onPress }: Props) => {
  const [imgError, setImgError] = useState(false)

  const displayName = item.tokenName || short(item.mint, 8)
  const displaySymbol = item.symbol || null
  const logoURI = item.logoURI ?? undefined
  const showImage = !!(logoURI && !imgError)

  return (
    <Pressable onPress={() => onPress?.(item)} className="active:opacity-70">
      <View className="flex-row items-center gap-3 px-1 py-3.5">
        {/* Logo */}
        <View className="bg-primary/10 h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full">
          {showImage ? (
            <Image
              source={{ uri: logoURI }}
              style={{ width: 44, height: 44, borderRadius: 22 }}
              onError={() => setImgError(true)}
            />
          ) : (
            <Icon icon={Coins01Icon} className="text-primary size-5" />
          )}
        </View>

        {/* Name + symbol/mint */}
        <View className="min-w-0 flex-1">
          <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
            {displayName}
          </Text>
          <Text variant="muted" className="mt-0.5 font-mono text-xs" numberOfLines={1}>
            {displaySymbol ? `$${displaySymbol}` : short(item.mint, 6)}
          </Text>
        </View>

        {/* Amount */}
        <View className="items-end">
          <Text className="text-foreground text-sm font-bold tabular-nums">
            {formatAmount(item.amount)}
          </Text>
          {displaySymbol && (
            <Text variant="muted" className="mt-0.5 text-xs">
              {displaySymbol}
            </Text>
          )}
        </View>

        <Icon icon={ArrowRight01Icon} className="text-muted-foreground size-4 shrink-0" />
      </View>
    </Pressable>
  )
}
