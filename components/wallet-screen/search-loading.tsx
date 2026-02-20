import { View } from 'react-native'
import { Skeleton } from '@/components/ui/skeleton'
import { Text } from '@/components/ui/text'

const SkeletonRow = () => (
  <View className="flex-row items-center gap-4 px-1 py-3">
    <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
    <View className="flex-1 gap-2">
      <Skeleton className="h-3.5 w-3/4 rounded-full" />
      <Skeleton className="h-2.5 w-1/3 rounded-full" />
    </View>
    <Skeleton className="h-3 w-3 rounded-full" />
  </View>
)

const SkeletonSection = ({ label, rows = 3 }: { label: string; rows?: number }) => (
  <View className="mt-6">
    <View className="pb-3">
      <Text variant="large" className="text-foreground">
        {label}
      </Text>
    </View>
    {Array.from({ length: rows }).map((_, i) => (
      <View key={i}>
        {i !== 0 && <View className="bg-border mx-1 h-px" />}
        <SkeletonRow />
      </View>
    ))}
  </View>
)

export const SearchLoading = () => {
  return (
    <View className="mt-6">
      {/* Balance card skeleton */}
      <View className="border-border bg-card overflow-hidden rounded-xl border">
        {/* Header strip */}
        <View className="bg-primary/10 flex-row items-center gap-3 px-5 py-4">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-2.5 w-24 rounded-full" />
        </View>

        {/* Balance amount */}
        <View className="items-center gap-3 py-8">
          <Skeleton className="h-12 w-44 rounded-xl" />
          <Skeleton className="h-3 w-10 rounded-full" />
        </View>

        {/* Address + copy row */}
        <View className="border-border flex-row items-center justify-between border-t px-5 py-4">
          <View className="gap-2">
            <Skeleton className="h-2 w-20 rounded-full" />
            <Skeleton className="h-3.5 w-40 rounded-full" />
          </View>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </View>
      </View>

      <SkeletonSection label="Tokens" rows={3} />
      <SkeletonSection label="Recent Transactions" rows={4} />
    </View>
  )
}
