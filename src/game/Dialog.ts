import Phaser from 'phaser'
import { TEXTURE } from './assets'
import {
  DIALOG_ARROW,
  DIALOG_PANEL,
  DIALOG_BOTTOM_MARGIN,
  DIALOG_HEIGHT,
  DIALOG_TEXT_COLOR,
  DIALOG_TEXT_PAD,
  DIALOG_WIDTH,
} from './config/dialog'
import { POPUP_DEPTH } from './config/popup'
import { addText } from './Text'

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
  let textX = left + DIALOG_TEXT_PAD.x
  const texts = opts.parts.map(([str, color]) => {
    const t = addText(scene, textX, top + DIALOG_TEXT_PAD.y, str, {
        color: color ?? DIALOG_TEXT_COLOR,
      })
      .setOrigin(0)
    textX += t.width
    return t
  })

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
