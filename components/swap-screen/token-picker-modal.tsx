import { useState } from 'react'
import { FlatList, Image, Modal, Pressable, View } from 'react-native'
import { CancelCircleIcon, CheckmarkCircle01Icon } from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { SWAP_TOKENS, type Token } from '@/types/swap-screen'

type TokenPickerModalProps = {
  visible: boolean
  onClose: () => void
  onSelect: (token: Token) => void
  selectedMint: string
  otherMint: string
}

function TokenLogo({ uri, size = 32 }: { uri: string; size?: number }) {
  const [err, setErr] = useState(false)
  return err ? (
    <View className="bg-primary/15 rounded-full" style={{ width: size, height: size }} />
  ) : (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      onError={() => setErr(true)}
    />
  )
}

function TokenRow({
  token,
  isSelected,
  isOther,
  onPress,
}: {
  token: Token
  isSelected: boolean
  isOther: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center px-5 py-3.5 ${isSelected ? 'bg-primary/10' : ''}`}
      style={isOther && !isSelected ? { opacity: 0.4 } : undefined}
    >
      <TokenLogo uri={token.logo} />
      <View className="ml-3 flex-1">
        <Text className="text-foreground text-sm font-bold">{token.symbol}</Text>
        <Text className="text-muted-foreground text-xs">{token.name}</Text>
      </View>
      {isSelected && (
        <Icon icon={CheckmarkCircle01Icon} className="text-primary size-5" />
      )}
    </Pressable>
  )
}

export function TokenPickerModal({
  visible,
  onClose,
  onSelect,
  selectedMint,
  otherMint,
}: TokenPickerModalProps) {
  const handleSelect = (token: Token) => {
    onSelect(token)
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50" onPress={onClose}>
        <View className="flex-1" />
        <Pressable onPress={undefined} className="bg-card rounded-t-3xl pb-8 pt-2">
          <View className="flex-row items-center justify-between px-5 pb-3 pt-4">
            <Text className="text-foreground text-lg font-bold">Select a token</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Icon icon={CancelCircleIcon} className="text-muted-foreground size-6" />
            </Pressable>
          </View>

          <FlatList
            data={SWAP_TOKENS}
            keyExtractor={(item) => item.mint}
            style={{ maxHeight: 420 }}
            renderItem={({ item }) => (
              <TokenRow
                token={item}
                isSelected={item.mint === selectedMint}
                isOther={item.mint === otherMint}
                onPress={() => handleSelect(item)}
              />
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  )
}
