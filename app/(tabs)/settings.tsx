import { useState, useCallback } from 'react'
import { Alert, Pressable, ScrollView, View } from 'react-native'
import { router } from 'expo-router'
import { ArrowRight01Icon, CheckmarkSquare01Icon, SquareIcon } from '@hugeicons/core-free-icons'
import { SafeAreaViewUniwind } from '@/components/styled-uniwind-components'
import { Text } from '@/components/ui/text'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { SectionLabel } from '@/components/ui/section-label'
import { ThemeToggle } from '@/components/theme-toggle-button'
import { NetworkToggle, DEVNET_WARNING_DISMISSED_KEY } from '@/components/network-toggle'
import { useNetwork } from '@/context/network-context'
import { SettingsRow } from '@/components/settings-screen/settings-row'
import { WalletConnectButton } from '@/components/wallet-connect-button'
import { RPC_URL_REGEX } from '@/config'
import { Uniwind, useResolveClassNames, useUniwind } from 'uniwind'
import { storage } from '@/lib/storage'

function validateAndSave(url: string, save: (url: string) => void, label: string) {
  const trimmed = url.trim()
  if (!trimmed) {
    save('')
    return
  }
  if (!RPC_URL_REGEX.test(trimmed)) {
    Alert.alert('Invalid URL', `${label} must be a valid HTTPS URL.`)
    return
  }
  save(trimmed)
}

export default function SettingsScreen() {
  const {
    customMainnetRpc,
    customDevnetRpc,
    heliusDevnetRpcUrl,
    setCustomMainnetRpc,
    setCustomDevnetRpc,
    setHeliusDevnetRpcUrl,
  } = useNetwork()

  const [devnetWarning, setDevnetWarning] = useState(
    () => storage.getItem(DEVNET_WARNING_DISMISSED_KEY) !== 'true',
  )

  const toggleDevnetWarning = useCallback((value: boolean) => {
    setDevnetWarning(value)
    if (value) {
      storage.removeItem(DEVNET_WARNING_DISMISSED_KEY)
    } else {
      storage.setItem(DEVNET_WARNING_DISMISSED_KEY, 'true')
    }
  }, [])

  const [mainnetInput, setMainnetInput] = useState(customMainnetRpc)
  const [devnetInput, setDevnetInput] = useState(customDevnetRpc)
  const [heliusInput, setHeliusInput] = useState(heliusDevnetRpcUrl)

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
          <Pressable
            onPress={() => toggleDevnetWarning(!devnetWarning)}
            className="flex-row items-center gap-3 px-4 py-3 active:opacity-60"
          >
            <Icon
              icon={devnetWarning ? CheckmarkSquare01Icon : SquareIcon}
              className={`size-5 ${devnetWarning ? 'text-primary' : 'text-muted-foreground'}`}
            />
            <Text className="text-foreground text-sm">Warn when switching to devnet</Text>
          </Pressable>
        </Card>

        {/* RPC URLs */}
        <SectionLabel className="ml-4" label="Custom RPC" />
        <Card className="overflow-hidden p-0 mb-4 gap-1">
          <View className="px-4 py-2">
            <Text className="text-foreground text-sm font-medium mb-1">Mainnet RPC</Text>
            <Input
              value={mainnetInput}
              onChangeText={setMainnetInput}
              onBlur={() => validateAndSave(mainnetInput, setCustomMainnetRpc, 'Mainnet RPC')}
              onSubmitEditing={() =>
                validateAndSave(mainnetInput, setCustomMainnetRpc, 'Mainnet RPC')
              }
              placeholderTextColor={color}
              placeholder="Leave empty for default"
              autoCapitalize="none"
              className="px-4 border-input ring-primary h-12 ring-1"
              autoCorrect={false}
              returnKeyType="done"
            />
          </View>
          <Separator />
          <View className="px-4 py-2">
            <Text className="text-foreground text-sm font-medium mb-1">Devnet RPC</Text>
            <Input
              value={devnetInput}
              onChangeText={setDevnetInput}
              onBlur={() => validateAndSave(devnetInput, setCustomDevnetRpc, 'Devnet RPC')}
              onSubmitEditing={() => validateAndSave(devnetInput, setCustomDevnetRpc, 'Devnet RPC')}
              placeholderTextColor={color}
              placeholder="Leave empty for default"
              autoCapitalize="none"
              className="px-4 border-input ring-primary h-12 ring-1"
              autoCorrect={false}
              returnKeyType="done"
            />
          </View>
          <Separator />
          <View className="px-4 py-2">
            <Text className="text-foreground text-sm font-medium mb-1">
              Helius Devnet RPC (optional)
            </Text>
            <Input
              value={heliusInput}
              onChangeText={setHeliusInput}
              onBlur={() =>
                validateAndSave(heliusInput, setHeliusDevnetRpcUrl, 'Helius Devnet RPC')
              }
              onSubmitEditing={() =>
                validateAndSave(heliusInput, setHeliusDevnetRpcUrl, 'Helius Devnet RPC')
              }
              placeholderTextColor={color}
              placeholder="https://devnet.helius-rpc.com/?api-key=..."
              autoCapitalize="none"
              className="px-4 border-input ring-primary h-12 ring-1"
              autoCorrect={false}
              returnKeyType="done"
            />
            <Text className="text-muted-foreground mt-1.5 text-xs">
              Required for devnet token metadata. Leave empty to skip.
            </Text>
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
          <Separator />
          <SettingsRow
            label="Swap History"
            onPress={() => router.push('/swap-history')}
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
          <Text className="text-muted-foreground text-xs">Helio v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaViewUniwind>
  )
}
