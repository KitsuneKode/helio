import { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import * as Linking from 'expo-linking'
import { useLocalSearchParams, router } from 'expo-router'
import {
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
  CancelCircleIcon,
  Copy01Icon,
  Coins01Icon,
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
import { ThemeToggle } from '@/components/theme-toggle-button'
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
  logoURI?: string
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

// ─── Tx type detection ─────────────────────────────────────────────────────

function detectTxType(tokenTransfers: TokenTransfer[], solChange: number): string {
  const hasIn = tokenTransfers.some((t) => t.delta > 0)
  const hasOut = tokenTransfers.some((t) => t.delta < 0)
  if (hasIn && hasOut) return 'Swap'
  if (tokenTransfers.length > 0) return 'Token Transfer'
  if (Math.abs(solChange) > 0.000001) return 'SOL Transfer'
  return 'Transaction'
}

// ─── Sub-components ────────────────────────────────────────────────────────

function AnimatedCard({ delay, children }: { delay: number; children: React.ReactNode }) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(12)

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

function SectionLabel({ label }: { label: string }) {
  return (
    <Text className="text-muted-foreground mb-3 text-xs font-semibold tracking-widest uppercase">
      {label}
    </Text>
  )
}

function StatusHero({
  success,
  blockTime,
  txType,
}: {
  success: boolean
  blockTime: number | null
  txType: string
}) {
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
            style={[
              pulseStyle,
              {
                position: 'absolute',
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: 'rgba(34,197,94,0.2)',
              },
            ]}
          />
        )}
        <Animated.View style={iconStyle}>
          <View
            className={[
              'h-14 w-14 items-center justify-center rounded-full',
              success ? 'bg-green-500/10' : 'bg-destructive/10',
            ].join(' ')}>
            {success ? (
              <Icon icon={CheckmarkCircle01Icon} className="size-7 text-green-500" />
            ) : (
              <Icon icon={CancelCircleIcon} className="text-destructive size-7" />
            )}
          </View>
        </Animated.View>
      </View>

      <Text className="text-foreground text-xl font-semibold">
        {success ? 'Transaction Confirmed' : 'Transaction Failed'}
      </Text>

      {/* Transaction type badge */}
      <View className="bg-muted rounded-full px-4 py-1.5">
        <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
          {txType}
        </Text>
      </View>

      {/* Timestamp in hero */}
      {blockTime && (
        <Text variant="muted" className="text-sm">
          {format(new Date(blockTime * 1000), 'EEE, MMM d · h:mm a')}
        </Text>
      )}
    </View>
  )
}

function TokenTransferRow({ mint, delta, symbol, logoURI }: TokenTransfer) {
  const [imgError, setImgError] = useState(false)
  const sign = delta >= 0 ? '+' : ''
  const isPositive = delta >= 0
  const label = symbol || short(mint, 6)
  const showLogo = !!(logoURI && !imgError)

  return (
    <View className="flex-row items-center gap-3">
      <View className="bg-muted h-9 w-9 items-center justify-center overflow-hidden rounded-full">
        {showLogo ? (
          <Image
            source={{ uri: logoURI }}
            style={{ width: 36, height: 36 }}
            onError={() => setImgError(true)}
          />
        ) : (
          <Icon icon={Coins01Icon} className="text-muted-foreground size-4" />
        )}
      </View>
      <View className="flex-1">
        <Text className="text-foreground text-sm font-medium">{label}</Text>
        {!symbol && (
          <Text variant="muted" className="font-mono text-xs">
            {short(mint, 4)}
          </Text>
        )}
      </View>
      <Text
        className={[
          'text-sm font-semibold tabular-nums',
          isPositive ? 'text-green-500' : 'text-destructive',
        ].join(' ')}>
        {sign}
        {Math.abs(delta).toLocaleString(undefined, { maximumFractionDigits: 6 })}
      </Text>
    </View>
  )
}

