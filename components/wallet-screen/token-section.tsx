import { ActivityIndicator, FlatList, Pressable, View } from 'react-native'
import { Text } from '@/components/ui/text'
import { EmptyTokens } from '@/components/wallet-screen/empty-tokens'
import { TokenListItem } from '@/components/wallet-screen/token-list-item'
import type { GetTokensResult, TokenBalance } from '@/lib/solana'

type TokenSectionProps = {
  allTokens: TokenBalance[]
  visibleTokens: GetTokensResult
  hasMoreTokens: boolean
  canShowLess: boolean
  loadingMoreTokens: boolean
  onShowLess: () => void
  onLoadMore: () => Promise<void> | void
  onPressToken: (token: GetTokensResult[number]) => void
}

export function TokenSection({
  allTokens,
  visibleTokens,
  hasMoreTokens,
  canShowLess,
  loadingMoreTokens,
  onShowLess,
  onLoadMore,
  onPressToken,
}: TokenSectionProps) {
  return (
    <FlatList
      ListHeaderComponent={
        <View className="flex-row justify-between pt-6 pb-2">
          <Text variant="large" className="text-foreground">
            Tokens
          </Text>
          <Text variant="small" className="text-muted-foreground active:opacity-60">
            {allTokens.length} tokens
          </Text>
        </View>
      }
      ListEmptyComponent={<EmptyTokens />}
      ListFooterComponent={
        hasMoreTokens || canShowLess ? (
          <View className="border-border mx-1 flex-row border-t">
            {canShowLess && !loadingMoreTokens && (
              <Pressable
                onPress={onShowLess}
                className="flex-1 items-center py-3 active:opacity-60"
              >
                <Text variant="small" className="text-muted-foreground">
                  Show less
                </Text>
              </Pressable>
            )}
            {canShowLess && hasMoreTokens && <View className="bg-border w-px" />}
            {hasMoreTokens && (
              <Pressable
                onPress={onLoadMore}
                className="flex-1 items-center py-3 active:opacity-60"
              >
                {loadingMoreTokens ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <Text variant="small" className="text-primary">
                    Load more
                  </Text>
                )}
              </Pressable>
            )}
          </View>
        ) : null
      }
      scrollEnabled={false}
      keyExtractor={(item) => item.mint}
      data={visibleTokens}
      renderItem={({ item, index }) => (
        <>
          {index !== 0 && <View className="bg-border mx-1 h-px" />}
          <TokenListItem item={item} onPress={onPressToken} />
        </>
      )}
    />
  )
}
