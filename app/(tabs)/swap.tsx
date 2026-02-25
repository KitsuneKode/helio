import { useState } from 'react'
import { View } from 'react-native'
import {
  KeyboardAwareScrollViewUniwind,
  SafeAreaViewUniwind,
} from '@/components/styled-uniwind-components'
import { QuoteCard } from '@/components/swap-screen/quote-card'
import { QuoteCardSkeleton } from '@/components/swap-screen/quote-card-skeleton'
import { SlippageSelector } from '@/components/swap-screen/slippage-selector'
import { SwapAmountCard } from '@/components/swap-screen/swap-amount-card'
import { SwapCta } from '@/components/swap-screen/swap-cta'
import { SwapFlipButton } from '@/components/swap-screen/swap-flip-button'
import { SwapFooter } from '@/components/swap-screen/swap-footer'
import { SwapHeader } from '@/components/swap-screen/swap-header'
import { TokenPickerModal } from '@/components/swap-screen/token-picker-modal'
import { Text } from '@/components/ui/text'
import { useNetwork } from '@/context/network-context'
import { useSwapScreen } from '@/hooks/use-swap-screen'

export default function SwapScreen() {
  const swap = useSwapScreen()
  const { toggleNetwork } = useNetwork()
  const [pickerSide, setPickerSide] = useState<'from' | 'to' | null>(null)

  return (
    <SafeAreaViewUniwind className="bg-background flex-1" edges={['top', 'bottom']}>
      <KeyboardAwareScrollViewUniwind
        showsVerticalScrollIndicator={false}
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="pb-12 px-5 flex-1"
      >
        <SwapHeader />

        {swap.isDevnet ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-foreground text-center text-lg font-semibold">
              Swapping is only available on mainnet
            </Text>
            <Text className="text-muted-foreground mt-2 text-center text-sm">
              Swaps unavailable on devnet{' · '}
              <Text className="text-primary text-sm font-medium" onPress={toggleNetwork}>
                Switch to Mainnet
              </Text>
            </Text>
          </View>
        ) : (
          <>
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
              onFromPress={() => setPickerSide('from')}
              onToPress={() => setPickerSide('to')}
            />

            <SlippageSelector slippage={swap.slippage} onChange={swap.handleSlippage} />

            {swap.hasQuote && swap.rateStr && (
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
              connected={swap.connected}
              connecting={swap.connecting}
              onConnect={swap.connect}
              insufficientBalance={swap.insufficientBalance}
              fromSymbol={swap.fromToken.symbol}
              swapStatus={swap.swapStatus}
            />

            <SwapFooter />

            <TokenPickerModal
              visible={pickerSide !== null}
              onClose={() => setPickerSide(null)}
              onSelect={(token) => {
                if (pickerSide === 'from') swap.handleSelectFrom(token)
                else if (pickerSide === 'to') swap.handleSelectTo(token)
              }}
              selectedMint={pickerSide === 'from' ? swap.fromToken.mint : swap.toToken.mint}
              otherMint={pickerSide === 'from' ? swap.toToken.mint : swap.fromToken.mint}
            />
          </>
        )}
      </KeyboardAwareScrollViewUniwind>
    </SafeAreaViewUniwind>
  )
}
