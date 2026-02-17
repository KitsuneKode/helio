import { ThemeToggle } from '@/components/theme-toggle-button'
import { Tabs } from 'expo-router'

export default function Layout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: ' Transaction',
          headerTransparent: true,
          headerRight: () => <ThemeToggle />,
        }}
      />
      <Tabs.Screen
        name="swap"
        options={{
          title: 'Swap',
          headerTransparent: true,
          headerRight: () => <ThemeToggle />,
        }}
      />
    </Tabs>
  )
}
