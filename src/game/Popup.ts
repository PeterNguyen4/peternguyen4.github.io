import Phaser from 'phaser'
import { TEXTURE } from './assets'

const FONT = '"Press Start 2P", monospace'
const PANEL_SLICE = 10
const CLOSE_PLATE = { x0: 4, y0: 4, x1: 10, y1: 10 }
const CLOSE_HOVER_MULT = [0.88, 0.82, 0.72]
const CLOSE_HOVER_KEY = 'close-button-hover'
const CLOSE_OFFSET = { x: -17, y: 3 }
const PANEL_SCALE = 4
const DEPTH = 100

export const PALETTE = {
  outline: '#5a3d22',
  edge: '#d9bf8c',
  center: '#f1e2bd',
  text: '#4a3320',
} as const

export interface PopupOptions {
  title: string
  body?: string
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
  const container = scene.add.container(0, 0).setDepth(DEPTH)

  const dim = scene.add.rectangle(0, 0, W, H, 0x000000, 0.5).setOrigin(0).setInteractive()
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
  const wrap = opts.width - 2 * PANEL_SLICE * PANEL_SCALE - 32
  const title = scene.add
    .text(W / 2, H / 2 - (opts.body ? opts.height / 2 - 80 : 0), opts.title, {
      fontFamily: FONT,
      fontSize: '32px',
      color: PALETTE.text,
      align: 'center',
      wordWrap: { width: wrap },
    })
    .setOrigin(0.5, opts.body ? 0 : 0.5)
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

  if (opts.body) {
    const body = scene.add
      .text(W / 2 - wrap / 2, title.y + title.height + 40, opts.body, {
        fontFamily: FONT,
        fontSize: '20px',
        color: PALETTE.text,
        lineSpacing: 14,
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
