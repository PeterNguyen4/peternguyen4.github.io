import background from '../assets/backgrounds/background.png'
import arrow from '../assets/icons/arrow-up-right.png'
import coffee from '../assets/icons/coffee.png'
import coffeeBeanBullet from '../assets/ui/coffee-bean-bullet.png'
import energy from '../assets/icons/energy.png'
import erwix from '../assets/icons/erwix.png'
import github from '../assets/icons/github.png'
import linkedin from '../assets/icons/linkedin.png'
import night from '../assets/icons/night.png'
import postgresql from '../assets/icons/postgresql.png'
import profileIcon from '../assets/icons/profile.png'
import python from '../assets/icons/python.png'
import typescript from '../assets/icons/typescript.png'
import buttonBase from '../assets/ui/button-base.png'
import buttonHover from '../assets/ui/button-hover.png'
import buttonClick from '../assets/ui/button-click.png'
import inset from '../assets/ui/inset.png'
import banner from '../assets/ui/banner.png'
import dialogue from '../assets/ui/dialogue.png'
import termination from '../assets/ui/termination.png'
import stats from '../assets/ui/stats.png'
import closeButton from '../assets/ui/nine-slice-close-btn.png'
import panel from '../assets/ui/nine-slice.png'
import toolItemFocus from '../assets/ui/tool-item-focus.png'
import star from '../assets/icons/star.png'
import todo from '../assets/icons/todo.png'
import toolItem from '../assets/ui/tool-item.png'
import tooltip from '../assets/ui/tooltip.png'
import coffeeMachine from '../assets/props/coffee-machine.png'
import coffeeTub from '../assets/props/coffee-tub.png'
import counter from '../assets/props/counter.png'
import mug from '../assets/props/mug.png'
import papers from '../assets/props/papers.png'
import peterProfileSheet from '../assets/sprites/peter-profile-spritesheet.png'
import steamSheet from '../assets/sprites/coffee-steam-spritesheet.png'

export const TEXTURE = {
  arrow: 'arrow',
  banner: 'banner',
  button: 'button',
  buttonHover: 'button-hover',
  buttonClick: 'button-down',
  dialogue: 'dialogue',
  background: 'background',
  closeButton: 'close-button',
  coffee: 'coffee',
  coffeeBean: 'coffee-bean',
  coffeeMachine: 'coffee-machine',
  coffeeTub: 'coffee-tub',
  counter: 'counter',
  energy: 'energy',
  erwix: 'erwix',
  github: 'github',
  inset: 'inset',
  linkedin: 'linkedin',
  mug: 'mug',
  night: 'night',
  panel: 'panel',
  postgresql: 'postgresql',
  profileIcon: 'profile-icon',
  papers: 'papers',
  peterProfile: 'peter-profile',
  python: 'python',
  star: 'star',
  stats: 'stats',
  steam: 'steam',
  termination: 'termination',
  todo: 'todo',
  toolItem: 'tool-item',
  toolItemFocus: 'tool-item-focus',
  tooltip: 'tooltip',
  typescript: 'typescript',
} as const

export const ANIM = {
  handProfile: 'hand-profile',
  steam: 'steam',
} as const

export const IMAGES = {
  [TEXTURE.arrow]: arrow,
  [TEXTURE.banner]: banner,
  [TEXTURE.button]: buttonBase,
  [TEXTURE.buttonHover]: buttonHover,
  [TEXTURE.buttonClick]: buttonClick,
  [TEXTURE.dialogue]: dialogue,
  [TEXTURE.background]: background,
  [TEXTURE.closeButton]: closeButton,
  [TEXTURE.coffee]: coffee,
  [TEXTURE.coffeeBean]: coffeeBeanBullet,
  [TEXTURE.coffeeMachine]: coffeeMachine,
  [TEXTURE.coffeeTub]: coffeeTub,
  [TEXTURE.panel]: panel,
  [TEXTURE.postgresql]: postgresql,
  [TEXTURE.python]: python,
  [TEXTURE.profileIcon]: profileIcon,
  [TEXTURE.counter]: counter,
  [TEXTURE.energy]: energy,
  [TEXTURE.erwix]: erwix,
  [TEXTURE.github]: github,
  [TEXTURE.inset]: inset,
  [TEXTURE.linkedin]: linkedin,
  [TEXTURE.mug]: mug,
  [TEXTURE.night]: night,
  [TEXTURE.papers]: papers,
  [TEXTURE.star]: star,
  [TEXTURE.stats]: stats,
  [TEXTURE.termination]: termination,
  [TEXTURE.todo]: todo,
  [TEXTURE.toolItem]: toolItem,
  [TEXTURE.toolItemFocus]: toolItemFocus,
  [TEXTURE.tooltip]: tooltip,
  [TEXTURE.typescript]: typescript,
} as const

export const SPRITESHEETS = {
  [TEXTURE.peterProfile]: { url: peterProfileSheet, frameWidth: 128, frameHeight: 128 },
  [TEXTURE.steam]: { url: steamSheet, frameWidth: 32, frameHeight: 32 },
} as const
