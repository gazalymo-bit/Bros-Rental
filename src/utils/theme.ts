export type ThemeId = 'dark' | 'light' | 'navy' | 'sand' | 'emerald' | 'cobalt';
export type LayoutMode = 'topbar' | 'sidebar';
export type ContentWidth = 'contained' | 'fluid';
export type DensityMode = 'comfortable' | 'compact';
export type AccentColor = 'emerald' | 'blue' | 'purple' | 'amber';

export interface ThemeSettings {
  theme: ThemeId;
  layout: LayoutMode;
  width: ContentWidth;
  density: DensityMode;
  accent: AccentColor;
}

const THEME_SETTINGS_KEY = 'rental_calc_theme_settings';

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  theme: 'dark',
  layout: 'topbar',
  width: 'contained',
  density: 'comfortable',
  accent: 'emerald',
};

export function getStoredThemeSettings(): ThemeSettings {
  try {
    const raw = localStorage.getItem(THEME_SETTINGS_KEY);
    if (!raw) return DEFAULT_THEME_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      theme: parsed.theme || DEFAULT_THEME_SETTINGS.theme,
      layout: parsed.layout || DEFAULT_THEME_SETTINGS.layout,
      width: parsed.width || DEFAULT_THEME_SETTINGS.width,
      density: parsed.density || DEFAULT_THEME_SETTINGS.density,
      accent: parsed.accent || DEFAULT_THEME_SETTINGS.accent,
    };
  } catch {
    return DEFAULT_THEME_SETTINGS;
  }
}

export function saveThemeSettings(settings: ThemeSettings): void {
  try {
    localStorage.setItem(THEME_SETTINGS_KEY, JSON.stringify(settings));
    applyThemeToDOM(settings);
  } catch (e) {
    console.error('Failed to save theme settings:', e);
  }
}

export function applyThemeToDOM(settings: ThemeSettings): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', settings.theme);
  root.setAttribute('data-accent', settings.accent);
  root.setAttribute('data-layout', settings.layout);
  root.setAttribute('data-width', settings.width);
  root.setAttribute('data-density', settings.density);
}
