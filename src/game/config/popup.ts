export const FONT = '"FS Pixel Sans", monospace'

export const PALETTE = {
  outline: '#5a3d22',
  edge: '#d9bf8c',
  center: '#f1e2bd',
  text: '#4a3320',
} as const

export const PANEL_SLICE = 10
export const PANEL_SCALE = 4
export const POPUP_DEPTH = 100
export const POPUP_DIM_ALPHA = 0.5
export const POPUP_TITLE_SIZE = '40px'
export const POPUP_TITLE_TOP = 80
export const POPUP_BODY_SIZE = '24px'
export const POPUP_BODY_LINE_SPACING = 14
export const POPUP_CONTENT_GAP = 40
export const POPUP_WRAP_PAD = 32

export const CLOSE_PLATE = { x0: 4, y0: 4, x1: 10, y1: 10 }
export const CLOSE_HOVER_MULT = [0.88, 0.82, 0.72]
export const CLOSE_HOVER_KEY = 'close-button-hover'
export const CLOSE_OFFSET = { x: -17, y: 3 }

export const PROFILE_POPUP = { width: 1300, height: 760 }
export const PROFILE_LAYOUT = {
  headingColor: '#8a6a47',
  headingY: 10,
  skillsY: 80,
  projectsY: 170,
  rowY: 215,
  iconScale: 4,
  iconGap: 16,
  skillSize: '24px',
  skillGap: 56,
  frameNative: { w: 100, h: 80 },
  frameScale: 4,
  columnGap: 48,
  bannerWidth: 620,
  plateWidth: 560,
  title: 'Erwix',
  bullets: ['Journal and analyze trades automatically', 'Build and test strategies'],
  bulletScale: 4,
  bulletGap: 16,
  bulletRowGap: 20,
  bulletLineSpacing: 6,
  bulletTextSize: '20px',
  bulletsOffsetY: 36,
  platePadX: 48,
  plateBottomPad: 40,
  ctaGap: 20,
} as const
export const COFFEE_POPUP = { width: 1500, height: 810 }
