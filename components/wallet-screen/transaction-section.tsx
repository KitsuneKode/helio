import { ActivityIndicator, FlatList, Pressable, View } from 'react-native'
import { Text } from '@/components/ui/text'
import { EmptyTransactions } from '@/components/wallet-screen/empty-transactions'
import { TransactionListItem } from '@/components/wallet-screen/transaction-list-item'
import type { GetTransactionsResult } from '@/lib/solana'

type TransactionSectionProps = {
  transactions: GetTransactionsResult
  hasMoreTransactions: boolean
  loadingMoreTransactions: boolean
  onLoadMore: () => Promise<void> | void
  onPressTransaction: (signature: string) => void
}

export function TransactionSection({
  transactions,
  hasMoreTransactions,
  loadingMoreTransactions,
  onLoadMore,
  onPressTransaction,
}: TransactionSectionProps) {
  return (
    <FlatList
      ListHeaderComponent={
        <View className="pt-6 pb-2">
          <Text variant="large" className="text-foreground">
            Recent Transactions
          </Text>
        </View>
      }
      ListEmptyComponent={<EmptyTransactions />}
      ListFooterComponent={
        hasMoreTransactions ? (
          <Pressable
            onPress={onLoadMore}
            disabled={loadingMoreTransactions}
            className="active:opacity-60"
          >
            <View className="border-border mx-1 items-center border-t py-3">
              {loadingMoreTransactions ? (
                <ActivityIndicator size="small" />
              ) : (
                <Text variant="small" className="text-primary">
                  Load more
                </Text>
              )}
            </View>
          </Pressable>
        ) : null
      }
      scrollEnabled={false}
      keyExtractor={(item) => item.signature}
      data={transactions}
      renderItem={({ item, index }) => (
        <>
          {index !== 0 && <View className="bg-border mx-1 h-px" />}
          <TransactionListItem item={item} onPress={onPressTransaction} />
        </>
      )}
    />
  )
}
