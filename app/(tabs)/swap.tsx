import { ScrollView } from 'react-native'
import { SafeAreaViewUniwind } from '@/components/styled-uniwind-components'
import { QuoteCard } from '@/components/swap-screen/quote-card'
import { QuoteCardSkeleton } from '@/components/swap-screen/quote-card-skeleton'
import { SlippageSelector } from '@/components/swap-screen/slippage-selector'
import { SwapAmountCard } from '@/components/swap-screen/swap-amount-card'
import { SwapCta } from '@/components/swap-screen/swap-cta'
import { SwapFlipButton } from '@/components/swap-screen/swap-flip-button'
import { SwapFooter } from '@/components/swap-screen/swap-footer'
import { SwapHeader } from '@/components/swap-screen/swap-header'
import { useSwapScreen } from '@/hooks/use-swap-screen'

export default function SwapScreen() {
  const swap = useSwapScreen()

  return (
    <SafeAreaViewUniwind className="bg-background flex-1" edges={['top', 'bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="pb-12 px-5 flex-1"
      >
        <SwapHeader />

        <SwapAmountCard
          fromToken={swap.fromToken}
          toToken={swap.toToken}
          payAmount={swap.payAmount}
          onAmountChange={swap.handleAmountChange}
          payFontSize={swap.payFontSize}
          receiveDisplay={swap.receiveDisplay}
          receiveFontSize={swap.receiveFontSize}
          quoteError={swap.quoteError}
          inputTextColor={swap.inputTextColor}
          placeholderColor={swap.placeholderColor}
          flipOpacity={swap.flipOpacity}
          outputOpacity={swap.outputOpacity}
          middleSlot={<SwapFlipButton flipRotate={swap.flipRotate} onPress={swap.handleFlip} />}
        />

        <SlippageSelector slippage={swap.slippage} onChange={swap.handleSlippage} />

        {swap.canSwap && swap.rateStr && (
          <QuoteCard
            rate={swap.rateStr}
            priceImpact={swap.impact}
            route={`${swap.fromToken.symbol} → ${swap.toToken.symbol}`}
            minReceived={swap.minReceived ?? ''}
          />
        )}

        {swap.quoteLoading && swap.parsedPay > 0 && <QuoteCardSkeleton />}

        <SwapCta
          canSwap={swap.canSwap}
          ctaLabel={swap.ctaLabel}
          parsedPay={swap.parsedPay}
          onPress={swap.handleCtaPress}
        />

        <SwapFooter />
      </ScrollView>
    </SafeAreaViewUniwind>
  )
}
