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
  size: '16px',
  lineSpacing: 4,
  scale: 4,
  padX: 6,
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
export const COFFEE_BUFF_SIZE = 16
export const COFFEE_BUFF_ROWS = { energy: 386, night: 428 }

export const COFFEE_STATS_PLATE = { slice: 4, scale: 4, padX: 38, padY: 38}

export const COFFEE_RATINGS: [string, number][] = [
  ['Affordability', 4.5],
  ['Taste', 4],
  ['Convenience', 5],
  ['Roast Level', 4],
]
export const COFFEE_ROW_HEIGHT = 112
export const COFFEE_LABEL_SIZE = 20
export const COFFEE_STARS_Y = 56

export const COFFEE_CTA = { text: "LET'S CHAT", size: '24px', padding: { x: 28, y: 18 }, offsetX: 160, offsetY: 30 }
