import { useEffect, useState } from 'react'
import { Linking, Pressable, ScrollView, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams, router } from 'expo-router'
import {
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
  CancelCircleIcon,
  Copy01Icon,
  ExternalLink,
  ArrowUpDownIcon,
} from '@hugeicons/core-free-icons'
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { Skeleton } from '@/components/ui/skeleton'
import { short } from '@/utils/format-text'
import { useNetwork } from '@/context/network-context'
import { getTransactionDetail } from '@/lib/solana'
import { format } from 'date-fns'
import { formatDate } from '@/utils/format-date'
import { SafeAreaViewUniwind } from '@/components/styled-uniwind-components'

const LAMPORTS = 1_000_000_000

type TokenTransfer = { mint: string; delta: number }
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

// ─────────────────────────────────────────────────────────────────────────────
// Infer transaction type label
// ─────────────────────────────────────────────────────────────────────────────

function inferTxType(d: TxDetail): { label: string; color: string; bg: string } {
  const c = d.tokenTransfers.length
  if (c === 0 && Math.abs(d.solChange) > 0)
    return { label: 'SOL Transfer', color: 'text-blue-400', bg: 'bg-blue-500/10' }
  if (c === 1) return { label: 'Token Transfer', color: 'text-violet-400', bg: 'bg-violet-500/10' }
  if (c === 2) return { label: 'Swap', color: 'text-primary', bg: 'bg-primary/10' }
  if (c > 2) return { label: 'DeFi Interaction', color: 'text-orange-400', bg: 'bg-orange-500/10' }
  return { label: 'Transaction', color: 'text-muted-foreground', bg: 'bg-muted' }
}

// ─────────────────────────────────────────────────────────────────────────────
// Pulsing glow ring — GPU-safe (opacity + scale only)
// ─────────────────────────────────────────────────────────────────────────────

function PulseRing({ success }: { success: boolean }) {
  const scale = useSharedValue(1)
  const opacity = useSharedValue(0.55)

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 900, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 0 }),
      ),
      -1,
    )
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 900, easing: Easing.out(Easing.quad) }),
        withTiming(0.55, { duration: 0 }),
      ),
      -1,
    )
  }, [scale, opacity])

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      style={style}
      className={[
        'absolute h-[72px] w-[72px] rounded-full border',
        success ? 'border-green-400 bg-green-400/10' : 'border-red-400 bg-red-400/10',
      ].join(' ')}
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Token Transfer Row
// ─────────────────────────────────────────────────────────────────────────────

const TransferRow = ({ mint, delta, index }: { mint: string; delta: number; index: number }) => {
  const pos = delta >= 0
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 55)
        .springify()
        .damping(18)}
      className="flex-row items-center gap-3 py-2"
    >
      <View
        className={[
          'h-8 w-8 items-center justify-center rounded-xl',
          pos ? 'bg-green-500/10' : 'bg-red-500/10',
        ].join(' ')}
      >
        <Icon
          icon={ArrowUpDownIcon}
          className={`size-4 ${pos ? 'text-green-400' : 'text-red-400'}`}
        />
      </View>
      <Text className="text-muted-foreground font-mono flex-1 text-sm" numberOfLines={1}>
        {short(mint, 8)}
      </Text>
      <Text className={`font-mono text-sm font-bold ${pos ? 'text-green-400' : 'text-red-400'}`}>
        {pos ? '+' : ''}
        {delta.toLocaleString(undefined, { maximumFractionDigits: 6 })}
      </Text>
    </Animated.View>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Info row
// ─────────────────────────────────────────────────────────────────────────────

const InfoRow = ({
  label,
  value,
  mono,
  delay = 0,
}: {
  label: string
  value: string
  mono?: boolean
  delay?: number
}) => (
  <Animated.View
    entering={FadeInDown.delay(delay).springify().damping(20)}
    className="flex-row items-center justify-between py-3"
  >
    <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
      {label}
    </Text>
    <Text
      className={[
        'text-foreground max-w-[60%] text-right text-sm',
        mono ? 'font-mono' : 'font-medium',
      ].join(' ')}
      numberOfLines={1}
    >
      {value}
    </Text>
  </Animated.View>
)

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────

