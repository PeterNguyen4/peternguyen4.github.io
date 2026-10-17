import background from '../assets/backgrounds/background.png'
import coffee from '../assets/backgrounds/coffee.png'
import github from '../assets/backgrounds/github.png'
import linkedin from '../assets/backgrounds/linkedin.png'
import profileIcon from '../assets/backgrounds/profile.png'
import closeButton from '../assets/backgrounds/nine-slice-close-btn.png'
import panel from '../assets/backgrounds/nine-slice.png'
import toolItemFocus from '../assets/backgrounds/tool-item-focus.png'
import todo from '../assets/backgrounds/todo.png'
import toolItem from '../assets/backgrounds/tool-item.png'
import tooltip from '../assets/backgrounds/tooltip.png'
import counter from '../assets/props/counter.png'
import mug from '../assets/props/mug.png'
import papers from '../assets/props/papers.png'
import peterProfileSheet from '../assets/sprites/peter_profile_spritesheet.png'
import steamSheet from '../assets/sprites/steam_spritesheet.png'

export const TEXTURE = {
  background: 'background',
  closeButton: 'close-button',
  coffee: 'coffee',
  counter: 'counter',
  github: 'github',
  linkedin: 'linkedin',
  mug: 'mug',
  panel: 'panel',
  profileIcon: 'profile-icon',
  papers: 'papers',
  peterProfile: 'peter-profile',
  steam: 'steam',
  todo: 'todo',
  toolItem: 'tool-item',
  toolItemFocus: 'tool-item-focus',
  tooltip: 'tooltip',
} as const

export const ANIM = {
  handProfile: 'hand-profile',
  steam: 'steam',
} as const

export const IMAGES = {
  [TEXTURE.background]: background,
  [TEXTURE.closeButton]: closeButton,
  [TEXTURE.coffee]: coffee,
  [TEXTURE.panel]: panel,
  [TEXTURE.profileIcon]: profileIcon,
  [TEXTURE.counter]: counter,
  [TEXTURE.github]: github,
  [TEXTURE.linkedin]: linkedin,
  [TEXTURE.mug]: mug,
  [TEXTURE.papers]: papers,
  [TEXTURE.todo]: todo,
  [TEXTURE.toolItem]: toolItem,
  [TEXTURE.toolItemFocus]: toolItemFocus,
  [TEXTURE.tooltip]: tooltip,
} as const

export const SPRITESHEETS = {
  [TEXTURE.peterProfile]: { url: peterProfileSheet, frameWidth: 128, frameHeight: 128 },
  [TEXTURE.steam]: { url: steamSheet, frameWidth: 32, frameHeight: 32 },
} as const
