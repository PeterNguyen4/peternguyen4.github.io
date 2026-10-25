
export const PALETTE = {
  outline: '#5a3d22',
  edge: '#d9bf8c',
  center: '#f1e2bd',
  text: '#4a3320',
} as const

export const PANEL_SLICE = 10
export const PANEL_SCALE = 1
export const POPUP_DEPTH = 100
export const POPUP_DIM_ALPHA = 0.5
export const POPUP_TITLE_TOP = 20
export const POPUP_BODY_LINE_SPACING = 3
export const POPUP_CONTENT_GAP = 10
export const POPUP_WRAP_PAD = 8

export const CLOSE_PLATE = { x0: 4, y0: 4, x1: 10, y1: 10 }
export const CLOSE_HOVER_MULT = [0.88, 0.82, 0.72]
export const CLOSE_HOVER_KEY = 'close-button-hover'
export const CLOSE_OFFSET = { x: -17, y: 3 }

export const PROFILE_POPUP = { width: 330, height: 200 }
export const PROFILE_LAYOUT = {
  headingColor: '#8a6a47',
  headingY: 6,
  skillsY: 24,
  projectsY: 42,
  rowY: 50,
  iconGap: 4,
  skillGap: 14,
  frameNative: { w: 100, h: 80 },
  columnGap: 10,
  bannerWidth: 190,
  plateWidth: 190,
  title: 'Erwix',
  bullets: ['Journal and analyze trades automatically', 'Build and test strategies'],
  bulletGap: 4,
  bulletRowGap: 4,
  bulletLineSpacing: 3,
  bulletsOffsetY: 8,
  platePadX: 10,
  plateBottomPad: 8,
  ctaGap: 4,
} as const
export const COFFEE_POPUP = { width: 296, height: 204 }