export default function TransactionDetailScreenAntigravity() {
  const { signature } = useLocalSearchParams<{ signature: string }>()
  const { rpc } = useNetwork()
  const [detail, setDetail] = useState<TxDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedSig, setCopiedSig] = useState(false)
  const [showAllAccounts, setShowAllAccounts] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
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
          const m = t.mint
          if (!tokenMap[m]) tokenMap[m] = { pre: 0, post: 0 }
          tokenMap[m].pre += parseFloat(t.uiTokenAmount?.uiAmountString ?? '0')
        }
        for (const t of postToken) {
          const m = t.mint
          if (!tokenMap[m]) tokenMap[m] = { pre: 0, post: 0 }
          tokenMap[m].post += parseFloat(t.uiTokenAmount?.uiAmountString ?? '0')
        }
        const tokenTransfers = Object.entries(tokenMap)
          .map(([m, { pre, post }]) => ({ mint: m, delta: post - pre }))
          .filter((t) => Math.abs(t.delta) > 0)

        const accounts = accountKeys.map((k: any) => ({
          address: k.pubkey?.toString() ?? k.toString(),
          signer: k.signer ?? false,
          writable: k.writable ?? false,
        }))

        if (!cancelled)
          setDetail({
            success,
            fee,
            slot,
            blockTime,
            solChange,
            tokenTransfers,
            accounts,
            signature,
          })
      } catch {
        if (!cancelled) setError('Failed to load transaction details.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
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

  const openSolscan = () => Linking.openURL(`https://solscan.io/tx/${signature}`)

  const visibleAccounts = detail
    ? showAllAccounts
      ? detail.accounts
      : detail.accounts.slice(0, 3)
    : []
  const hiddenCount = detail ? detail.accounts.length - 3 : 0
  const txMeta = detail ? inferTxType(detail) : null

  return (
    <SafeAreaViewUniwind className="bg-background flex-1" edges={['top', 'bottom']}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(220)} className="flex-row items-center px-5 py-3">
        <Pressable onPress={() => router.back()} className="p-1 active:opacity-60" hitSlop={12}>
          <Icon icon={ArrowLeft01Icon} className="text-foreground size-6" />
        </Pressable>
        <Text className="text-foreground flex-1 text-center text-base font-semibold">
          Transaction
        </Text>
        <Pressable
          onPress={openSolscan}
          className="bg-primary/10 border-primary/20 rounded-xl border p-2 active:opacity-70"
          hitSlop={8}
        >
          <Icon icon={ExternalLink} className="text-primary size-4" />
        </Pressable>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4">
        {loading ? (
          <View className="gap-4 pt-4">
            <View className="items-center gap-3 py-8">
              <Skeleton className="h-20 w-20 rounded-full" />
              <Skeleton className="h-6 w-48 rounded-xl" />
              <Skeleton className="h-4 w-36 rounded-lg" />
            </View>
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-44 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </View>
        ) : error ? (
          <Animated.View
            entering={FadeInDown.springify()}
            className="bg-card border-red-500/20 m-6 items-center gap-4 rounded-2xl border p-8"
          >
            <Icon icon={CancelCircleIcon} className="text-destructive size-8" />
            <Text className="text-muted-foreground text-center text-sm">{error}</Text>
          </Animated.View>
        ) : detail ? (
          <>
            {/* ── Status Hero ── */}
            <Animated.View
              entering={FadeInDown.delay(60).springify().damping(16)}
              className="items-center py-10 gap-5"
            >
              {/* Icon with pulse */}
              <View className="h-[72px] w-[72px] items-center justify-center">
                <PulseRing success={detail.success} />
                <View
                  className={[
                    'h-[60px] w-[60px] items-center justify-center rounded-full',
                    detail.success ? 'bg-green-500/15' : 'bg-red-500/15',
                  ].join(' ')}
                >
                  <Icon
                    icon={detail.success ? CheckmarkCircle01Icon : CancelCircleIcon}
                    className={`size-8 ${detail.success ? 'text-green-400' : 'text-red-400'}`}
                  />
                </View>
              </View>

              <Animated.View
                entering={FadeInDown.delay(120).springify()}
                className="items-center gap-2.5"
              >
                <Text className="text-foreground text-2xl font-bold tracking-tight">
                  {detail.success ? 'Confirmed' : 'Failed'}
                </Text>

                {txMeta && (
                  <View className={`rounded-full px-4 py-1.5 ${txMeta.bg}`}>
                    <Text className={`text-xs font-bold uppercase tracking-widest ${txMeta.color}`}>
                      {txMeta.label}
                    </Text>
                  </View>
                )}

                <Text className="text-muted-foreground font-mono text-xs text-center">
                  {detail.blockTime
                    ? `${formatDate(new Date(detail.blockTime * 1000))}  ·  Block #${detail.slot.toLocaleString()}`
                    : `Block #${detail.slot.toLocaleString()}`}
                </Text>
              </Animated.View>
            </Animated.View>

            {/* ── Value Moved ── */}
            <Animated.View
              entering={FadeInDown.delay(180).springify().damping(18)}
              className="bg-card border-border mb-3 overflow-hidden rounded-2xl border"
            >
              <View className="border-border border-b px-5 py-3">
                <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                  Value Moved
                </Text>
              </View>
              <View className="flex-row px-5 py-5">
                <View className="flex-1 gap-1.5">
                  <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                    SOL Change
                  </Text>
                  <Text
                    className={`font-mono text-xl font-bold ${
                      detail.solChange >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {detail.solChange >= 0 ? '+' : ''}
                    {detail.solChange.toFixed(6)} SOL
                  </Text>
                </View>
                <View className="flex-1 items-end gap-1.5">
                  <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                    Fee
                  </Text>
                  <Text className="text-muted-foreground font-mono text-base font-semibold">
                    {detail.fee.toFixed(6)} SOL
                  </Text>
                </View>
              </View>

              {detail.tokenTransfers.length > 0 && (
                <View className="border-border border-t px-5 py-3">
                  <Text className="text-muted-foreground mb-2 text-[10px] font-bold uppercase tracking-widest">
                    Token Transfers
                  </Text>
                  {detail.tokenTransfers.map((t, i) => (
                    <TransferRow key={t.mint} mint={t.mint} delta={t.delta} index={i} />
                  ))}
                </View>
              )}
            </Animated.View>

            {/* ── Details ── */}
            <Animated.View
              entering={FadeInDown.delay(260).springify().damping(18)}
              className="bg-card border-border mb-3 overflow-hidden rounded-2xl border"
            >
              <View className="border-border border-b px-5 py-3">
                <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                  Details
                </Text>
              </View>
              <View className="px-5">
                {/* Signature row */}
                <View className="flex-row items-center gap-3 py-4">
                  <View className="flex-1">
                    <Text className="text-muted-foreground mb-1 text-[10px] font-bold uppercase tracking-wider">
                      Signature
                    </Text>
                    <Text className="text-foreground font-mono text-sm" numberOfLines={1}>
                      {short(signature, 14)}
                    </Text>
                  </View>
                  <Pressable
                    onPress={handleCopySig}
                    className={[
                      'flex-row items-center gap-1.5 rounded-xl px-3 py-2 active:opacity-70',
                      copiedSig ? 'bg-primary/15' : 'bg-muted',
                    ].join(' ')}
                  >
                    <Icon
                      icon={Copy01Icon}
                      className={`size-3.5 ${copiedSig ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                    <Text
                      className={`text-xs font-semibold ${copiedSig ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                      {copiedSig ? 'Copied!' : 'Copy'}
                    </Text>
                  </Pressable>
                </View>

                <View className="bg-border h-px" />
                <InfoRow
                  label="Block"
                  value={`#${detail.slot.toLocaleString()}`}
                  mono
                  delay={300}
                />

                {detail.blockTime && (
                  <>
                    <View className="bg-border h-px" />
                    <InfoRow
                      label="Timestamp"
                      value={format(new Date(detail.blockTime * 1000), 'MMM d, yyyy · hh:mm a')}
                      delay={340}
                    />
                  </>
                )}

                <View className="bg-border h-px" />
                <InfoRow
                  label="Status"
                  value={detail.success ? '✓  Finalized' : '✕  Failed'}
                  delay={380}
                />
              </View>
            </Animated.View>

            {/* ── Accounts ── */}
            <Animated.View
              entering={FadeInDown.delay(340).springify().damping(18)}
              className="bg-card border-border mb-10 overflow-hidden rounded-2xl border"
            >
              <View className="border-border border-b px-5 py-3">
                <Text className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                  Accounts ({detail.accounts.length})
                </Text>
              </View>
              <View className="px-5 py-2">
                {visibleAccounts.map((acc, i) => (
                  <View key={acc.address}>
                    {i > 0 && <View className="bg-border h-px" />}
                    <Animated.View
                      entering={FadeInDown.delay(i * 50 + 300)
                        .springify()
                        .damping(22)}
                      className="flex-row items-center gap-3 py-3.5"
                    >
                      <Text className="text-foreground font-mono flex-1 text-sm" numberOfLines={1}>
                        {short(acc.address, 8)}
                      </Text>
                      <View className="flex-row gap-1.5">
                        {acc.signer && (
                          <View className="bg-primary/10 border-primary/20 rounded-md border px-2 py-1">
                            <Text className="text-primary text-[9px] font-extrabold tracking-widest">
                              SIGNER
                            </Text>
                          </View>
                        )}
                        {acc.writable && (
                          <View className="bg-muted rounded-md px-2 py-1">
                            <Text className="text-muted-foreground text-[9px] font-bold tracking-widest">
                              WRITE
                            </Text>
                          </View>
                        )}
                      </View>
                    </Animated.View>
                  </View>
                ))}

                {hiddenCount > 0 && (
                  <Pressable
                    onPress={() => setShowAllAccounts((p) => !p)}
                    className="items-center py-4 active:opacity-60"
                  >
                    <Text className="text-primary text-sm font-semibold">
                      {showAllAccounts ? '↑ Show less' : `+ ${hiddenCount} more accounts`}
                    </Text>
                  </Pressable>
                )}
              </View>
            </Animated.View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaViewUniwind>
  )
}
