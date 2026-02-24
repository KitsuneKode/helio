import '@/polyfill'
import 'react-native-url-polyfill/auto' // Add this before the 'App' import!
import '@/global.css'

import { NAV_THEME } from '@/lib/theme'
import { NetworkProvider, useNetwork } from '@/context/network-context'
import { UserWalletProvider } from '@/context/user-wallet-context'
import { ThemeProvider } from '@react-navigation/native'
import { PortalHost } from '@rn-primitives/portal'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useUniwind } from 'uniwind'

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router'

const APP_IDENTITY = {
  name: 'Helio',
  uri: 'https://helio.kitsnelabs.xyz',
  icon: '@/assets/images/favicon.png',
}

export default function RootLayout() {
  const { theme } = useUniwind()
  return (
    <NetworkProvider>
      <UserWalletProvider>
        <ThemeProvider value={NAV_THEME[theme ?? 'light']}>
          <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="transaction/[signature]"
              options={{
                title: 'Transaction Details',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="token/[mint]"
              options={{
                title: 'Token Details',
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="watchlist"
              options={{
                title: 'Watchlist',
                headerShown: false,
              }}
            />

            <Stack.Screen name="history" options={{ headerShown: false }} />
            <Stack.Screen name="swap-history" options={{ headerShown: false }} />
            <Stack.Screen
              name="send-sol"
              options={{
                headerShown: false,
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
          </Stack>
          <PortalHost />
        </ThemeProvider>
      </UserWalletProvider>
    </NetworkProvider>
  )
}
