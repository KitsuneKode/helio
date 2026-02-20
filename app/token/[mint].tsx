import { useState } from 'react'
import { Image, Pressable, ScrollView, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams, router } from 'expo-router'
import { ArrowLeft01Icon, Coins01Icon, Copy01Icon } from '@hugeicons/core-free-icons'
import { Card, CardContent } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { short } from '@/utils/format-text'
import { SafeAreaViewUniwind } from '@/components/styled-uniwind-components'

const formatAmount = (amount: number) => {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(2)}M`
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(2)}K`
  return amount.toLocaleString(undefined, { maximumFractionDigits: 6 })
}

export default function TokenDetailScreen() {
  // All data is passed as route params from getAllTokens — no extra fetch needed
  const { mint, amount, tokenName, symbol, logoURI } = useLocalSearchParams<{
    mint: string
    amount: string
    tokenName?: string
    symbol?: string
    logoURI?: string
  }>()

  const [imgError, setImgError] = useState(false)
  const [copiedMint, setCopiedMint] = useState(false)

  const parsedAmount = parseFloat(amount ?? '0')
  const displayName = tokenName || short(mint, 6)
  const displaySymbol = symbol || null
  const showImage = !!(logoURI && !imgError)

  const handleCopyMint = async () => {
    await Clipboard.setStringAsync(mint)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setCopiedMint(true)
    setTimeout(() => setCopiedMint(false), 2000)
  }

  return (
    <SafeAreaViewUniwind className="bg-background flex-1" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()} className="p-1 active:opacity-60">
          <Icon icon={ArrowLeft01Icon} className="text-foreground size-6" />
        </Pressable>
        <Text className="text-foreground ml-3 text-lg font-semibold">Token Details</Text>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View className="items-center gap-3 py-8">
          <View className="bg-primary/10 h-24 w-24 items-center justify-center overflow-hidden rounded-full">
            {showImage ? (
              <Image
                source={{ uri: logoURI }}
                style={{ width: 96, height: 96, borderRadius: 48 }}
                onError={() => setImgError(true)}
              />
            ) : (
              <Icon icon={Coins01Icon} className="text-primary size-11" />
            )}
          </View>

          <Text className="text-foreground text-center text-2xl font-bold">{displayName}</Text>

          {displaySymbol && (
            <View className="bg-primary/10 rounded-full px-4 py-1">
              <Text className="text-primary font-mono text-sm font-semibold">
                ${displaySymbol}
              </Text>
            </View>
          )}
        </View>

        {/* Balance */}
        <Card className="mb-4 gap-0 overflow-hidden p-0">
          <View className="bg-primary/10 px-5 py-3">
            <Text variant="muted" className="text-xs tracking-wider uppercase">
              Your Balance
            </Text>
          </View>
          <View className="px-5 py-5">
            <Text className="text-foreground text-3xl font-bold tabular-nums">
              {formatAmount(parsedAmount)}
            </Text>
            {displaySymbol ? (
              <Text className="text-primary mt-1 text-base font-semibold">{displaySymbol}</Text>
            ) : (
              <Text variant="muted" className="mt-1 text-base">
                tokens
              </Text>
            )}
          </View>
        </Card>

        {/* Mint address */}
        <Card className="mb-4 gap-0 overflow-hidden p-0">
          <View className="bg-primary/10 px-5 py-3">
            <Text variant="muted" className="text-xs tracking-wider uppercase">
              Mint Address
            </Text>
          </View>
          <Pressable onPress={handleCopyMint} className="active:opacity-60">
            <View className="flex-row items-center justify-between px-5 py-4">
              <Text className="text-foreground mr-3 flex-1 font-mono text-sm" numberOfLines={1}>
                {short(mint, 10)}
              </Text>
              <View className="bg-muted flex-row items-center gap-2 rounded-lg px-3 py-2">
                <Icon icon={Copy01Icon} className="text-muted-foreground size-4" />
                <Text
                  variant="small"
                  className={copiedMint ? 'text-primary font-semibold' : 'text-muted-foreground'}>
                  {copiedMint ? 'Copied!' : 'Copy'}
                </Text>
              </View>
            </View>
          </Pressable>
        </Card>

        {/* Network */}
        <Card className="mb-8 gap-0 overflow-hidden p-0">
          <CardContent className="px-5 py-4">
            <Text variant="muted" className="mb-2 text-xs tracking-wider uppercase">
              Network
            </Text>
            <Text className="text-foreground font-semibold">Mainnet</Text>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaViewUniwind>
  )
}
