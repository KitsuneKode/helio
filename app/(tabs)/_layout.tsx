import { Tabs } from 'expo-router'

export default function Layout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="swap-antigravity"
        options={{
          title: 'Swap Antigravity',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="swap"
        options={{
          title: 'Swap',
          headerShown: false,
        }}
      />
    </Tabs>
  )
}
