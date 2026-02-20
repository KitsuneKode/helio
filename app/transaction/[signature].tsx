import { useEffect, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams, router } from 'expo-router'
import {
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
  CancelCircleIcon,
  Copy01Icon,
} from '@hugeicons/core-free-icons'
import { Card, CardContent } from '@/components/ui/card'
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

type TokenTransfer = {
  mint: string
  delta: number
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

function TokenTransferRow({ mint, delta }: { mint: string; delta: number }) {
  const sign = delta >= 0 ? '+' : ''
  const color = delta >= 0 ? 'text-green-500' : 'text-destructive'

  return (
    <Text className={`${color} text-sm font-semibold`}>
      {sign}
      {delta.toLocaleString(undefined, { maximumFractionDigits: 6 })} {short(mint, 6)}
    </Text>
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

        // Net SOL change for fee payer (index 0)
        const preBal: number[] = (meta?.preBalances ?? []).map(Number)
        const postBal: number[] = (meta?.postBalances ?? []).map(Number)
        const solChange =
          preBal[0] !== undefined && postBal[0] !== undefined
            ? (postBal[0] - preBal[0]) / LAMPORTS
            : 0

        // Token transfers
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

        // Accounts
        const accounts = accountKeys.map((k: any) => ({
          address: k.pubkey?.toString() ?? k.toString(),
          signer: k.signer ?? false,
          writable: k.writable ?? false,
        }))

        if (!cancelled) {
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

  const hiddenCount = detail ? detail.accounts.length - 3 : 0

  return (
    <SafeAreaViewUniwind className="bg-background flex-1" edges={['top', 'bottom']}>
      {/* Custom header */}
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
            {/* Status header */}
            <View className="items-center gap-3 py-8">
              <View
                className={[
                  'h-14 w-14 items-center justify-center rounded-full',
                  detail.success ? 'bg-green-500/10' : 'bg-destructive/10',
                ].join(' ')}>
                {detail.success ? (
                  <Icon icon={CheckmarkCircle01Icon} className="size-7 text-green-500" />
                ) : (
                  <Icon icon={CancelCircleIcon} className="text-destructive size-7" />
                )}
              </View>
              <Text className="text-foreground text-xl font-semibold">
                {detail.success ? 'Transaction Confirmed' : 'Transaction Failed'}
              </Text>
              <Text variant="muted" className="text-center text-sm">
                {detail.blockTime
                  ? `${formatDate(new Date(detail.blockTime * 1000))} · Block #${detail.slot.toLocaleString()}`
                  : `Block #${detail.slot.toLocaleString()}`}
              </Text>
            </View>

            {/* Value moved */}
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
                    <Text className="text-muted-foreground text-lg font-semibold">
                      {detail.fee.toFixed(6)}
                    </Text>
                  </View>
                </View>

                {detail.tokenTransfers.length > 0 && (
                  <View className="border-border gap-1.5 border-t pt-3">
                    <Text variant="muted" className="mb-1 text-xs tracking-wider uppercase">
                      Token Transfers
                    </Text>
                    {detail.tokenTransfers.map((t) => (
                      <TokenTransferRow key={t.mint} mint={t.mint} delta={t.delta} />
                    ))}
                  </View>
                )}
              </CardContent>
            </Card>

            {/* Details */}
            <Card className="mb-4 gap-0 overflow-hidden p-0">
              <View className="bg-primary/10 px-5 py-3">
                <Text variant="muted" className="text-xs tracking-wider uppercase">
                  Details
                </Text>
              </View>
              <CardContent className="gap-4 px-5 py-4">
                {/* Signature */}
                <View>
                  <Text variant="muted" className="mb-1 text-xs tracking-wider uppercase">
                    Signature
                  </Text>
                  <Pressable onPress={handleCopySig} className="active:opacity-60">
                    <View className="flex-row items-center gap-3">
                      <Text className="text-foreground flex-1 font-mono text-sm" numberOfLines={1}>
                        {short(signature, 10)}
                      </Text>
                      <View className="bg-muted flex-row items-center gap-1.5 rounded-lg px-2.5 py-1.5">
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

                {/* Timestamp */}
                {detail.blockTime && (
                  <View>
                    <Text variant="muted" className="mb-1 text-xs tracking-wider uppercase">
                      Timestamp
                    </Text>
                    <Text className="text-foreground text-sm">
                      {format(new Date(detail.blockTime * 1000), 'EEE MMM d, yyyy h:mm a')}
                    </Text>
                  </View>
                )}

                {/* Block */}
                <View>
                  <Text variant="muted" className="mb-1 text-xs tracking-wider uppercase">
                    Block
                  </Text>
                  <Text className="text-foreground text-sm">{detail.slot.toLocaleString()}</Text>
                </View>
              </CardContent>
            </Card>

            {/* Accounts */}
            <Card className="mb-8 gap-0 overflow-hidden p-0">
              <View className="bg-primary/10 px-5 py-3">
                <Text variant="muted" className="text-xs tracking-wider uppercase">
                  Accounts ({detail.accounts.length})
                </Text>
              </View>
              <CardContent className="gap-3 px-5 py-4">
                {visibleAccounts.map((acc) => (
                  <View key={acc.address} className="flex-row flex-wrap items-center gap-2">
                    <Text className="text-foreground font-mono text-sm">
                      {short(acc.address, 6)}
                    </Text>
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
                      {showAllAccounts ? 'Show less' : `+ ${hiddenCount} more ↓`}
                    </Text>
                  </Pressable>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaViewUniwind>
  )
}
