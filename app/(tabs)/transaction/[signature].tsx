import { useEffect, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import * as Linking from 'expo-linking'
import { useLocalSearchParams, router } from 'expo-router'
import {
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
  CancelCircleIcon,
  Copy01Icon,
} from '@hugeicons/core-free-icons'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  withSequence,
} from 'react-native-reanimated'
import { Card, CardContent } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { short } from '@/utils/format-text'
import { useNetwork } from '@/context/network-context'
import { getTransactionDetail } from '@/lib/solana'
import { format } from 'date-fns'
import { formatDate } from '@/utils/format-date'
import { SafeAreaViewUniwind } from '@/components/styled-uniwind-components'
import { getMetaDataFromCacheOrFetch } from '@/lib/cache/token-metadata'

const LAMPORTS = 1_000_000_000

type TokenTransfer = {
  mint: string
  delta: number
  symbol?: string
}

type TxDetail = {
  success: boolean
  fee: number
  slot: number
  blockTime: number | null
  solChange: number
  tokenTransfers: TokenTransfer[]
  accounts: { address: string; signer: boolean; writable: boolean }[]
  signature: string
}

function AnimatedCard({
  delay,
  children,
}: {
  delay: number
  children: React.ReactNode
}) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(16)

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 280 }))
    translateY.value = withDelay(delay, withTiming(0, { duration: 280 }))
  }, [])

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return <Animated.View style={style}>{children}</Animated.View>
}

function StatusHero({ success }: { success: boolean }) {
  const scale = useSharedValue(0.5)
  const opacity = useSharedValue(0)
  const pulseScale = useSharedValue(1)
  const pulseOpacity = useSharedValue(0.4)
  const shakeX = useSharedValue(0)

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 })
    opacity.value = withTiming(1, { duration: 300 })

    if (success) {
      pulseScale.value = withRepeat(withTiming(1.5, { duration: 1200 }), -1, true)
      pulseOpacity.value = withRepeat(withTiming(0, { duration: 1200 }), -1, true)
    } else {
      shakeX.value = withSequence(
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(-6, { duration: 60 }),
        withTiming(6, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      )
    }
  }, [success])

  const iconStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateX: shakeX.value }],
  }))

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }))

  return (
    <View className="items-center gap-3 py-8">
      <View className="items-center justify-center">
        {success && (
          <Animated.View
            style={pulseStyle}
            className="absolute h-14 w-14 rounded-full bg-green-500/20"
          />
        )}
        <Animated.View
          style={iconStyle}
          className={[
            'h-14 w-14 items-center justify-center rounded-full',
            success ? 'bg-green-500/10' : 'bg-destructive/10',
          ].join(' ')}>
          {success ? (
            <Icon icon={CheckmarkCircle01Icon} className="size-7 text-green-500" />
          ) : (
            <Icon icon={CancelCircleIcon} className="text-destructive size-7" />
          )}
        </Animated.View>
      </View>

      <Text className="text-foreground text-xl font-semibold">
        {success ? 'Transaction Confirmed' : 'Transaction Failed'}
      </Text>
    </View>
  )
}

function TokenTransferRow({ mint, delta, symbol }: TokenTransfer) {
  const sign = delta >= 0 ? '+' : ''
  const color = delta >= 0 ? 'text-green-500' : 'text-destructive'
  const label = symbol || short(mint, 6)

  return (
    <View className="flex-row items-center justify-between">
      <Text className={`${color} text-sm font-semibold`}>
        {sign}
        {delta.toLocaleString(undefined, { maximumFractionDigits: 6 })} {label}
      </Text>
      {!symbol && (
        <Text variant="muted" className="font-mono text-xs">
          {short(mint, 4)}
        </Text>
      )}
    </View>
  )
}

