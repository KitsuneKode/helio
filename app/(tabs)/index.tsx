import { Header } from '@/components/wallet-screen/header'
import { WalletResults } from '@/components/wallet-screen/wallet-results'
import { WalletSearchForm } from '@/components/wallet-screen/wallet-search-form'
import { useLocalSearchParams, router } from 'expo-router'
import { useWalletScreen } from '@/hooks/use-wallet-screen'
import { useUserWallet } from '@/context/user-wallet-context'
import { BackToTopButton } from '@/components/back-to-top-button'
import { SafeAreaViewUniwind } from '@/components/styled-uniwind-components'
import { useRef } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native'
import { Text } from '@/components/ui/text'
import { useSharedValue } from 'react-native-reanimated'

const WalletScreen = () => {
  const { walletAddress } = useLocalSearchParams<{ walletAddress?: string }>()
  const { publicKey, connected } = useUserWallet()
  const scrollRef = useRef<ScrollView>(null)
  const scrollY = useSharedValue(0)

  // Prefer explicit nav param, then connected wallet
  const initialAddress =
    walletAddress ?? (connected && publicKey ? publicKey.toBase58() : undefined)
  const wallet = useWalletScreen(initialAddress)

  return (
    <SafeAreaViewUniwind className="bg-background flex-1" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          className="flex-1 px-5"
          scrollEventThrottle={16}
          onScroll={(e) => {
            scrollY.value = e.nativeEvent.contentOffset.y
          }}
        >
          <Header />
          <WalletSearchForm
            value={wallet.value}
            loading={wallet.loading}
            onChangeValue={wallet.handleChangeValue}
            onSearch={wallet.handleSearch}
            onClear={wallet.handleClear}
          />
          <WalletResults {...wallet} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Send SOL button when wallet connected */}
      {connected && (
        <View className="absolute bottom-24 right-5">
          <Pressable
            onPress={() => router.push('/send-sol')}
            className="bg-primary flex-row items-center gap-2 rounded-full px-5 py-3 shadow-lg active:opacity-85"
          >
            <Text className="text-primary-foreground text-sm font-semibold">Send</Text>
          </Pressable>
        </View>
      )}

      {/* Floating back-to-top button */}
      <BackToTopButton scrollY={scrollY} scrollRef={scrollRef} />
    </SafeAreaViewUniwind>
  )
}

export default WalletScreen
