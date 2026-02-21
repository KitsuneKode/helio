import { View } from 'react-native'
import { Skeleton } from '@/components/ui/skeleton'

export function QuoteCardSkeleton() {
  return (
    <View className="bg-card border-border mt-4 rounded-2xl border px-5 py-4">
      <View className="flex-row items-center justify-between py-1.5">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-3 w-36 rounded" />
      </View>
      <View className="bg-border my-1 h-px" />
      <View className="flex-row items-center justify-between py-1.5">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-3 w-14 rounded" />
      </View>
      <View className="bg-border my-1 h-px" />
      <View className="flex-row items-center justify-between py-1.5">
        <Skeleton className="h-3 w-10 rounded" />
        <Skeleton className="h-3 w-24 rounded" />
      </View>
      <View className="bg-border my-1 h-px" />
      <View className="flex-row items-center justify-between py-1.5">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-3 w-28 rounded" />
      </View>
    </View>
  )
}
