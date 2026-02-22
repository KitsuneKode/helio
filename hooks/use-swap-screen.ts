import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert } from 'react-native'
import * as Haptics from 'expo-haptics'
import { Easing, runOnJS, useSharedValue, withTiming } from 'react-native-reanimated'
import { useUniwind } from 'uniwind'
import { fetchSwapQuote } from '@/lib/solana/swap'
import {
  getAmountFontSize,
  parsePriceImpact,
  rawToDisplay,
} from '@/components/swap-screen/swap-formatters'
import { SOL, type SlippageOpt, USDC } from '@/types/swap-screen'
import { SwapQuote } from '@/types'

export function useSwapScreen() {
  const { theme } = useUniwind()
  const isDark = (theme ?? 'light') === 'dark'
  const inputTextColor = isDark ? '#F4F4F5' : '#18181B'
  const placeholderColor = '#71717A'

  const [payAmount, setPayAmount] = useState('')
  const [slippage, setSlippage] = useState<SlippageOpt>('0.5')
  const [flipped, setFlipped] = useState(false)
  const [quote, setQuote] = useState<SwapQuote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)

  const fromToken = flipped ? USDC : SOL
  const toToken = flipped ? SOL : USDC

  const flipRotate = useSharedValue(0)
  const flipOpacity = useSharedValue(1)
  const outputOpacity = useSharedValue(1)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerQuote = useCallback(
    (amount: string, fromMint: typeof fromToken, toMint: typeof toToken, slip: string) => {
      const parsed = parseFloat(amount)
      if (!amount || isNaN(parsed) || parsed <= 0) {
        setQuote(null)
        setQuoteError(null)
        setQuoteLoading(false)
        outputOpacity.value = withTiming(1, { duration: 120 })
        return
      }

      setQuoteLoading(true)
      setQuoteError(null)
      outputOpacity.value = withTiming(0.35, { duration: 150 })

      const rawAmount = Math.round(parsed * 10 ** fromMint.decimals)
      const slippageBps = Math.round(parseFloat(slip) * 100)

      fetchSwapQuote(fromMint.mint, toMint.mint, rawAmount, slippageBps).then((nextQuote) => {
        setQuoteLoading(false)
        if (!nextQuote) {
          setQuote(null)
          setQuoteError('No route found for this pair.')
          outputOpacity.value = withTiming(1, { duration: 120 })
        } else {
          setQuote(nextQuote)
          setQuoteError(null)
          outputOpacity.value = withTiming(1, { duration: 200 })
        }
      })
    },
    [outputOpacity],
  )

  const handleAmountChange = (val: string) => {
    setPayAmount(val)
    setQuote(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => triggerQuote(val, fromToken, toToken, slippage), 600)
  }

  const handleSlippage = (val: SlippageOpt) => {
    Haptics.selectionAsync()
    setSlippage(val)
    if (payAmount && parseFloat(payAmount) > 0) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => triggerQuote(payAmount, fromToken, toToken, val), 300)
    }
  }

  const handleFlip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    const newFlipped = !flipped
    const newFrom = newFlipped ? USDC : SOL
    const newTo = newFlipped ? SOL : USDC
    const currentPayAmount = payAmount
    const currentSlippage = slippage

    flipRotate.value = withTiming(flipRotate.value + 180, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    })

    const applyFlip = () => {
      setFlipped(newFlipped)
      setQuote(null)
      setQuoteError(null)
      if (currentPayAmount && parseFloat(currentPayAmount) > 0) {
        triggerQuote(currentPayAmount, newFrom, newTo, currentSlippage)
      } else {
        outputOpacity.value = withTiming(1, { duration: 120 })
      }
    }

    flipOpacity.value = withTiming(0, { duration: 90, easing: Easing.in(Easing.quad) }, () => {
      runOnJS(applyFlip)()
      flipOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) })
    })
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const parsedPay = parseFloat(payAmount) || 0
  const receiveDisplay = quote ? rawToDisplay(quote.outAmount, toToken.decimals) : ''

  const payFontSize = getAmountFontSize(payAmount || '0')
  const receiveFontSize = getAmountFontSize(receiveDisplay || '0')

  const rateStr =
    quote && parsedPay > 0
      ? (() => {
          const out = parseInt(quote.outAmount) / 10 ** toToken.decimals
          const rate = (out / parsedPay).toLocaleString(undefined, { maximumFractionDigits: 4 })
          return `1 ${fromToken.symbol} ≈ ${rate} ${toToken.symbol}`
        })()
      : null

  const impact = quote ? parsePriceImpact(quote.priceImpactPct) : null
  const minReceived = quote
    ? `${rawToDisplay(quote.otherAmountThreshold, toToken.decimals)} ${toToken.symbol}`
    : null

  const isReady = !!quote && !quoteLoading && parsedPay > 0
  const canSwap = isReady

  const ctaLabel = `Swap ${fromToken.symbol} → ${toToken.symbol}`

  const handleCtaPress = () => {
    if (!payAmount || parsedPay <= 0) {
      Alert.alert('Enter an amount', 'Type how much you want to swap first.')
      return
    }
    if (quoteLoading) return
    if (quoteError) {
      Alert.alert('No route', 'No swap route found for this pair. Try a different amount.')
      return
    }
    if (canSwap) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      // TODO: wallet connect + execute swap via Jupiter
    }
  }

  return {
    isDark,
    inputTextColor,
    placeholderColor,
    payAmount,
    slippage,
    quote,
    quoteLoading,
    quoteError,
    fromToken,
    toToken,
    flipRotate,
    flipOpacity,
    outputOpacity,
    parsedPay,
    receiveDisplay,
    payFontSize,
    receiveFontSize,
    rateStr,
    impact,
    minReceived,
    canSwap,
    ctaLabel,
    handleAmountChange,
    handleSlippage,
    handleFlip,
    handleCtaPress,
  }
}

export type UseSwapScreenResult = ReturnType<typeof useSwapScreen>
