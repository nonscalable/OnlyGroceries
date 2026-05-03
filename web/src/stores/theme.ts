import { persistentAtom } from '@nanostores/persistent'

export type ThemePreference = 'system' | 'light' | 'dark'

export const themePreference = persistentAtom<ThemePreference>(
  'onlygroceries:theme',
  'system'
)

export const highlightColor = persistentAtom<string>(
  'onlygroceries:highlightColor',
  '#2563eb'
)

const darkMediaQuery =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null

function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'system') {
    return darkMediaQuery?.matches ? 'dark' : 'light'
  }

  return preference
}

function normalizeHexColor(color: string): string {
  const trimmed = color.trim()
  const normalized = trimmed.startsWith('#') ? trimmed : `#${trimmed}`

  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    return normalized.toLowerCase()
  }

  if (/^#[0-9a-fA-F]{3}$/.test(normalized)) {
    const r = normalized[1]
    const g = normalized[2]
    const b = normalized[3]
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }

  return '#2563eb'
}

type Rgb = { r: number; g: number; b: number }

function hexToRgb(hex: string): Rgb {
  const clean = normalizeHexColor(hex).slice(1)
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16)
  }
}

function rgbToHsl({ r, g, b }: Rgb): { h: number; s: number; l: number } {
  const nr = r / 255
  const ng = g / 255
  const nb = b / 255
  const max = Math.max(nr, ng, nb)
  const min = Math.min(nr, ng, nb)
  const delta = max - min

  let h = 0
  if (delta !== 0) {
    if (max === nr) {
      h = ((ng - nb) / delta) % 6
    } else if (max === ng) {
      h = (nb - nr) / delta + 2
    } else {
      h = (nr - ng) / delta + 4
    }
  }

  const l = (max + min) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))

  return {
    h: Math.round(((h * 60 + 360) % 360) * 10) / 10,
    s: Math.round(s * 1000) / 10,
    l: Math.round(l * 1000) / 10
  }
}

function rgbToHslCss(rgb: Rgb): string {
  const { h, s, l } = rgbToHsl(rgb)
  return `${h} ${s}% ${l}%`
}

function mixRgb(color: Rgb, target: Rgb, weight: number): Rgb {
  const clamp = Math.min(1, Math.max(0, weight))

  return {
    r: Math.round(color.r * (1 - clamp) + target.r * clamp),
    g: Math.round(color.g * (1 - clamp) + target.g * clamp),
    b: Math.round(color.b * (1 - clamp) + target.b * clamp)
  }
}

function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (value: number): number => {
    const n = value / 255
    return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4
  }

  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function textOnColor(color: Rgb): string {
  return relativeLuminance(color) > 0.38 ? '222.2 47.4% 11.2%' : '210 40% 98%'
}

export function applyHighlightColor(color = highlightColor.get()): void {
  if (typeof document === 'undefined') {
    return
  }

  const normalized = normalizeHexColor(color)
  const root = document.documentElement
  const base = hexToRgb(normalized)
  const isDark = root.classList.contains('dark')

  root.style.setProperty('--primary', rgbToHslCss(base))
  root.style.setProperty('--ring', rgbToHslCss(base))
  root.style.setProperty('--primary-foreground', textOnColor(base))

  // Accent colors keep hover/focus highlights visible without overpowering cards.
  const accentBg = isDark
    ? mixRgb(base, { r: 0, g: 0, b: 0 }, 0.72)
    : mixRgb(base, { r: 255, g: 255, b: 255 }, 0.84)
  root.style.setProperty('--accent', rgbToHslCss(accentBg))
  root.style.setProperty(
    '--accent-foreground',
    isDark ? '210 40% 98%' : rgbToHslCss(base)
  )

  root.style.setProperty('--sidebar-primary', rgbToHslCss(base))
  root.style.setProperty('--sidebar-ring', rgbToHslCss(base))
}

export function applyTheme(preference = themePreference.get()): void {
  if (typeof document === 'undefined') {
    return
  }

  const resolvedTheme = resolveTheme(preference)
  const root = document.documentElement

  root.classList.toggle('dark', resolvedTheme === 'dark')
  root.style.colorScheme = resolvedTheme

  applyHighlightColor()
}

export function initializeTheme(): void {
  if (typeof window === 'undefined') {
    return
  }

  applyTheme()

  themePreference.listen(preference => {
    applyTheme(preference)
  })

  highlightColor.listen(color => {
    applyHighlightColor(color)
  })

  darkMediaQuery?.addEventListener('change', () => {
    if (themePreference.get() === 'system') {
      applyTheme('system')
    }
  })
}
