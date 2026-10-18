import Phaser from 'phaser'
import { TEXTURE } from './assets'
import {
  STAR_COUNT,
  STAR_EMPTY_FADE as EMPTY_FADE,
  STAR_EMPTY_FADE_TO as EMPTY_FADE_TO,
  STAR_EMPTY_KEY as EMPTY_KEY,
  STAR_GAP,
  STAR_SCALE,
} from './config/rating'

function ensureEmptyStarTexture(scene: Phaser.Scene) {
  if (scene.textures.exists(EMPTY_KEY)) return
  const src = scene.textures.get(TEXTURE.star).getSourceImage() as HTMLImageElement
  const canvas = scene.textures.createCanvas(EMPTY_KEY, src.width, src.height)
  if (!canvas) return
  const ctx = canvas.getContext()
  ctx.drawImage(src, 0, 0)
  const img = ctx.getImageData(0, 0, src.width, src.height)
  for (let i = 0; i < img.data.length; i += 4) {
    for (let c = 0; c < 3; c++) img.data[i + c] += (EMPTY_FADE_TO[c] - img.data[i + c]) * EMPTY_FADE
  }
  ctx.putImageData(img, 0, 0)
  canvas.refresh()
}

export function addStars(scene: Phaser.Scene, x: number, y: number, rating: number) {
  ensureEmptyStarTexture(scene)
  const { width, height } = scene.textures.get(TEXTURE.star).getSourceImage()
  const step = width * STAR_SCALE + STAR_GAP
  const objects: Phaser.GameObjects.Image[] = []
  for (let i = 0; i < STAR_COUNT; i++) {
    const sx = x + i * step
    objects.push(scene.add.image(sx, y, EMPTY_KEY).setOrigin(0, 0.5).setScale(STAR_SCALE))
    const fill = Phaser.Math.Clamp(rating - i, 0, 1)
    const cropWidth = Math.round(width * fill)
    if (cropWidth > 0) {
      objects.push(
        scene.add.image(sx, y, TEXTURE.star).setOrigin(0, 0.5).setScale(STAR_SCALE).setCrop(0, 0, cropWidth, height),
      )
    }
  }
  return objects
}
