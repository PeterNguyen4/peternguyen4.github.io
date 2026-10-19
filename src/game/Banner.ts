import Phaser from 'phaser'
import { TEXTURE } from './assets'
import { BANNER_FRAMES as F } from './config/coffee'
import { FONT, PALETTE } from './config/popup'

const FRAME_KEYS = ['left', 'mid', 'right'] as const

function ensureBannerFrames(scene: Phaser.Scene) {
  const tex = scene.textures.get(TEXTURE.banner)
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
  size: string,
  lineSpacing: number,
  scale: number,
  padX: number,
  minWidth = 0,
) {
  ensureBannerFrames(scene)
  const text = scene.add
    .text(cx, top + F.textCenterY * scale, label, {
      fontFamily: FONT,
      fontSize: size,
      color: PALETTE.text,
      align: 'center',
      lineSpacing,
    })
    .setOrigin(0.5)
  const midW = Math.max(
    F.minMid,
    Math.ceil(text.width / scale) - F.textInset + 2 * padX,
    Math.ceil(minWidth / scale) - F.left[2] - F.right[2],
  )
  const x0 = cx - ((F.left[2] + midW + F.right[2]) * scale) / 2
  const add = (frame: string, nativeX: number) =>
    scene.add.image(x0 + nativeX * scale, top, TEXTURE.banner, frame).setOrigin(0)

  const mid = add('mid', F.left[2]).setScale(midW * scale, scale)
  const left = add('left', 0).setScale(scale)
  const right = add('right', F.left[2] + midW).setScale(scale)
  return {
    objects: [mid, left, right, text],
    overlapY: top + F.overlapY * scale,
  }
}
