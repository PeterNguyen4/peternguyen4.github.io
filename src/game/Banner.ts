import Phaser from 'phaser'
import { TEXTURE } from './assets'
import { BANNER_FRAMES, BANNER_TALL_FRAMES } from './config/coffee'
import { PALETTE } from './config/popup'
import { addText } from './Text'

const FRAME_KEYS = ['left', 'mid', 'right'] as const

export type BannerStyle = { texture: string; frames: typeof BANNER_FRAMES | typeof BANNER_TALL_FRAMES }
export const BANNER_STYLE: BannerStyle = { texture: TEXTURE.banner, frames: BANNER_FRAMES }
export const BANNER_TALL_STYLE: BannerStyle = { texture: TEXTURE.bannerTall, frames: BANNER_TALL_FRAMES }

function ensureBannerFrames(scene: Phaser.Scene, { texture, frames: F }: BannerStyle) {
  const tex = scene.textures.get(texture)
  for (const key of FRAME_KEYS) {
    if (tex.has(key)) continue
    const [x, y, w, h] = F[key]
    tex.add(key, 0, x, y, w, h)
  }
}

export function addBanner(
  scene: Phaser.Scene,
  cx: number,
  top: number,
  label: string,
  lineSpacing: number,
  padX: number,
  minWidth = 0,
  style: BannerStyle = BANNER_STYLE,
) {
  const F = style.frames
  ensureBannerFrames(scene, style)
  const text = addText(scene, cx, top + F.textCenterY, label, {
      color: PALETTE.text,
      align: 'center',
      lineSpacing,
    })
    .setOrigin(0.5)
  const midW = Math.max(
    F.minMid,
    Math.ceil(text.width) - F.textInset + 2 * padX,
    Math.ceil(minWidth) - F.left[2] - F.right[2],
  )
  const x0 = Math.round(cx - (F.left[2] + midW + F.right[2]) / 2)
  const add = (frame: string, nativeX: number) =>
    scene.add.image(x0 + nativeX, top, style.texture, frame).setOrigin(0)

  const mid = add('mid', F.left[2]).setScale(midW, 1)
  const left = add('left', 0)
  const right = add('right', F.left[2] + midW)
  return {
    objects: [mid, left, right, text],
    overlapY: top + F.overlapY,
  }
}
