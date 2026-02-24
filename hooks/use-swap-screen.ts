import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert } from 'react-native'
import * as Haptics from 'expo-haptics'
import { Easing, runOnJS, useSharedValue, withTiming } from 'react-native-reanimated'
import { useUniwind } from 'uniwind'
import { fetchSwapQuote, getSwapTransaction } from '@/lib/solana/swap'
import {
  getAmountFontSize,
  parsePriceImpact,
  rawToDisplay,
} from '@/components/swap-screen/swap-formatters'
import type { SlippageOpt, Token } from '@/types'
import { SOL, USDC } from '@/constants/swap'

import { SwapQuote } from '@/types'
import { useUserWallet } from '@/context/user-wallet-context'
import { useNetwork } from '@/context/network-context'
import { useSwapResetStore } from '@/store/swap-reset-store'
import { useSwapHistoryStore } from '@/store/swap-history-store'

export function useSwapScreen() {
  const { theme } = useUniwind()
  const { connected, connecting, connect, getBalance, publicKey, signAndSendTransaction } =
    useUserWallet()
  const { network } = useNetwork()
  const isDevnet = network === 'devnet'
  const isDark = (theme ?? 'light') === 'dark'
  const inputTextColor = isDark ? '#F4F4F5' : '#18181B'
  const placeholderColor = '#71717A'

  const addSwapEntry = useSwapHistoryStore((s) => s.addSwapEntry)
  const resetCount = useSwapResetStore((s) => s.resetCount)
  const [solBalance, setSolBalance] = useState<number | null>(null)

  const [payAmount, setPayAmount] = useState('')
  const [slippage, setSlippage] = useState<SlippageOpt>('0.5')
  const [fromToken, setFromToken] = useState<Token>(SOL)
  const [toToken, setToToken] = useState<Token>(USDC)
  const [quote, setQuote] = useState<SwapQuote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [swapStatus, setSwapStatus] = useState<
    'idle' | 'building' | 'signing' | 'success' | 'failed'
  >('idle')

  const flipRotate = useSharedValue(0)
  const flipOpacity = useSharedValue(1)
  const outputOpacity = useSharedValue(1)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const quoteRequestId = useRef(0)

  const triggerQuote = useCallback(
    async (amount: string, from: Token, to: Token, slip: string) => {
      if (isDevnet) return

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

      const rawAmount = Math.round(parsed * 10 ** from.decimals)
      const slippageBps = Math.round(parseFloat(slip) * 100)

      const requestId = ++quoteRequestId.current
      const nextQuote = await fetchSwapQuote({
        inputMint: from.mint,
        outputMint: to.mint,
        amount: rawAmount,
        slippageBps,
      })
      if (requestId !== quoteRequestId.current) return

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
    },
    [outputOpacity, isDevnet],
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

    const newFrom = toToken
    const newTo = fromToken
    const currentPayAmount = payAmount
    const currentSlippage = slippage

    flipRotate.value = withTiming(flipRotate.value + 180, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    })

    const applyFlip = () => {
      setFromToken(newFrom)
      setToToken(newTo)
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

  const handleSelectFrom = (token: Token) => {
    if (token.mint === toToken.mint) {
      setFromToken(toToken)
      setToToken(fromToken)
    } else {
      setFromToken(token)
    }
    setQuote(null)
    setQuoteError(null)
    if (payAmount && parseFloat(payAmount) > 0) {
      const newFrom = token.mint === toToken.mint ? toToken : token
      const newTo = token.mint === toToken.mint ? fromToken : toToken
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => triggerQuote(payAmount, newFrom, newTo, slippage), 300)
    }
  }

  const handleSelectTo = (token: Token) => {
    if (token.mint === fromToken.mint) {
      setToToken(fromToken)
      setFromToken(toToken)
    } else {
      setToToken(token)
    }
    setQuote(null)
    setQuoteError(null)
    if (payAmount && parseFloat(payAmount) > 0) {
      const newFrom = token.mint === fromToken.mint ? toToken : fromToken
      const newTo = token.mint === fromToken.mint ? fromToken : token
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => triggerQuote(payAmount, newFrom, newTo, slippage), 300)
    }
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (swapTimerRef.current) clearTimeout(swapTimerRef.current)
    }
  }, [])

  // Reset swap state when tab is re-pressed
  const initialResetCount = useRef(resetCount)
  useEffect(() => {
    if (resetCount !== initialResetCount.current) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      setPayAmount('')
      setSlippage('0.5')
      setFromToken(SOL)
      setToToken(USDC)
      setQuote(null)
      setQuoteLoading(false)
      setQuoteError(null)
      setSwapStatus('idle')
      if (swapTimerRef.current) clearTimeout(swapTimerRef.current)
      flipRotate.value = 0
      flipOpacity.value = 1
      outputOpacity.value = 1
    }
  }, [resetCount, flipRotate, flipOpacity, outputOpacity])

  useEffect(() => {
    if (!connected) {
      setSolBalance(null)
      return
    }
    let cancelled = false
    const fetchBalance = async () => {
      const bal = await getBalance()
      if (!cancelled) setSolBalance(bal)
    }
    fetchBalance()
    return () => {
      cancelled = true
    }
  }, [connected, getBalance])

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

  const insufficientBalance =
    connected &&
    fromToken.mint === SOL.mint &&
    solBalance != null &&
    parsedPay > 0 &&
    parsedPay > solBalance

  const hasQuote = !!quote && !quoteLoading && parsedPay > 0
  const canSwap = hasQuote && connected && !insufficientBalance && !!publicKey

  const ctaLabel = `Swap ${fromToken.symbol} → ${toToken.symbol}`

  const swapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetSwapStatus = (delay: number) => {
    if (swapTimerRef.current) clearTimeout(swapTimerRef.current)
    swapTimerRef.current = setTimeout(() => setSwapStatus('idle'), delay)
  }

  const recordSwap = (status: 'success' | 'failed', sig: string | null) => {
    addSwapEntry(
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        fromToken,
        toToken,
        fromAmount: payAmount,
        toAmount: status === 'success' ? receiveDisplay : '',
        timestamp: Date.now(),
        status,
        signature: sig,
      },
      network,
    )
  }

  const handleCtaPress = async () => {
    if (!canSwap || !publicKey || swapStatus !== 'idle') return

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      setSwapStatus('building')

      const swapResponse = await getSwapTransaction({
        userPublicKey: publicKey,
        quoteResponse: quote,
      })

      if (!swapResponse) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        setSwapStatus('failed')
        recordSwap('failed', null)
        resetSwapStatus(2000)
        Alert.alert('Swap Failed', 'Unable to create swap transaction. Please try again.')
        return
      }

      setSwapStatus('signing')
      const signature = await signAndSendTransaction(swapResponse.transaction)

      if (signature) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        setSwapStatus('success')
        recordSwap('success', signature)

        const successFrom = fromToken.symbol
        const successTo = toToken.symbol
        const successPay = parsedPay
        const successReceive = receiveDisplay

        if (swapTimerRef.current) clearTimeout(swapTimerRef.current)
        swapTimerRef.current = setTimeout(() => {
          setSwapStatus('idle')
          setPayAmount('')
          setQuote(null)
          setQuoteError(null)
        }, 2500)

        Alert.alert(
          'Swap Successful!',
          `Swapped ${successPay} ${successFrom} → ${successReceive} ${successTo}`,
        )
        return
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      setSwapStatus('failed')
      recordSwap('failed', null)
      resetSwapStatus(2000)
      Alert.alert(
        'Swap Failed',
        'Your transaction was created but failed to send. Please try again.',
      )
    } catch (error: any) {
      const msg = error?.message ?? ''
      if (msg.includes('declined') || msg.includes('rejected') || msg.includes('cancelled')) {
        setSwapStatus('idle')
        return
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      setSwapStatus('failed')
      recordSwap('failed', null)
      resetSwapStatus(2000)
      Alert.alert('Swap Failed', 'Something went wrong. Please try again.')
    }
  }

  return {
    isDark,
    isDevnet,
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
    hasQuote,
    canSwap,
    insufficientBalance,
    swapStatus,
    ctaLabel,
    connected,
    connecting,
    connect,
    handleAmountChange,
    handleSlippage,
    handleFlip,
    handleSelectFrom,
    handleSelectTo,
    handleCtaPress,
  }
}

export type UseSwapScreenResult = ReturnType<typeof useSwapScreen>
