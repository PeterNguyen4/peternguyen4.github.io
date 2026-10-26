import Phaser from 'phaser'
import { TEXTURE } from './assets'
import {
  CLOSE_HOVER_KEY,
  CLOSE_HOVER_MULT,
  CLOSE_OFFSET,
  CLOSE_PLATE,
  PALETTE,
  PANEL_SLICE,
  POPUP_BODY_LINE_SPACING,
  POPUP_BOTTOM_PAD,
  POPUP_CONTENT_GAP,
  POPUP_DEPTH,
  POPUP_DIM_ALPHA,
  POPUP_MARGIN,
  POPUP_TITLE_TOP,
  POPUP_WRAP_PAD,
} from './config/popup'
import { addText } from './Text'

export interface PopupOptions {
  title: string
  body?: string
  content?: (container: Phaser.GameObjects.Container, area: Phaser.Geom.Rectangle, compact: boolean) => number | void
  width: number
  height: number
  onClose?: () => void
}

function ensureCloseHoverTexture(scene: Phaser.Scene) {
  if (scene.textures.exists(CLOSE_HOVER_KEY)) return
  const src = scene.textures.get(TEXTURE.closeButton).getSourceImage() as HTMLImageElement
  const canvas = scene.textures.createCanvas(CLOSE_HOVER_KEY, src.width, src.height)
  if (!canvas) return
  const ctx = canvas.getContext()
  ctx.drawImage(src, 0, 0)
  const { x0, y0, x1, y1 } = CLOSE_PLATE
  const plate = ctx.getImageData(x0, y0, x1 - x0 + 1, y1 - y0 + 1)
  for (let i = 0; i < plate.data.length; i += 4) {
    for (let c = 0; c < 3; c++) plate.data[i + c] *= CLOSE_HOVER_MULT[c]
  }
  ctx.putImageData(plate, x0, y0)
  canvas.refresh()
}

export function showPopup(scene: Phaser.Scene, opts: PopupOptions) {
  ensureCloseHoverTexture(scene)
  const { width: W, height: H } = scene.scale
  const width = Math.min(opts.width, W - 2 * POPUP_MARGIN)
  const compact = width < opts.width
  const left = Math.round((W - width) / 2)
  const top = Math.round((H - opts.height) / 2)
  const container = scene.add.container(0, 0).setDepth(POPUP_DEPTH)
  const box = scene.add.container(0, 0)
  const topAligned = !!(opts.body || opts.content)

  const dim = scene.add.rectangle(0, 0, W, H, 0x000000, POPUP_DIM_ALPHA).setOrigin(0).setInteractive()
  const panel = scene.add
    .nineslice(
      left,
      top,
      TEXTURE.panel,
      undefined,
      width,
      opts.height,
      PANEL_SLICE,
      PANEL_SLICE,
      PANEL_SLICE,
      PANEL_SLICE,
    )
    .setOrigin(0)
  const wrap = width - 2 * PANEL_SLICE - POPUP_WRAP_PAD
  const title = addText(scene, left + width / 2, topAligned ? top + POPUP_TITLE_TOP : top + opts.height / 2, opts.title, {
      color: PALETTE.text,
      align: 'center',
      wordWrap: { width: wrap },
    })
    .setOrigin(0.5, topAligned ? 0 : 0.5)
  const close = scene.add
    .image(
      left + width + CLOSE_OFFSET.x,
      top + CLOSE_OFFSET.y,
      TEXTURE.closeButton,
    )
    .setOrigin(0)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => close.setTexture(CLOSE_HOVER_KEY))
    .on('pointerout', () => close.setTexture(TEXTURE.closeButton))
  box.add([panel, title, close])
  container.add([dim, box])
  const bottom = opts.content?.(
    box,
    new Phaser.Geom.Rectangle(
      left,
      title.y + title.height + POPUP_CONTENT_GAP,
      width,
      top + opts.height - (title.y + title.height + POPUP_CONTENT_GAP),
    ),
    compact,
  )
  if (compact && typeof bottom === 'number') {
    const height = Math.min(H - 2 * POPUP_MARGIN, Math.ceil(bottom - top + POPUP_BOTTOM_PAD))
    panel.setSize(width, height)
    box.setY(Math.round((H - height) / 2) - top)
  }

  if (opts.body) {
    const body = addText(scene, left + width / 2 - wrap / 2, title.y + title.height + POPUP_CONTENT_GAP, opts.body, {
        color: PALETTE.text,
        lineSpacing: POPUP_BODY_LINE_SPACING,
        wordWrap: { width: wrap },
      })
      .setOrigin(0)
    box.add(body)
  }

  let closed = false
  const dismiss = () => {
    if (closed) return
    closed = true
    container.destroy()
    opts.onClose?.()
  }
  close.once('pointerdown', dismiss)
  return dismiss
}
