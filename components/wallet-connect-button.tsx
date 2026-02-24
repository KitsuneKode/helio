import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  View,
  type LayoutRectangle,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import {
  Wallet01Icon,
  Copy01Icon,
  CheckmarkCircle01Icon,
  CancelCircleIcon,
} from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { useUserWallet } from '@/context/user-wallet-context'

type Props = {
  compact?: boolean
}

export function WalletConnectButton({ compact }: Props) {
  const { publicKey, connected, connecting, connect, disconnect } = useUserWallet()
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [btnLayout, setBtnLayout] = useState<LayoutRectangle | null>(null)
  const btnRef = useRef<View>(null)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    }
  }, [])

  const handleConnect = async () => {
    try {
      await connect()
    } catch {
      Alert.alert(
        'Connection Failed',
        'Could not connect to wallet. Make sure Phantom is installed.',
      )
    }
  }

  /** Light tap — copy address with haptic + brief visual feedback */
  const handleTap = async () => {
    if (!publicKey) return
    await Clipboard.setStringAsync(publicKey)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setCopied(true)
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    copyTimerRef.current = setTimeout(() => setCopied(false), 1500)
  }

  /** Long press — open popover menu */
  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    btnRef.current?.measureInWindow((x, y, width, height) => {
      setBtnLayout({ x, y, width, height })
      setMenuOpen(true)
    })
  }

  const handleCopyFromMenu = async () => {
    if (!publicKey) return
    await Clipboard.setStringAsync(publicKey)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setCopied(true)
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    copyTimerRef.current = setTimeout(() => setCopied(false), 1500)
    setMenuOpen(false)
  }

  const handleDisconnect = async () => {
    setMenuOpen(false)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    disconnect()
  }

  const popoverMenu = (
    <Modal
      visible={menuOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setMenuOpen(false)}
    >
      <Pressable className="flex-1" onPress={() => setMenuOpen(false)}>
        {btnLayout && (
          <View
            style={{
              position: 'absolute',
              top: btnLayout.y + btnLayout.height + 6,
              right: 12,
              minWidth: 180,
            }}
            className="bg-card border-border overflow-hidden rounded-xl border shadow-lg"
          >
            {/* Copy Address */}
            <Pressable
              onPress={handleCopyFromMenu}
              className="flex-row items-center gap-3 px-4 py-3 active:bg-accent"
            >
              <Icon
                icon={copied ? CheckmarkCircle01Icon : Copy01Icon}
                className={
                  copied ? 'text-primary size-[18px]' : 'text-muted-foreground size-[18px]'
                }
              />
              <Text
                className={
                  copied ? 'text-primary text-sm font-medium' : 'text-foreground text-sm'
                }
              >
                {copied ? 'Copied!' : 'Copy Address'}
              </Text>
            </Pressable>

            {/* Separator */}
            <View className="bg-border h-px" />

            {/* Disconnect */}
            <Pressable
              onPress={handleDisconnect}
              className="flex-row items-center gap-3 px-4 py-3 active:bg-accent"
            >
              <Icon icon={CancelCircleIcon} className="text-destructive size-[18px]" />
              <Text className="text-destructive text-sm">Disconnect</Text>
            </Pressable>
          </View>
        )}
      </Pressable>
    </Modal>
  )

  // --- Compact mode (header chip) ---
  if (compact) {
    if (connecting) {
      return (
        <Button variant="outline" size="sm" disabled>
          <ActivityIndicator size="small" />
        </Button>
      )
    }

    if (connected && publicKey) {
      const addr = publicKey
      const short = `${addr.slice(0, 4)}...${addr.slice(-4)}`
      return (
        <View ref={btnRef}>
          <Pressable
            onPress={handleTap}
            onLongPress={handleLongPress}
            className="bg-primary flex-row items-center gap-1.5 rounded-full px-3 py-1.5 active:opacity-85"
          >
            <Icon
              icon={copied ? CheckmarkCircle01Icon : Wallet01Icon}
              className="size-3.5 text-primary-foreground"
            />
            <Text className="text-primary-foreground text-xs font-semibold">{short}</Text>
          </Pressable>
          {popoverMenu}
        </View>
      )
    }

    return (
      <Pressable
        onPress={handleConnect}
        className="bg-muted flex-row items-center gap-1.5 rounded-full px-3 py-1.5 active:opacity-70"
      >
        <Icon icon={Wallet01Icon} className="text-muted-foreground size-3.5" />
        <Text className="text-muted-foreground text-xs font-medium">Connect</Text>
      </Pressable>
    )
  }

  // --- Full mode (settings page) ---
  if (connecting) {
    return (
      <Pressable
        disabled
        className="border-border bg-muted flex-row items-center justify-center gap-2.5 rounded-xl border px-5 py-4"
      >
        <ActivityIndicator size="small" />
        <Text className="text-muted-foreground text-lg font-semibold">Connecting...</Text>
      </Pressable>
    )
  }

  if (connected && publicKey) {
    const addr = publicKey
    const short = `${addr.slice(0, 4)}...${addr.slice(-4)}`
    return (
      <View ref={btnRef}>
        <Pressable
          onPress={handleTap}
          onLongPress={handleLongPress}
          className="bg-primary flex-row items-center justify-center gap-2.5 rounded-xl px-5 py-4 active:opacity-85"
        >
          <Icon
            icon={copied ? CheckmarkCircle01Icon : Wallet01Icon}
            className="size-5 text-primary-foreground"
          />
          <Text className="text-primary-foreground text-lg font-semibold">
            {copied ? 'Copied!' : short}
          </Text>
        </Pressable>
        {popoverMenu}
      </View>
    )
  }

  return (
    <Pressable
      onPress={handleConnect}
      className="border-border bg-card flex-row items-center justify-center gap-2.5 rounded-xl border px-5 py-4 active:opacity-85"
    >
      <Icon icon={Wallet01Icon} className="text-foreground size-5" />
      <Text className="text-foreground text-lg font-semibold">Connect Wallet</Text>
    </Pressable>
  )
}
