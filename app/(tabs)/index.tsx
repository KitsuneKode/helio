import { Header } from '@/components/wallet-screen/header'
import { WalletResults } from '@/components/wallet-screen/wallet-results'
import { WalletSearchForm } from '@/components/wallet-screen/wallet-search-form'
import { useWalletScreen } from '@/hooks/use-wallet-screen'
import { BackToTopButton } from '@/components/wallet-screen/back-to-top-button'
import { SafeAreaViewUniwind } from '@/components/styled-uniwind-components'
import { useRef } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useSharedValue } from 'react-native-reanimated'

const WalletScreen = () => {
  const scrollRef = useRef<ScrollView>(null)
  const scrollY = useSharedValue(0)
  const wallet = useWalletScreen()

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

      {/* Floating back-to-top button */}
      <BackToTopButton scrollY={scrollY} scrollRef={scrollRef} />
    </SafeAreaViewUniwind>
  )
}

export default WalletScreen
