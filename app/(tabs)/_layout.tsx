import { Icon } from '@/components/ui/icon'
import { THEME } from '@/lib/theme'
import { Exchange03Icon, Home12Icon } from '@hugeicons/core-free-icons'
import { Tabs } from 'expo-router'

export default function Layout() {
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
      />
      <Tabs.Screen
        name="swap"
        options={{
          title: 'Swap',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Icon icon={Exchange03Icon} size={size} color={color} />,
          tabBarLabelStyle: { fontSize: 12 },
        }}
      />
    </Tabs>
  )
}
