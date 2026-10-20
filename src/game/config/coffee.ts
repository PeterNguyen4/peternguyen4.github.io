export const BUFF_COLOR = '#3a7d3a'
export const NIGHT_COLOR = '#2f5f9e'
export const ICON_SCALE = 4
export const ICON_GAP = 12

export const COFFEE_LEFT_X = 0.27
export const COFFEE_RIGHT_X = 0.52
export const COFFEE_TUB_Y = 140
export const COFFEE_TUB_SCALE = 4
export const COFFEE_FRAME_SLICE = { size: 60, edge: 2 }
export const COFFEE_BANNER = {
  y: 290,
  text: 'Kirkland Signature\nColombian Coffee',
  size: '28px',
  lineSpacing: 4,
  scale: 4,
  padX: 10,
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
export const COFFEE_BUFF_SIZE = 16
export const COFFEE_BUFF_TEXT_SIZE = 24
export const COFFEE_BUFF_ROWS = { energy: 416, night: 464 }

export const COFFEE_STATS_PLATE = { slice: 4, scale: 4, padLeft: 80, padRight: 60, padY: 48 }

export const COFFEE_RATINGS: [string, number][] = [
  ['Affordability', 4.5],
  ['Taste', 4],
  ['Convenience', 5],
  ['Roast Level', 4],
]
export const COFFEE_ROW_HEIGHT = 112
export const COFFEE_LABEL_SIZE = 24
export const COFFEE_STARS_Y = 56

export const COFFEE_CTA = { text: "LET'S CHAT", size: '28px', padding: { x: 28, y: 28 }, labelOffsetY: -2, offsetX: 160, offsetY: 30, scale: 4, edge: 5, pressDepth: 1 }
export const CTA_ARROW_GAP = 12
export const CTA_ARROW_TINT = 0xd9bf8c
export const ERWIX_URL = 'https://erwix.net/'
export const ERWIX_FALLBACK_URL = 'https://github.com/PeterNguyen4/Erwix'
export const CONTACT_GMAIL = 'https://mail.google.com/mail/?view=cm&fs=1&to=peternguyen644@gmail.com&su=Hello%20Peter'
