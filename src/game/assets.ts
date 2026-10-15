import background from '../assets/backgrounds/background.png'
import counter from '../assets/props/counter.png'
import peterProfileSheet from '../assets/sprites/peter_profile_spritesheet.png'

export const TEXTURE = {
  background: 'background',
  counter: 'counter',
  peterProfile: 'peter-profile',
} as const

export const ANIM = {
  handProfile: 'hand-profile',
} as const

export const IMAGES = {
  [TEXTURE.background]: background,
  [TEXTURE.counter]: counter,
} as const

export const SPRITESHEETS = {
  [TEXTURE.peterProfile]: { url: peterProfileSheet, frameWidth: 512, frameHeight: 512 },
} as const