export default function TransactionDetailScreen() {
  const { signature } = useLocalSearchParams<{ signature: string }>()
  const { rpc } = useNetwork()
  const [detail, setDetail] = useState<TxDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedSig, setCopiedSig] = useState(false)
  const [showAllAccounts, setShowAllAccounts] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const tx = await getTransactionDetail(rpc, signature)
        if (cancelled || !tx) return

        const meta = tx.meta as any
        const message = (tx.transaction as any).message
        const accountKeys: any[] = message.accountKeys ?? []

        const fee = meta?.fee ? Number(meta.fee) / LAMPORTS : 0
        const slot = Number(tx.slot ?? 0)
        const blockTime = tx.blockTime ? Number(tx.blockTime) : null
        const success = meta?.err === null || meta?.err === undefined

        const preBal: number[] = (meta?.preBalances ?? []).map(Number)
        const postBal: number[] = (meta?.postBalances ?? []).map(Number)
        const solChange =
          preBal[0] !== undefined && postBal[0] !== undefined
            ? (postBal[0] - preBal[0]) / LAMPORTS
            : 0

        const preToken: any[] = meta?.preTokenBalances ?? []
        const postToken: any[] = meta?.postTokenBalances ?? []

        const tokenMap: Record<string, { pre: number; post: number }> = {}
        for (const t of preToken) {
          const mint = t.mint
          if (!tokenMap[mint]) tokenMap[mint] = { pre: 0, post: 0 }
          tokenMap[mint].pre += parseFloat(t.uiTokenAmount?.uiAmountString ?? '0')
        }
        for (const t of postToken) {
          const mint = t.mint
          if (!tokenMap[mint]) tokenMap[mint] = { pre: 0, post: 0 }
          tokenMap[mint].post += parseFloat(t.uiTokenAmount?.uiAmountString ?? '0')
        }
        const tokenTransfers: TokenTransfer[] = Object.entries(tokenMap)
          .map(([mint, { pre, post }]) => ({ mint, delta: post - pre }))
          .filter((t) => Math.abs(t.delta) > 0)

        const accounts = accountKeys.map((k: any) => ({
          address: k.pubkey?.toString() ?? k.toString(),
          signer: k.signer ?? false,
          writable: k.writable ?? false,
        }))

        if (!cancelled) {
          setDetail({ success, fee, slot, blockTime, solChange, tokenTransfers, accounts, signature })

          // Resolve token symbols from cache
          if (tokenTransfers.length > 0) {
            const mints = tokenTransfers.map((t) => t.mint)
            getMetaDataFromCacheOrFetch(mints).then((metaMap) => {
              if (cancelled) return
              setDetail((prev) => {
                if (!prev) return prev
                return {
                  ...prev,
                  tokenTransfers: prev.tokenTransfers.map((t) => ({
                    ...t,
                    symbol: metaMap.get(t.mint)?.symbol ?? t.symbol,
                  })),
                }
              })
            })
          }
        }
      } catch {
        if (!cancelled) setError('Failed to load transaction details.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [signature, rpc])

  const handleCopySig = async () => {
    await Clipboard.setStringAsync(signature)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setCopiedSig(true)
    setTimeout(() => setCopiedSig(false), 2000)
  }

  const visibleAccounts = detail
    ? showAllAccounts
      ? detail.accounts
      : detail.accounts.slice(0, 3)
    : []

  const hiddenCount = detail ? Math.max(0, detail.accounts.length - 3) : 0

  return (
    <SafeAreaViewUniwind className="bg-background flex-1" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()} className="p-1 active:opacity-60">
          <Icon icon={ArrowLeft01Icon} className="text-foreground size-6" />
        </Pressable>
        <Text className="text-foreground ml-3 text-lg font-semibold">Transaction Details</Text>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="gap-4 pt-4">
            <View className="items-center gap-3 py-6">
              <Skeleton className="h-14 w-14 rounded-full" />
              <Skeleton className="h-6 w-48 rounded-md" />
              <Skeleton className="h-4 w-36 rounded-md" />
            </View>
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-36 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </View>
        ) : error ? (
          <View className="border-border mt-8 items-center gap-2 rounded-xl border border-dashed px-6 py-10">
            <Text className="text-muted-foreground text-center">{error}</Text>
          </View>
        ) : detail ? (
          <>
            {/* Animated status hero */}
            <StatusHero success={detail.success} />

            {/* Timestamp row */}
            {detail.blockTime && (
              <AnimatedCard delay={0}>
                <View className="mb-4 items-center gap-1">
                  <Text className="text-foreground text-sm font-medium">
                    {format(new Date(detail.blockTime * 1000), 'EEE MMM d, yyyy · h:mm a')}
                  </Text>
                  <Text variant="muted" className="text-xs">
                    {formatDate(new Date(detail.blockTime * 1000))} · Block #{detail.slot.toLocaleString()}
                  </Text>
                </View>
              </AnimatedCard>
            )}

            {/* Value Moved */}
            <AnimatedCard delay={80}>
              <Card className="mb-4 gap-0 overflow-hidden p-0">
                <View className="bg-primary/10 px-5 py-3">
                  <Text variant="muted" className="text-xs tracking-wider uppercase">
                    Value Moved
                  </Text>
                </View>
                <CardContent className="gap-3 px-5 py-4">
                  <View className="flex-row justify-between">
                    <View className="flex-1">
                      <Text variant="muted" className="mb-1 text-xs tracking-wider uppercase">
                        SOL Change
                      </Text>
                      <Text
                        className={[
                          'text-lg font-bold',
                          detail.solChange >= 0 ? 'text-green-500' : 'text-destructive',
                        ].join(' ')}>
                        {detail.solChange >= 0 ? '+' : ''}
                        {detail.solChange.toFixed(6)} SOL
                      </Text>
                    </View>
                    <View className="flex-1 items-end">
                      <Text variant="muted" className="mb-1 text-xs tracking-wider uppercase">
                        Fee
                      </Text>
                      <Text className="text-muted-foreground text-sm font-semibold">
                        {detail.fee.toFixed(6)} SOL
                      </Text>
                    </View>
                  </View>

                  {detail.tokenTransfers.length > 0 && (
                    <View className="border-border gap-2 border-t pt-3">
                      <Text variant="muted" className="mb-1 text-xs tracking-wider uppercase">
                        Token Transfers
                      </Text>
                      {detail.tokenTransfers.map((t) => (
                        <TokenTransferRow key={t.mint} {...t} />
                      ))}
                    </View>
                  )}
                </CardContent>
              </Card>
            </AnimatedCard>

            {/* Details */}
            <AnimatedCard delay={160}>
              <Card className="mb-4 gap-0 overflow-hidden p-0">
                <View className="bg-primary/10 px-5 py-3">
                  <Text variant="muted" className="text-xs tracking-wider uppercase">
                    Details
                  </Text>
                </View>
                <CardContent className="gap-0 px-0 py-0">
                  {/* Signature */}
                  <View className="px-5 py-4">
                    <Text variant="muted" className="mb-2 text-xs tracking-wider uppercase">
                      Signature
                    </Text>
                    <Pressable onPress={handleCopySig} className="active:opacity-60">
                      <View className="flex-row items-start gap-3">
                        <Text
                          className="text-foreground flex-1 font-mono text-xs leading-5"
                          numberOfLines={3}>
                          {signature}
                        </Text>
                        <View className="bg-muted mt-0.5 flex-row items-center gap-1.5 rounded-lg px-2.5 py-1.5">
                          <Icon icon={Copy01Icon} className="text-muted-foreground size-3.5" />
                          <Text
                            variant="small"
                            className={
                              copiedSig ? 'text-primary font-semibold' : 'text-muted-foreground'
                            }>
                            {copiedSig ? 'Copied!' : 'Copy'}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  </View>

                  <Separator className="mx-5" />

                  {detail.blockTime && (
                    <>
                      <View className="px-5 py-4">
                        <Text variant="muted" className="mb-1 text-xs tracking-wider uppercase">
                          Timestamp
                        </Text>
                        <Text className="text-foreground text-sm">
                          {format(new Date(detail.blockTime * 1000), 'EEE MMM d, yyyy h:mm:ss a')}
                        </Text>
                        <Text variant="muted" className="mt-0.5 text-xs">
                          {formatDate(new Date(detail.blockTime * 1000))}
                        </Text>
                      </View>
                      <Separator className="mx-5" />
                    </>
                  )}

                  <View className="px-5 py-4">
                    <Text variant="muted" className="mb-1 text-xs tracking-wider uppercase">
                      Block / Slot
                    </Text>
                    <Text className="text-foreground text-sm tabular-nums">
                      {detail.slot.toLocaleString()}
                    </Text>
                  </View>
                </CardContent>
              </Card>
            </AnimatedCard>

            {/* Accounts */}
            <AnimatedCard delay={240}>
              <Card className="mb-4 gap-0 overflow-hidden p-0">
                <View className="bg-primary/10 px-5 py-3">
                  <Text variant="muted" className="text-xs tracking-wider uppercase">
                    Accounts ({detail.accounts.length})
                  </Text>
                </View>
                <CardContent className="gap-3 px-5 py-4">
                  {visibleAccounts.map((acc, idx) => (
                    <View key={acc.address} className="flex-row flex-wrap items-center gap-2">
                      <Text className="text-foreground font-mono text-sm">
                        {short(acc.address, 6)}
                      </Text>
                      {idx === 0 && (
                        <View className="rounded bg-yellow-500/15 px-1.5 py-0.5">
                          <Text className="text-xs font-semibold text-yellow-500">FEE PAYER</Text>
                        </View>
                      )}
                      {acc.signer && (
                        <View className="bg-primary/10 rounded px-1.5 py-0.5">
                          <Text className="text-primary text-xs font-semibold">SIGNER</Text>
                        </View>
                      )}
                      {acc.writable && (
                        <View className="bg-muted rounded px-1.5 py-0.5">
                          <Text className="text-muted-foreground text-xs font-semibold">
                            WRITABLE
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                  {hiddenCount > 0 && (
                    <Pressable
                      onPress={() => setShowAllAccounts((p) => !p)}
                      className="active:opacity-60">
                      <Text className="text-primary text-sm">
                        {showAllAccounts ? 'Show less ↑' : `+ ${hiddenCount} more ↓`}
                      </Text>
                    </Pressable>
                  )}
                </CardContent>
              </Card>
            </AnimatedCard>

            {/* Explorer link */}
            <AnimatedCard delay={320}>
              <Card className="mb-8 gap-0 overflow-hidden p-0">
                <Pressable
                  onPress={() => Linking.openURL(`https://solscan.io/tx/${signature}`)}
                  className="active:opacity-60">
                  <View className="flex-row items-center justify-between px-5 py-4">
                    <View className="flex-row items-center gap-3">
                      <View className="bg-primary/10 h-8 w-8 items-center justify-center rounded-full">
                        <Text className="text-primary text-xs font-bold">S</Text>
                      </View>
                      <Text className="text-foreground font-medium">View on Solscan</Text>
                    </View>
                    <Text variant="muted" className="text-base">
                      ↗
                    </Text>
                  </View>
                </Pressable>
              </Card>
            </AnimatedCard>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaViewUniwind>
  )
}
