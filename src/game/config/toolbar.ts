import { TEXTURE } from '../assets'

export const TOOL_SLOTS = 4
export const TOOLBAR_X = 20
export const TOOLBAR_TOP = 16
export const TOOL_GAP = 1
export const TOOL_ICONS = [TEXTURE.linkedin, TEXTURE.github]
export const TOOL_LABELS = ['LinkedIn', 'GitHub']
export const TOOL_LINKS = ['https://www.linkedin.com/in/peternguyen4', 'https://github.com/PeterNguyen4']

export const MUSIC_VOLUME = 0.15

export const VOLUME_BUTTON = {
  rows: 1,
  lift: 8,
  depth: 1.5,
  textures: {
    off: { base: TEXTURE.volumeOff, hover: TEXTURE.volumeOffHover, click: TEXTURE.volumeOffClick },
    on: { base: TEXTURE.volumeOn, hover: TEXTURE.volumeOnHover, click: TEXTURE.volumeOnClick },
  },
} as const

export const TOOLTIP_DEPTH = 50
export const TOOLTIP_CAP = 12
export const TOOLTIP_PANEL = { left: 5, centerY: 19.5, minWidth: 22 }
export const TOOLTIP_GAP = 3
export const TOOLTIP_PAD = 4
export const TOOLTIP_TEXT_COLOR = '#e0e0dd'
export const TOOLTIP_TEXT_Y = -1.5
export const TOOLTIP_LINE = { color: 0x544444, y: 3.5 }
export const TOOLTIP_ARROW = { size: 5, gap: 2, y: 0 }
export const TOOLTIP_HOP_MS = 80
