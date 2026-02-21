import { Text } from '@/components/ui/text'

export function SectionLabel({ label }: { label: string }) {
  return (
    <Text className="text-muted-foreground mb-3 text-xs font-semibold tracking-widest uppercase">
      {label}
    </Text>
  )
}
