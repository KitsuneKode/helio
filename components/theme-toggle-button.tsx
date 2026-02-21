import { Button } from './ui/button'
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
    <Button
      onPressIn={toggleTheme}
      size="icon"
      variant="ghost"
      className="ios:size-9 web:mx-4 rounded-full"
    >
      <Icon icon={THEME_ICONS[theme ?? 'light']} className="size-5" />
    </Button>
  )
}
