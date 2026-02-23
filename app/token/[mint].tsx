import { useEffect, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { AnimatedCard } from '@/components/ui/animated-card'
import { SectionLabel } from '@/components/ui/section-label'
import { ThemeToggle } from '@/components/theme-toggle-button'
import { SafeAreaViewUniwind } from '@/components/styled-uniwind-components'
import { TokenHero } from '@/components/token-detail/token-hero'
import { HoldingsCard } from '@/components/token-detail/holdings-card'
import { MarketStatsCard } from '@/components/token-detail/market-stats-card'
import { TokenInfoCard } from '@/components/token-detail/token-info-card'
import { LinksCard } from '@/components/token-detail/links-card'
import { short } from '@/utils/format-text'
import { fetchTokenJupiterDetail } from '@/lib/solana/token-details'
import { useHistoryStore } from '@/store/history-store'
import { useNetwork } from '@/context/network-context'
import type { TokenJupiterDetail } from '@/types'

export default function TokenDetailScreen() {
  const { mint, amount, tokenName, symbol, logoURI } = useLocalSearchParams<{
    mint: string
    amount: string
    tokenName?: string
    symbol?: string
    logoURI?: string
  }>()

  const { network } = useNetwork()
  const [imgError, setImgError] = useState(false)
  const [jupiterDetail, setJupiterDetail] = useState<TokenJupiterDetail | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    useHistoryStore.getState().trackToken(mint, network)
    let cancelled = false
    fetchTokenJupiterDetail(mint, network).then((detail) => {
      if (cancelled) return

      console.log('Fetched Jupiter detail for mint', mint, detail)
      setJupiterDetail(detail)
      setDataLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [mint])

  const parsedAmount = parseFloat(amount ?? '0')
  const displayName = tokenName || jupiterDetail?.name || short(mint, 6)
  const displaySymbol = symbol || jupiterDetail?.symbol || null
  const resolvedLogoURI = logoURI && logoURI !== '' ? logoURI : (jupiterDetail?.logoURI ?? null)
  const priceUsd = jupiterDetail?.priceUsd ?? null
  const usdValue = priceUsd != null ? parsedAmount * priceUsd : null

  return (
    <SafeAreaViewUniwind className="bg-background flex-1" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={() => router.back()} className="p-1 active:opacity-60">
          <Icon icon={ArrowLeft01Icon} className="text-foreground size-6" />
        </Pressable>
        <Text className="text-foreground text-base font-semibold">Token Details</Text>
        <ThemeToggle />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <TokenHero
          detail={jupiterDetail}
          loading={dataLoading}
          logoURI={resolvedLogoURI}
          displayName={displayName}
          displaySymbol={displaySymbol}
          imgError={imgError}
          onImgError={() => setImgError(true)}
        />

        <View className="gap-4 px-5 pb-10">
          <HoldingsCard
            amount={parsedAmount}
            symbol={displaySymbol}
            usdValue={usdValue}
            address={mint}
          />

          {!dataLoading && jupiterDetail?.description ? (
            <AnimatedCard delay={160}>
              <Card className="overflow-hidden p-0">
                <View className="px-5 pb-5 pt-4">
                  <SectionLabel label="About" />
                  <Text className="text-foreground text-sm leading-6" numberOfLines={6}>
                    {jupiterDetail.description}
                  </Text>
                </View>
              </Card>
            </AnimatedCard>
          ) : null}

          <MarketStatsCard detail={jupiterDetail} loading={dataLoading} />
          <TokenInfoCard mint={mint} detail={jupiterDetail} loading={dataLoading} />
          <LinksCard mint={mint} detail={jupiterDetail} loading={dataLoading} />
        </View>
      </ScrollView>
    </SafeAreaViewUniwind>
  )
}
