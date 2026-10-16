import background from '../assets/backgrounds/background.png'
import closeButton from '../assets/backgrounds/nine-slice-close-btn.png'
import panel from '../assets/backgrounds/nine-slice.png'
import counter from '../assets/props/counter.png'
import mug from '../assets/props/mug.png'
import papers from '../assets/props/papers.png'
import peterProfileSheet from '../assets/sprites/peter_profile_spritesheet.png'
import steamSheet from '../assets/sprites/steam_spritesheet.png'

export const TEXTURE = {
  background: 'background',
  closeButton: 'close-button',
  counter: 'counter',
  mug: 'mug',
  panel: 'panel',
  papers: 'papers',
  peterProfile: 'peter-profile',
  steam: 'steam',
} as const

export const ANIM = {
  handProfile: 'hand-profile',
  steam: 'steam',
} as const

export const IMAGES = {
  [TEXTURE.background]: background,
  [TEXTURE.closeButton]: closeButton,
  [TEXTURE.panel]: panel,
  [TEXTURE.counter]: counter,
  [TEXTURE.mug]: mug,
  [TEXTURE.papers]: papers,
} as const

export const SPRITESHEETS = {
  [TEXTURE.peterProfile]: { url: peterProfileSheet, frameWidth: 128, frameHeight: 128 },
  [TEXTURE.steam]: { url: steamSheet, frameWidth: 32, frameHeight: 32 },
} as const
