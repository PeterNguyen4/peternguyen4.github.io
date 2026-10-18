import Phaser from 'phaser'
import {
  BAND_MIX,
  BAND_WIDTH,
  FILL_MIX,
  HOVER_BAND,
  HOVER_FILL,
  HOVER_OUTLINE,
  HOVER_SUFFIX,
  OUTLINE_LUMA,
} from '../config/hover'

export function makeHoverable(scene: Phaser.Scene, image: Phaser.GameObjects.Image, textureKey: string) {
  const hoverKey = `${textureKey}${HOVER_SUFFIX}`
  const mask = buildHoverTexture(scene, textureKey, hoverKey)
  const { width, height } = image
  image.setInteractive(
    new Phaser.Geom.Rectangle(0, 0, width, height),
    (_area: Phaser.Geom.Rectangle, x: number, y: number) =>
      x >= 0 && y >= 0 && x < width && y < height && mask[(y | 0) * width + (x | 0)] === 1,
  )
  image.input!.cursor = 'pointer'
  image.on('pointerover', () => image.setTexture(hoverKey))
  image.on('pointerout', () => image.setTexture(textureKey))
}

function buildHoverTexture(scene: Phaser.Scene, textureKey: string, hoverKey: string) {
  const src = scene.textures.get(textureKey).getSourceImage() as HTMLImageElement
  const mask = new Uint8Array(src.width * src.height)
  const canvas = scene.textures.createCanvas(hoverKey, src.width, src.height)
  if (!canvas) return mask
  const ctx = canvas.getContext()
  ctx.drawImage(src, 0, 0)
  const image = ctx.getImageData(0, 0, src.width, src.height)
  const px = image.data
  const { width: w, height: h } = src
  const isOutline = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) {
    if (px[i * 4 + 3] === 0) continue
    mask[i] = 1
    if ((px[i * 4] + px[i * 4 + 1] + px[i * 4 + 2]) / 3 < OUTLINE_LUMA) isOutline[i] = 1
  }
  const nearOutline = (x: number, y: number) => {
    for (let dy = -BAND_WIDTH; dy <= BAND_WIDTH; dy++) {
      for (let dx = -BAND_WIDTH; dx <= BAND_WIDTH; dx++) {
        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && ny >= 0 && nx < w && ny < h && isOutline[ny * w + nx]) return true
      }
    }
    return false
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const m = y * w + x
      if (!mask[m]) continue
      const i = m * 4
      if (isOutline[m]) {
        for (let c = 0; c < 3; c++) px[i + c] = HOVER_OUTLINE[c]
      } else if (nearOutline(x, y)) {
        for (let c = 0; c < 3; c++) px[i + c] += (HOVER_BAND[c] - px[i + c]) * BAND_MIX
      } else {
        for (let c = 0; c < 3; c++) px[i + c] += (HOVER_FILL[c] - px[i + c]) * FILL_MIX
      }
    }
  }
  ctx.putImageData(image, 0, 0)
  canvas.refresh()
  return mask
}
