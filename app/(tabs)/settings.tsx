import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { router } from 'expo-router'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { SafeAreaViewUniwind } from '@/components/styled-uniwind-components'
import { Text } from '@/components/ui/text'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { SectionLabel } from '@/components/ui/section-label'
import { ThemeToggle } from '@/components/theme-toggle-button'
import { NetworkToggle } from '@/components/network-toggle'
import { useNetwork } from '@/context/network-context'
import { SettingsRow } from '@/components/settings-screen/settings-row'
import { WalletConnectButton } from '@/components/wallet-connect-button'
import { Uniwind, useResolveClassNames, useUniwind } from 'uniwind'

export default function SettingsScreen() {
  const { customRpcUrl, setCustomRpcUrl } = useNetwork()
  const [rpcInput, setRpcInput] = useState(customRpcUrl)

  const handleRpcBlur = () => {
    setCustomRpcUrl(rpcInput)
  }

  const { theme } = useUniwind()

  function toggleTheme() {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    Uniwind.setTheme(newTheme)
  }

  const { color } = useResolveClassNames('text-muted-foreground/40')

  return (
    <SafeAreaViewUniwind className="bg-background flex-1" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3 mb-2">
        <View>
          <Text className="text-foreground text-2xl font-bold">Settings</Text>
          <Text className="text-muted-foreground text-xs">Customize your experience</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerClassName="pb-12">
        {/* Network */}
        <SectionLabel className="ml-4" label="Network" />
        <Card className="overflow-hidden p-0 mb-4">
          <SettingsRow label="Network" right={<NetworkToggle />} />
          <Separator />
          <View className="px-4 pb-3">
            <Text className="text-foreground mb-2 text-xl">Custom RPC</Text>
            <Input
              value={rpcInput}
              onChangeText={setRpcInput}
              onBlur={handleRpcBlur}
              placeholderTextColor={color}
              onSubmitEditing={handleRpcBlur}
              placeholder="https://..."
              autoCapitalize="none"
              className="px-4 border-input ring-primary h-12 ring-1"
              autoCorrect={false}
              returnKeyType="done"
            />
            <Text className="text-muted-foreground mt-1.5 text-xs">Leave empty to use default</Text>
          </View>
        </Card>

        {/* Appearance */}
        <SectionLabel className="ml-4" label="Appearance" />
        <Card className="overflow-hidden p-0 mb-4">
          <SettingsRow label="Theme" onPress={toggleTheme} right={<ThemeToggle />} />
        </Card>

        {/* Quick Links */}
        <SectionLabel className="ml-4" label="Quick Links" />
        <Card className="overflow-hidden justify-center  p-0 mb-4 py-2 gap-0">
          <SettingsRow
            label="History"
            onPress={() => router.push('/history')}
            right={<Icon icon={ArrowRight01Icon} className="text-muted-foreground size-5" />}
          />
          <Separator />
          <SettingsRow
            label="Watchlist"
            onPress={() => router.push('/watchlist')}
            right={<Icon icon={ArrowRight01Icon} className="text-muted-foreground size-5" />}
          />
        </Card>

        {/* Wallet */}
        <SectionLabel label="Wallet" className="ml-4" />
        <View>
          <WalletConnectButton />
        </View>

        {/* Footer */}
        <View className="mt-8 items-center">
          <Text className="text-muted-foreground text-xs">SolScan v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaViewUniwind>
  )
}
