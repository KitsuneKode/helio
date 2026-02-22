import { Pressable, View } from 'react-native'
import {
  CheckmarkCircle01Icon,
  CancelCircleIcon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { short } from '@/utils/format-text'
import { formatDate } from '@/utils/format-date'
import type { GetTransactionsResult } from '@/types'

type Transaction = GetTransactionsResult[number]

type Props = {
  item: Transaction
  onPress?: (signature: string) => void
}

export const TransactionListItem = ({ item, onPress }: Props) => {
  const isSuccess = item.err === null
  const timeAgo = item.blockTime && formatDate(new Date(Number(item.blockTime) * 1000))

  return (
    <Pressable onPress={() => onPress?.(item.signature)} className="active:opacity-70">
      <View className="flex-row items-center gap-4 px-1 py-3">
        {/* Status indicator */}
        <View
          className={[
            'h-10 w-10 shrink-0 items-center justify-center rounded-full',
            isSuccess ? 'bg-green-500/15' : 'bg-destructive/15',
          ].join(' ')}
        >
          {isSuccess ? (
            <Icon icon={CheckmarkCircle01Icon} className="size-5 text-green-500" />
          ) : (
            <Icon icon={CancelCircleIcon} className="text-destructive size-5" />
          )}
        </View>

        {/* Signature + meta */}
        <View className="flex-1">
          <Text className="text-foreground font-mono text-sm font-medium" numberOfLines={1}>
            {short(item.signature, 10)}
          </Text>
          <View className="mt-1 flex-row items-center gap-2">
            <View
              className={[
                'rounded px-1.5 py-0.5',
                isSuccess ? 'bg-green-500/10' : 'bg-destructive/10',
              ].join(' ')}
            >
              <Text
                className={[
                  'text-xs font-semibold',
                  isSuccess ? 'text-green-500' : 'text-destructive',
                ].join(' ')}
              >
                {isSuccess ? 'Success' : 'Failed'}
              </Text>
            </View>
            {timeAgo && (
              <Text variant="muted" className="text-xs">
                {timeAgo}
              </Text>
            )}
          </View>
        </View>

        <Icon icon={ArrowRight01Icon} className="text-muted-foreground size-4" />
      </View>
    </Pressable>
  )
}
