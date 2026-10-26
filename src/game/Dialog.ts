import Phaser from 'phaser'
import { TEXTURE } from './assets'
import {
  DIALOG_ARROW,
  DIALOG_PANEL,
  DIALOG_BOTTOM_MARGIN,
  DIALOG_HEIGHT,
  DIALOG_LINE_GAP,
  DIALOG_TEXT_COLOR,
  DIALOG_TEXT_PAD,
  DIALOG_WIDTH,
} from './config/dialog'
import { POPUP_DEPTH } from './config/popup'
import { addText, inkWidth } from './Text'

export interface DialogOptions {
  parts: [string, string?][]
  onClose?: () => void
}

export function showDialog(scene: Phaser.Scene, opts: DialogOptions) {
  const { width: W, height: H } = scene.scale
  const width = Math.round(W * DIALOG_WIDTH)
  const left = Math.round((W - width) / 2)
  const top = H - DIALOG_BOTTOM_MARGIN - DIALOG_HEIGHT
  const container = scene.add.container(0, 0).setDepth(POPUP_DEPTH)

  const catcher = scene.add.rectangle(0, 0, W, H, 0x000000, 0).setOrigin(0).setInteractive()
  const { slice } = DIALOG_PANEL
  const panel = scene.add
    .nineslice(
      left,
      top,
      TEXTURE.dialogue,
      undefined,
      width,
      DIALOG_HEIGHT,
      slice,
      slice,
      slice,
      slice,
    )
    .setOrigin(0)
  const startX = left + DIALOG_TEXT_PAD.x
  const maxX = left + width - DIALOG_ARROW.right - DIALOG_TEXT_PAD.x / 2
  let textX = startX
  let textY = top + DIALOG_TEXT_PAD.y
  let atWordStart = true
  const texts = opts.parts.flatMap(([str, color]) =>
    (str.match(/\S+\s*|\s+/g) ?? []).map((token) => {
      const t = addText(scene, 0, 0, token, { color: color ?? DIALOG_TEXT_COLOR }).setOrigin(0)
      if (atWordStart && textX > startX && textX + inkWidth(token) > maxX) {
        textX = startX
        textY += t.height + DIALOG_LINE_GAP
      }
      t.setPosition(textX, textY)
      textX += t.width
      atWordStart = /\s$/.test(token)
      return t
    }),
  )

  const { right, bottom, bobMs } = DIALOG_ARROW
  const ax = left + width - right
  const ay = top + DIALOG_HEIGHT - bottom
  const arrow = scene.add.image(ax, ay, TEXTURE.termination)
  let raised = false
  const bobTimer = scene.time.addEvent({
    delay: bobMs,
    loop: true,
    callback: () => {
      raised = !raised
      arrow.setY(raised ? ay - 1 : ay)
    },
  })

  container.add([catcher, panel, ...texts, arrow])
  catcher.once('pointerdown', () => {
    bobTimer.remove()
    container.destroy()
    opts.onClose?.()
  })
}
