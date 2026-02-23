import { Icon } from '@/components/ui/icon'
import { useSwapResetStore } from '@/store/swap-reset-store'
import { useWalletResetStore } from '@/store/wallet-reset-store'
import { THEME } from '@/lib/theme'
import { Exchange03Icon, Home12Icon, Settings01Icon } from '@hugeicons/core-free-icons'
import { Tabs } from 'expo-router'
import { useEffect } from 'react'
import * as QuickActions from 'expo-quick-actions'
import { Platform } from 'react-native'

export default function Layout() {
  const triggerReset = useWalletResetStore((s) => s.triggerReset)
  const triggerSwapReset = useSwapResetStore((s) => s.triggerReset)

  useEffect(() => {
    QuickActions.setItems([
      {
        title: 'Watchlist',
        icon: Platform.OS === 'ios' ? 'symbol:star.bubble.fill' : 'velocity',
        id: '0',
        params: { href: '/watchlist' },
      },
      {
        title: 'Swap',
        icon: Platform.OS === 'ios' ? 'symbol:arrow.triangle.2.circlepath' : 'velocity',
        id: '1',
        params: { href: '/swap' },
      },
      {
        title: 'Settings',
        icon: Platform.OS === 'ios' ? 'symbol:gearshape.fill' : 'velocity',
        id: '2',
        params: { href: '/settings' },
      },
    ])
  }, [])

  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarActiveTintColor: `${THEME.dark.primary}`,
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Icon icon={Home12Icon} size={size} color={color} />,
          tabBarLabelStyle: { fontSize: 12 },
        }}
        listeners={({ navigation, route }) => ({
          tabPress: () => {
            const isFocused = navigation.isFocused()
            if (isFocused) {
              triggerReset()
            }
          },
        })}
      />
      <Tabs.Screen
        name="swap"
        options={{
          title: 'Swap',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Icon icon={Exchange03Icon} size={size} color={color} />,
          tabBarLabelStyle: { fontSize: 12 },
        }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            if (navigation.isFocused()) {
              triggerSwapReset()
            }
          },
        })}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Icon icon={Settings01Icon} size={size} color={color} />,
          tabBarLabelStyle: { fontSize: 12 },
        }}
      />
    </Tabs>
  )
}
