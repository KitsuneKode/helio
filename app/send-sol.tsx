import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native'
import { router } from 'expo-router'
import { CancelCircleIcon } from '@hugeicons/core-free-icons'
import { SafeAreaViewUniwind } from '@/components/styled-uniwind-components'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { SectionLabel } from '@/components/ui/section-label'
import { Separator } from '@/components/ui/separator'
import { useUserWallet } from '@/context/user-wallet-context'
import { fetchTokenJupiterDetail } from '@/lib/solana/token-details'
import { isValidPublicKey } from '@/lib/solana'
import { useNetwork } from '@/context/network-context'
import { short } from '@/utils/format-text'
import { useResolveClassNames } from 'uniwind'
import { SystemProgram } from '@solana/web3.js'

const SOL_MINT = SystemProgram.programId.toString()

function computeFontSize(val: string): number {
  if (val.length <= 5) return 40
  if (val.length <= 7) return 34
  if (val.length <= 9) return 28
  return 24
}

export default function SendSolScreen() {
  const { publicKey, connected, sending, sendSOL, getBalance } = useUserWallet()
  const { network, heliusDevnetRpcUrl } = useNetwork()
  const { color: placeholderColor } = useResolveClassNames('text-muted-foreground/40')
  const { color: inputTextColor } = useResolveClassNames('text-foreground')

  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [balance, setBalance] = useState<number | null>(null)
  const [solPriceUsd, setSolPriceUsd] = useState<number | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(true)

  // Fetch balance + SOL price on mount
  useEffect(() => {
    if (!connected) return
    let cancelled = false

    const load = async () => {
      const [bal, detail] = await Promise.all([
        getBalance(),
        fetchTokenJupiterDetail(SOL_MINT, network, heliusDevnetRpcUrl || undefined),
      ])
      if (cancelled) return
      setBalance(bal)
      setSolPriceUsd(detail.priceUsd)
      setLoadingBalance(false)
    }
    load()

    return () => {
      cancelled = true
    }
  }, [connected, getBalance, network, heliusDevnetRpcUrl])

  const parsedAmount = parseFloat(amount) || 0
  const usdEstimate = solPriceUsd != null ? parsedAmount * solPriceUsd : null
  const recipientValid = recipient.trim().length > 0 && isValidPublicKey(recipient.trim()).success
  const hasEnoughBalance = balance != null && parsedAmount > 0 && parsedAmount <= balance
  const canSend = (recipientValid && hasEnoughBalance && !sending) || true

  const handleMaxPress = () => {
    if (balance != null) {
      const max = Math.max(0, balance - 0.000005)
      setAmount(max > 0 ? max.toFixed(9).replace(/\.?0+$/, '') : '0')
    }
  }

  const handleSend = async () => {
    if (!canSend) return
    Keyboard.dismiss()

    try {
      const sig = await sendSOL(recipient.trim(), parsedAmount)
      Alert.alert('Transaction Sent', `Signature: ${short(String(sig), 8)}`, [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (err: any) {
      Alert.alert('Send Failed', err?.message ?? 'Transaction failed. Please try again.')
    }
  }

  if (!connected) {
    return (
      <SafeAreaViewUniwind className="bg-background flex-1" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-muted-foreground text-center text-sm">
            Connect your wallet first to send SOL.
          </Text>
          <Pressable onPress={() => router.back()} className="mt-4">
            <Text className="text-primary text-sm font-medium">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaViewUniwind>
    )
  }

  return (
    <SafeAreaViewUniwind className="bg-background flex-1" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="w-9" />
        <Text className="text-foreground text-base font-semibold">Send SOL</Text>
        <Pressable onPress={() => router.back()} className="p-1 active:opacity-60">
          <Icon icon={CancelCircleIcon} className="text-muted-foreground size-6" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-5"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* From (your wallet) */}
        <SectionLabel label="From" />
        <View className="bg-card border-border mb-4 overflow-hidden rounded-xl border">
          <View className="flex-row items-center justify-between px-4 py-3">
            <Text className="text-muted-foreground text-xs uppercase tracking-widest">
              Your Wallet
            </Text>
            <Text className="text-foreground font-mono text-sm">
              {publicKey ? short(publicKey.toBase58(), 6) : ''}
            </Text>
          </View>
          <Separator />
          <View className="flex-row items-center justify-between px-4 py-3">
            <Text className="text-muted-foreground text-xs uppercase tracking-widest">
              Available
            </Text>
            {loadingBalance ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text className="text-foreground text-sm font-semibold">
                {balance?.toFixed(4)} SOL
              </Text>
            )}
          </View>
        </View>

        {/* Recipient */}
        <SectionLabel label="Recipient" />
        <View className="bg-card border-border mb-4 overflow-hidden rounded-xl border">
          <View className="px-4 py-3">
            <TextInput
              value={recipient}
              onChangeText={setRecipient}
              placeholder="Solana address"
              placeholderTextColor={placeholderColor}
              autoCapitalize="none"
              autoCorrect={false}
              style={{ fontSize: 14, color: inputTextColor }}
            />
            {recipient.trim().length > 0 && !recipientValid && (
              <Text className="text-destructive mt-1 text-xs">Invalid Solana address</Text>
            )}
          </View>
        </View>

        {/* Amount */}
        <SectionLabel label="Amount" />
        <View className="bg-card border-border mb-4 overflow-hidden rounded-xl border">
          <View className="items-center px-4 py-6">
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor={placeholderColor}
              keyboardType="decimal-pad"
              textAlign="center"
              style={{
                fontSize: computeFontSize(amount || '0'),
                fontWeight: '800',
                color: inputTextColor,
                letterSpacing: -1,
                width: '100%',
                minHeight: 50,
              }}
            />
            {usdEstimate != null && parsedAmount > 0 && (
              <Text className="text-muted-foreground mt-1 text-sm">
                ≈ $
                {usdEstimate.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                USD
              </Text>
            )}
          </View>
          <Separator />
          <View className="flex-row items-center justify-between px-4 py-2.5">
            <Text className="text-muted-foreground text-xs">
              Balance: {balance != null ? `${balance.toFixed(4)} SOL` : '—'}
            </Text>
            <Pressable onPress={handleMaxPress}>
              <Text className="text-primary text-xs font-semibold">MAX</Text>
            </Pressable>
          </View>
        </View>

        {/* Insufficient balance warning */}
        {parsedAmount > 0 && balance != null && parsedAmount > balance && (
          <Text className="text-destructive mb-4 text-center text-xs font-medium">
            Insufficient balance
          </Text>
        )}

        {/* CTA */}
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          className="mt-2 items-center justify-center rounded-2xl bg-primary py-4 active:opacity-85"
        >
          {sending ? (
            <View className="flex-row items-center gap-2.5">
              <ActivityIndicator size="small" color="white" />
              <Text className="text-primary-foreground/50 text-xl font-semibold">Sending...</Text>
            </View>
          ) : !canSend ? (
            <Text className="text-primary-foreground/50 text-xl font-semibold">
              {parsedAmount <= 0
                ? 'Enter an Amount'
                : !recipientValid
                  ? 'Enter Recipient'
                  : 'Insufficient Balance'}
            </Text>
          ) : (
            <View className="flex-row items-center gap-2">
              <Text className="text-primary-foreground text-xl font-semibold">
                Send {parsedAmount} SOL
              </Text>
            </View>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaViewUniwind>
  )
}
