import { ActivityIndicator, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LabelUniwind } from '@/components/ui/label'
import { Text } from '@/components/ui/text'

type WalletSearchFormProps = {
  value: string
  loading: boolean
  onChangeValue: (text: string) => void
  onSearch: () => Promise<void> | void
  onClear: () => void
}

export function WalletSearchForm({
  value,
  loading,
  onChangeValue,
  onSearch,
  onClear,
}: WalletSearchFormProps) {
  return (
    <View className="flex-1 gap-4">
      <View className="flex-1 gap-2">
        <LabelUniwind
          className="text-muted-foreground mx-2 text-[1.25rem]"
          htmlFor="input"
          nativeID="input"
        >
          Enter a wallet address
        </LabelUniwind>
        <Input
          id="input"
          className="border-input ring-muted h-14 ring-1"
          placeholder=" 83astBRguLMdt2h...."
          placeholderTextColor="#B4B4BC"
          value={value}
          onChangeText={onChangeValue}
          returnKeyType="done"
          enablesReturnKeyAutomatically
          onSubmitEditing={onSearch}
        />
      </View>
      <View className="flex-row gap-4">
        <Button className="h-12 flex-1" onPress={onSearch} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-background text-xl">Search</Text>
          )}
        </Button>
        <Button
          className="border-input ring-muted h-12 px-10 ring-1"
          variant="outline"
          disabled={loading}
          onPress={onClear}
        >
          <Text className="text-xl">Clear</Text>
        </Button>
      </View>
    </View>
  )
}
