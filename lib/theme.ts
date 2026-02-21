import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native'

export const THEME = {
  light: {
    background: 'hsl(45 22.2222% 96.4706%)',
    foreground: 'hsl(225 27.7778% 14.1176%)',

    card: 'hsl(0 0% 100%)',
    cardForeground: 'hsl(225 27.7778% 14.1176%)',

    popover: 'hsl(0 0% 100%)',
    popoverForeground: 'hsl(225 27.7778% 14.1176%)',

    primary: 'hsl(138 8.2645% 52.5490%)',
    primaryForeground: 'hsl(0 0% 100%)',

    secondary: 'hsl(77.1429 19.6262% 79.0196%)',
    secondaryForeground: 'hsl(225 27.7778% 14.1176%)',

    muted: 'hsl(42.8571 13.2075% 89.6078%)',
    mutedForeground: 'hsl(220 8.9362% 46.0784%)',

    accent: 'hsl(102.8571 11.4754% 76.0784%)',
    accentForeground: 'hsl(225 27.7778% 14.1176%)',

    destructive: 'hsl(1.7021 55.7312% 50.3922%)',
    destructiveForeground: 'hsl(0 0% 100%)',

    border: 'hsl(42.8571 13.2075% 89.6078%)',
    input: 'hsl(0 0% 100%)',
    ring: 'hsl(138 8.2645% 52.5490%)',

    chart1: 'hsl(138 8.2645% 52.5490%)',
    chart2: 'hsl(77.6471 16.6667% 60%)',
    chart3: 'hsl(101.5385 11.7117% 56.4706%)',
    chart4: 'hsl(220 8.9362% 46.0784%)',
    chart5: 'hsl(42.8571 13.2075% 89.6078%)',

    sidebar: 'hsl(60 16.6667% 97.6471%)',
    sidebarForeground: 'hsl(225 27.7778% 14.1176%)',
    sidebarPrimary: 'hsl(138 8.2645% 52.5490%)',
    sidebarPrimaryForeground: 'hsl(0 0% 100%)',
    sidebarAccent: 'hsl(42.8571 13.2075% 89.6078%)',
    sidebarAccentForeground: 'hsl(225 27.7778% 14.1176%)',
    sidebarBorder: 'hsl(42.8571 13.2075% 89.6078%)',
    sidebarRing: 'hsl(138 8.2645% 52.5490%)',

    radius: 6, // 0.35rem ≈ 6px for RN
  },

  dark: {
    background: 'hsl(0 0% 3.9216%)',
    foreground: 'hsl(0 0% 96.0784%)',

    card: 'hsl(0 0% 7.0588%)',
    cardForeground: 'hsl(0 0% 96.0784%)',

    popover: 'hsl(0 0% 7.0588%)',
    popoverForeground: 'hsl(0 0% 96.0784%)',

    primary: 'hsl(138 8.2645% 52.5490%)',
    primaryForeground: 'hsl(0 0% 0%)',

    secondary: 'hsl(0 0% 10.1961%)',
    secondaryForeground: 'hsl(0 0% 96.0784%)',

    muted: 'hsl(0 0% 10.1961%)',
    mutedForeground: 'hsl(0 0% 62.7451%)',

    accent: 'hsl(137.1429 11.4754% 23.9216%)',
    accentForeground: 'hsl(0 0% 96.0784%)',

    destructive: 'hsl(0 84.2365% 60.1961%)',
    destructiveForeground: 'hsl(0 0% 100%)',

    border: 'hsl(0 0% 16.4706%)',
    input: 'hsl(0 0% 7.0588%)',
    ring: 'hsl(138 8.2645% 52.5490%)',

    chart1: 'hsl(138 8.2645% 52.5490%)',
    chart2: 'hsl(77.6471 16.6667% 60%)',
    chart3: 'hsl(101.5385 11.7117% 56.4706%)',
    chart4: 'hsl(220 8.9362% 46.0784%)',
    chart5: 'hsl(134.1176 8.6294% 38.6275%)',

    sidebar: 'hsl(0 0% 5.8824%)',
    sidebarForeground: 'hsl(0 0% 96.0784%)',
    sidebarPrimary: 'hsl(138 8.2645% 52.5490%)',
    sidebarPrimaryForeground: 'hsl(0 0% 100%)',
    sidebarAccent: 'hsl(0 0% 10.1961%)',
    sidebarAccentForeground: 'hsl(0 0% 96.0784%)',
    sidebarBorder: 'hsl(0 0% 16.4706%)',
    sidebarRing: 'hsl(138 8.2645% 52.5490%)',

    radius: 6,
  },
}

export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
}