// ─── Screen ────────────────────────────────────────────────────────────────

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
          if (!tokenMap[t.mint]) tokenMap[t.mint] = { pre: 0, post: 0 }
          tokenMap[t.mint].pre += parseFloat(t.uiTokenAmount?.uiAmountString ?? '0')
        }
        for (const t of postToken) {
          if (!tokenMap[t.mint]) tokenMap[t.mint] = { pre: 0, post: 0 }
          tokenMap[t.mint].post += parseFloat(t.uiTokenAmount?.uiAmountString ?? '0')
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

          // Resolve token symbols + logos from cache/Jupiter
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
                    logoURI: metaMap.get(t.mint)?.logoURI ?? t.logoURI,
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
  const txType = detail ? detectTxType(detail.tokenTransfers, detail.solChange) : 'Transaction'

  return (
    <SafeAreaViewUniwind className="bg-background flex-1" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={() => router.back()} className="p-1 active:opacity-60">
          <Icon icon={ArrowLeft01Icon} className="text-foreground size-6" />
        </Pressable>
        <Text className="text-foreground text-base font-semibold">Transaction</Text>
        <ThemeToggle />
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {loading ? (
          /* Loading skeleton */
          <View className="gap-4 pt-4">
            <View className="items-center gap-3 py-6">
              <Skeleton className="h-14 w-14 rounded-full" />
              <Skeleton className="h-6 w-48 rounded-md" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-4 w-36 rounded-md" />
            </View>
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </View>
        ) : error ? (
          <View className="border-border mt-8 items-center gap-2 rounded-2xl border border-dashed px-6 py-10">
            <Text variant="muted" className="text-center">
              {error}
            </Text>
          </View>
        ) : detail ? (
          <>
            {/* Animated status hero (includes type badge + timestamp) */}
            <StatusHero
              success={detail.success}
              blockTime={detail.blockTime}
              txType={txType}
            />

            {/* Summary */}
            <AnimatedCard delay={60}>
              <Card className="mb-4 overflow-hidden p-0">
                <View className="px-5 pt-4 pb-1">
                  <SectionLabel label="Summary" />
                </View>
                <CardContent className="px-5 pb-5 pt-0">
                  <View className="flex-row">
                    <View className="flex-1">
                      <Text variant="muted" className="mb-1 text-xs uppercase tracking-wider">
                        SOL Change
                      </Text>
                      <Text
                        className={[
                          'text-lg font-bold tabular-nums',
                          detail.solChange >= 0 ? 'text-green-500' : 'text-destructive',
                        ].join(' ')}>
                        {detail.solChange >= 0 ? '+' : ''}
                        {detail.solChange.toFixed(6)} SOL
                      </Text>
                    </View>
                    <View className="flex-1 items-end">
                      <Text variant="muted" className="mb-1 text-xs uppercase tracking-wider">
                        Network Fee
                      </Text>
                      <Text className="text-muted-foreground text-sm font-semibold tabular-nums">
                        {detail.fee.toFixed(6)} SOL
                      </Text>
                    </View>
                  </View>
                </CardContent>
              </Card>
            </AnimatedCard>

            {/* Token Transfers — only shown if any */}
            {detail.tokenTransfers.length > 0 && (
              <AnimatedCard delay={120}>
                <Card className="mb-4 overflow-hidden p-0">
                  <View className="px-5 pt-4 pb-1">
                    <SectionLabel label={`Token Transfers (${detail.tokenTransfers.length})`} />
                  </View>
                  <CardContent className="gap-4 px-5 pb-5 pt-0">
                    {detail.tokenTransfers.map((t) => (
                      <TokenTransferRow key={t.mint} {...t} />
                    ))}
                  </CardContent>
                </Card>
              </AnimatedCard>
            )}

            {/* Transaction Details */}
            <AnimatedCard delay={180}>
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
                          numberOfLines={3}>
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
                            }>
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
                      {detail.slot.toLocaleString()}
                    </Text>
                  </View>

                  {/* Timestamp */}
                  {detail.blockTime && (
                    <>
                      <Separator className="mx-5" />
                      <View className="px-5 py-4">
                        <Text variant="muted" className="mb-1 text-xs uppercase tracking-wider">
                          Timestamp
                        </Text>
                        <Text className="text-foreground text-sm">
                          {format(new Date(detail.blockTime * 1000), 'EEE MMM d, yyyy h:mm:ss a')}
                        </Text>
                        <Text variant="muted" className="mt-0.5 text-xs">
                          {formatDate(new Date(detail.blockTime * 1000))}
                        </Text>
                      </View>
                    </>
                  )}
                </CardContent>
              </Card>
            </AnimatedCard>

            {/* Accounts */}
            <AnimatedCard delay={240}>
              <Card className="mb-4 gap-0 overflow-hidden p-0">
                <View className="px-5 pt-4 pb-1">
                  <SectionLabel label={`Accounts (${detail.accounts.length})`} />
                </View>
                <CardContent className="gap-3 px-5 pb-5 pt-0">
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

            {/* Explorer Links */}
            <AnimatedCard delay={300}>
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
                <Separator className="mx-5" />
                <Pressable
                  onPress={() =>
                    Linking.openURL(`https://explorer.solana.com/tx/${signature}`)
                  }
                  className="active:opacity-60">
                  <View className="flex-row items-center justify-between px-5 py-4">
                    <View className="flex-row items-center gap-3">
                      <View className="bg-muted h-8 w-8 items-center justify-center rounded-full">
                        <Text className="text-muted-foreground text-xs font-bold">◎</Text>
                      </View>
                      <Text className="text-foreground font-medium">Solana Explorer</Text>
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
