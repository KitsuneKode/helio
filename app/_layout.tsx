import 'react-native-url-polyfill/auto' // Add this before the 'App' import!
import '@/global.css'

import { NAV_THEME } from '@/lib/theme'
import { NetworkProvider } from '@/context/network-context'
import { ThemeProvider } from '@react-navigation/native'
import { PortalHost } from '@rn-primitives/portal'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useUniwind } from 'uniwind'

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router'

export default function RootLayout() {
  const { theme } = useUniwind()

  return (
    <NetworkProvider>
      <ThemeProvider value={NAV_THEME[theme ?? 'light']}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="default" options={{ headerShown: false }} />
          <Stack.Screen
            name="transaction-antigravity/[signature]"
            options={{ headerShown: false }}
          />
        </Stack>
        <PortalHost />
      </ThemeProvider>
    </NetworkProvider>
  )
}
