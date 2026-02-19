import { SafeAreaViewUniwind } from '@/components/styled-uniwind-components'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import { StarIcon } from '@hugeicons/core-free-icons'
import { Link } from 'expo-router'
import * as React from 'react'
import { Image, type ImageStyle, View } from 'react-native'
import { useUniwind } from 'uniwind'

const LOGO = {
  light: require('@/assets/images/react-native-reusables-light.png'),
  dark: require('@/assets/images/react-native-reusables-dark.png'),
}

const IMAGE_STYLE: ImageStyle = {
  height: 76,
  width: 76,
}

export default function Screen() {
  const { theme } = useUniwind()

  return (
    <SafeAreaViewUniwind className="flex-1 bg-green-500" edges={['top']}>
      <View className="flex-1 items-center justify-center gap-8 bg-green-500 p-4">
        <Image source={LOGO[theme ?? 'light']} style={IMAGE_STYLE} resizeMode="contain" />
        <View className="gap-2 p-4">
          <Text className="ios:text-foreground text-muted-foreground font-mono text-sm">
            1. Edit <Text variant="code">app/index.tsx</Text> to get started.
          </Text>
          <Text className="ios:text-foreground text-muted-foreground font-mono text-sm">
            2. Save to see your changes instantly.
          </Text>
        </View>
        <View className="flex-row gap-2">
          <Link href="https://reactnativereusables.com" asChild>
            <Button>
              <Text>Browse the Docs</Text>
            </Button>
          </Link>
          <Link href="https://github.com/founded-labs/react-native-reusables" asChild>
            <Button variant="ghost">
              <Text>Star the Repo</Text>
              <Icon icon={StarIcon} />
            </Button>
          </Link>
        </View>
      </View>
    </SafeAreaViewUniwind>
  )
}
