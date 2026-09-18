/** An app icon drawn from a Material Symbol on a colored tile, or an uploaded image. */
export type IconSpec =
  | { kind: 'symbol'; symbol: string; background: string; foreground: string }
  | { kind: 'image'; dataUrl: string }

export interface Disguise {
  name: string
  icon: IconSpec
}

export interface DisguisePreset extends Disguise {
  id: string
}

export const SANCTUM_PRESET_ID = 'sanctum'
export const CUSTOM_PRESET_ID = 'custom'

export const DISGUISE_PRESETS: readonly DisguisePreset[] = [
  { id: SANCTUM_PRESET_ID, name: 'Sanctum', icon: symbol('spa', '#4c6557') },
  { id: 'weather', name: 'Weather', icon: symbol('partly_cloudy_day', '#2f7fd8') },
  { id: 'calculator', name: 'Calculator', icon: symbol('calculate', '#3a3f45') },
  { id: 'notes', name: 'Notes', icon: symbol('sticky_note_2', '#e0a21a') },
  { id: 'recipes', name: 'Recipes', icon: symbol('restaurant', '#d9622b') },
  { id: 'fitness', name: 'Fitness', icon: symbol('directions_run', '#2e9a58') },
  { id: 'news', name: 'Daily News', icon: symbol('newspaper', '#1f2937') },
]

/** Symbols offered when building a custom icon. */
export const CUSTOM_SYMBOLS: readonly string[] = [
  'spa', 'partly_cloudy_day', 'calculate', 'sticky_note_2', 'restaurant', 'directions_run',
  'newspaper', 'menu_book', 'music_note', 'shopping_cart', 'calendar_month', 'photo_camera',
  'local_florist', 'pets', 'sports_esports', 'savings',
]

export const CUSTOM_COLORS: readonly string[] = [
  '#4c6557', '#2f7fd8', '#3a3f45', '#e0a21a', '#d9622b', '#2e9a58',
  '#8b5cf6', '#db2777', '#0e7490', '#1f2937',
]

export const MAX_NAME_LENGTH = 30

export function presetById(id: string): DisguisePreset | undefined {
  return DISGUISE_PRESETS.find((p) => p.id === id)
}

function symbol(name: string, background: string): IconSpec {
  return { kind: 'symbol', symbol: name, background, foreground: '#ffffff' }
}
