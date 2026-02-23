import { useEffect, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { SafeAreaViewUniwind } from '@/components/styled-uniwind-components'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { Skeleton } from '@/components/ui/skeleton'
import { ThemeToggle } from '@/components/theme-toggle-button'
import { useNetwork } from '@/context/network-context'
import { getTransactionDetail } from '@/lib/solana'
import { getMetaDataFromCacheOrFetch } from '@/lib/cache/token-metadata'
import { StatusHero } from '@/components/transaction-detail/status-hero'
import { SummaryCard } from '@/components/transaction-detail/summary-card'
import { TokenTransfersCard } from '@/components/transaction-detail/token-transfers-card'
import { TransactionInfoCard } from '@/components/transaction-detail/transaction-info-card'
import { AccountsCard } from '@/components/transaction-detail/accounts-card'
import { ExplorerLinksCard } from '@/components/transaction-detail/explorer-links-card'
import type { TxDetail, TokenTransfer } from '@/components/transaction-detail/types'

const LAMPORTS = 1_000_000_000

// ─── Tx type detection ─────────────────────────────────────────────────────

function detectTxType(tokenTransfers: TokenTransfer[], solChange: number): string {
  const hasIn = tokenTransfers.some((t) => t.delta > 0)
  const hasOut = tokenTransfers.some((t) => t.delta < 0)
  if (hasIn && hasOut) return 'Swap'
  if (tokenTransfers.length > 0) return 'Token Transfer'
  if (Math.abs(solChange) > 0.000001) return 'SOL Transfer'
  return 'Transaction'
}

// ─── Screen ────────────────────────────────────────────────────────────────

export default function TransactionDetailScreen() {
  const { signature } = useLocalSearchParams<{ signature: string }>()
  const { rpc, network } = useNetwork()
  const [detail, setDetail] = useState<TxDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

          // Resolve token symbols + logos from cache/Jupiter
          if (tokenTransfers.length > 0) {
            const mints = tokenTransfers.map((t) => t.mint)
            const metaMap = await getMetaDataFromCacheOrFetch({ mints, network })
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
            <StatusHero success={detail.success} blockTime={detail.blockTime} txType={txType} />
            <SummaryCard solChange={detail.solChange} fee={detail.fee} delay={60} />
            <TokenTransfersCard transfers={detail.tokenTransfers} delay={120} />
            <TransactionInfoCard
              signature={detail.signature}
              slot={detail.slot}
              blockTime={detail.blockTime}
              delay={180}
            />
            <AccountsCard accounts={detail.accounts} delay={240} />
            <ExplorerLinksCard signature={detail.signature} delay={300} />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaViewUniwind>
  )
}
