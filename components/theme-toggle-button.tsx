import { Pressable } from 'react-native'
import { Uniwind, useUniwind } from 'uniwind'
import { Icon } from './ui/icon'
import { Moon01Icon, SunIcon } from '@hugeicons/core-free-icons'

const THEME_ICONS = {
  light: SunIcon,
  dark: Moon01Icon,
}

export function ThemeToggle() {
  const { theme } = useUniwind()

  function toggleTheme() {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    Uniwind.setTheme(newTheme)
  }

  return (
    <Pressable
      onPressIn={toggleTheme}
      className="bg-muted items-center justify-center rounded-full p-1.5 active:opacity-70"
    >
      <Icon icon={THEME_ICONS[theme ?? 'light']} className="text-muted-foreground size-4" />
    </Pressable>
  )
}
