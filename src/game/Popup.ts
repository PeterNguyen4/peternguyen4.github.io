import Phaser from 'phaser'
import { TEXTURE } from './assets'
import {
  CLOSE_HOVER_KEY,
  CLOSE_HOVER_MULT,
  CLOSE_OFFSET,
  CLOSE_PLATE,
  FONT,
  PALETTE,
  PANEL_SCALE,
  PANEL_SLICE,
  POPUP_BODY_LINE_SPACING,
  POPUP_BODY_SIZE,
  POPUP_CONTENT_GAP,
  POPUP_DEPTH,
  POPUP_DIM_ALPHA,
  POPUP_TITLE_SIZE,
  POPUP_TITLE_TOP,
  POPUP_WRAP_PAD,
} from './config/popup'

export interface PopupOptions {
  title: string
  body?: string
  content?: (container: Phaser.GameObjects.Container, area: Phaser.Geom.Rectangle) => void
  width: number
  height: number
  autoDismissMs?: number
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
  const container = scene.add.container(0, 0).setDepth(POPUP_DEPTH)
  const topAligned = !!(opts.body || opts.content)

  const dim = scene.add.rectangle(0, 0, W, H, 0x000000, POPUP_DIM_ALPHA).setOrigin(0).setInteractive()
  const panel = scene.add
    .nineslice(
      W / 2,
      H / 2,
      TEXTURE.panel,
      undefined,
      opts.width / PANEL_SCALE,
      opts.height / PANEL_SCALE,
      PANEL_SLICE,
      PANEL_SLICE,
      PANEL_SLICE,
      PANEL_SLICE,
    )
    .setScale(PANEL_SCALE)
  const wrap = opts.width - 2 * PANEL_SLICE * PANEL_SCALE - POPUP_WRAP_PAD
  const title = scene.add
    .text(W / 2, H / 2 - (topAligned ? opts.height / 2 - POPUP_TITLE_TOP : 0), opts.title, {
      fontFamily: FONT,
      fontSize: POPUP_TITLE_SIZE,
      color: PALETTE.text,
      align: 'center',
      wordWrap: { width: wrap },
    })
    .setOrigin(0.5, topAligned ? 0 : 0.5)
  const close = scene.add
    .image(
      W / 2 + opts.width / 2 + CLOSE_OFFSET.x * PANEL_SCALE,
      H / 2 - opts.height / 2 + CLOSE_OFFSET.y * PANEL_SCALE,
      TEXTURE.closeButton,
    )
    .setOrigin(0)
    .setScale(PANEL_SCALE)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => close.setTexture(CLOSE_HOVER_KEY))
    .on('pointerout', () => close.setTexture(TEXTURE.closeButton))
  container.add([dim, panel, title, close])
  opts.content?.(
    container,
    new Phaser.Geom.Rectangle(
      W / 2 - opts.width / 2,
      title.y + title.height + POPUP_CONTENT_GAP,
      opts.width,
      H / 2 + opts.height / 2 - (title.y + title.height + POPUP_CONTENT_GAP),
    ),
  )

  if (opts.body) {
    const body = scene.add
      .text(W / 2 - wrap / 2, title.y + title.height + POPUP_CONTENT_GAP, opts.body, {
        fontFamily: FONT,
        fontSize: POPUP_BODY_SIZE,
        color: PALETTE.text,
        lineSpacing: POPUP_BODY_LINE_SPACING,
        wordWrap: { width: wrap },
      })
      .setOrigin(0)
    container.add(body)
  }

  let closed = false
  const dismiss = () => {
    if (closed) return
    closed = true
    timer?.remove()
    container.destroy()
    opts.onClose?.()
  }
  const timer = opts.autoDismissMs ? scene.time.delayedCall(opts.autoDismissMs, dismiss) : undefined
  dim.once('pointerdown', dismiss)
  close.once('pointerdown', dismiss)
  return dismiss
}
