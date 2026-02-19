import { SafeAreaViewUniwind } from '@/components/styled-uniwind-components'
import { ThemeToggle } from '@/components/theme-toggle-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LabelUniwind } from '@/components/ui/label'
import { Text } from '@/components/ui/text'
import { HeaderText } from '@/components/wallet-screen/header'
import { TransactionHeader } from '@/components/wallet-screen/transaction-header'
import { BalanceCard } from '@/components/wallet-screen/balance-card'
import type { GetTokensResult, GetTransactionsResult } from '@/lib/solana'
import { getAllTokens, getAllTransactions, getBalance, isValidPublicKey } from '@/lib/solana'
import { useState, useTransition } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native'

const TransactionScreen = () => {
  const [value, setValue] = useState<string>('')
  const [balance, setBalance] = useState<number | null>(null)
  const [tokens, setTokens] = useState<GetTokensResult>([])
  const [transactions, setTransactions] = useState<GetTransactionsResult>([])
  const [loading, startTransition] = useTransition()

  const handleChangeValue = (text: string) => {
    setValue(text)
  }
  const handleClear = () => {
    setValue('')
  }

  const handleSearch = async () => {
    const address = value.trim()

    if (!address) {
      setValue(address)
      return Alert.alert('Validation Error', 'Please enter a public key')
    }

    const { success, address: publicKey } = isValidPublicKey(address)

    if (!success) {
      return Alert.alert('Validation Error', 'Please enter a valid public key')
    }
    startTransition(async () => {
      try {
        const [bal, tokn, txns] = await Promise.all([
          getBalance(publicKey),
          getAllTokens(publicKey),
          getAllTransactions(publicKey),
        ])

        setBalance(bal)
        setTokens(tokn)
        setTransactions(txns)
      } catch (err) {
        console.error('Error fetching data for address:', (err as Error).message)
        return Alert.alert('Something went Wrong', 'Failed to fetch data. Please try again later.')
      }
    })
  }

  return (
    <SafeAreaViewUniwind className="bg-background flex-1" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView keyboardShouldPersistTaps="handled" className="flex-1 px-5">
          <View className="mt-4 flex-1 flex-row justify-between pb-6">
            <HeaderText />
            <ThemeToggle />
          </View>
          <View className="flex-1 gap-4">
            <View className="flex-1 gap-2">
              <LabelUniwind
                className="text-muted-foreground/75 mx-2 text-[1.25rem]"
                htmlFor="input"
                nativeID="input">
                Enter a wallet address
              </LabelUniwind>
              <Input
                id="input"
                className="border-input ring-muted h-14 ring-1"
                placeholder="83astBRguLMdt2h...."
                value={value}
                onChangeText={handleChangeValue}
                returnKeyType="done"
                enablesReturnKeyAutomatically
                onSubmitEditing={handleSearch}
              />
            </View>
            <View className="flex-row gap-4">
              <Button className="h-12 flex-1" onPress={handleSearch} disabled={loading}>
                {loading ? (
                  <ActivityIndicator />
                ) : (
                  <Text className="text-background text-xl">Search</Text>
                )}
              </Button>

              <Button
                className="border-input ring-muted h-12 px-10 ring-1"
                variant="outline"
                disabled={loading}
                onPress={handleClear}>
                <Text className="text-xl">Clear</Text>
              </Button>
            </View>
          </View>

          {balance !== null && <BalanceCard balance={balance} address={value.trim()} />}
          <FlatList
            ListHeaderComponent={<TransactionHeader />}
            scrollEnabled={false}
            keyExtractor={(item) => item.signature}
            data={transactions}
            renderItem={({ item }) => (
              <View className="flex-1">
                <Text className="text-foreground">{item.signature}</Text>
              </View>
            )}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaViewUniwind>
  )
}

export default TransactionScreen
