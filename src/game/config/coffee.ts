export const BUFF_COLOR = '#3a7d3a'
export const NIGHT_COLOR = '#2f5f9e'
export const ICON_GAP = 3

export const COFFEE_LEFT_X = 0.33
export const COFFEE_RIGHT_X = 0.6
export const COFFEE_TUB_Y = 35
export const COFFEE_FRAME_SLICE = { size: 60, edge: 2 }
export const COFFEE_BANNER = {
  y: 72,
  text: 'Kirkland Signature\nColombian Coffee',
  lineSpacing: 1,
  padX: 3,
}
export const BANNER_FRAMES = {
  left: [0, 0, 19, 18],
  mid: [21, 0, 1, 16],
  right: [25, 0, 19, 18],
  minMid: 6,
  textInset: 22,
  textCenterY: 7.5,
  overlapY: 13,
  height: 18,
} as const
export const BANNER_TALL_FRAMES = {
  left: [0, 0, 22, 26],
  mid: [24, 0, 1, 24],
  right: [28, 0, 22, 26],
  minMid: 6,
  textInset: 22,
  textCenterY: 11.5,
  overlapY: 21,
  height: 26,
} as const
export const COFFEE_BUFF_SIZE = 8
export const COFFEE_BUFF_ROWS = { energy: 104, night: 116 }

export const COFFEE_STATS_PLATE = { slice: 4, padLeft: 20, padRight: 15, padY: 12 }

export const COFFEE_RATINGS: [string, number][] = [
  ['Affordability', 4.5],
  ['Taste', 4],
  ['Convenience', 5],
  ['Roast Level', 4],
]
export const COFFEE_ROW_HEIGHT = 30
export const COFFEE_COMPACT_GAP = 10
export const COFFEE_STARS_Y = 14
export const STARS_INSET = 2

export const COFFEE_CTA = { text: "LET'S CHAT", padding: { x: 8, y: 7 }, labelOffsetY: -1, arrowOffsetY: -2, offsetX: 36, offsetY: 4, edge: 5, pressDepth: 1 }
export const CTA_ARROW_GAP = 3
export const CTA_ARROW_TINT = 0xd9bf8c
export const ERWIX_URL = 'https://erwix.net/'
export const ERWIX_FALLBACK_URL = 'https://github.com/PeterNguyen4/Erwix'
export const CONTACT_GMAIL = 'https://mail.google.com/mail/?view=cm&fs=1&to=peternguyen644@gmail.com&su=Hello%20Peter'

export const NOSTALGIA_COLOR = '#c0455a'
export const DIPLOMA_BANNER_Y = 72
export const DIPLOMA_TRAIT_Y = 96
export const DIPLOMA_TRAIT_ROW_GAP = 10
export const DIPLOMA_BANNER_EXTRA = 14
export const DIPLOMA_PLATE_PAD = { left: 14, right: 9 }
export const DIPLOMA_RATINGS: [string, number][] = [
  ['Lectures', 4.5],
  ['Library', 5],
  ['Food', 3],
  ['Dorms', 4],
]
export const DIPLOMA_OUTLINE_DEPTH = 1
