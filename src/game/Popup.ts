import Phaser from 'phaser'
import { AUDIO, TEXTURE } from './assets'
import {
  CLOSE_OFFSET,
  PALETTE,
  PANEL_SLICE,
  POPUP_BODY_LINE_SPACING,
  POPUP_BOTTOM_PAD,
  POPUP_CONTENT_GAP,
  POPUP_DEPTH,
  POPUP_DIM_ALPHA,
  POPUP_MARGIN,
  POPUP_SFX_VOLUME,
  POPUP_TITLE_TOP,
  POPUP_WRAP_PAD,
} from './config/popup'
import { playHoverSound } from './effects/hover'
import { createPressHold } from './PressHold'
import { addText } from './Text'

export interface PopupOptions {
  title: string
  body?: string
  content?: (container: Phaser.GameObjects.Container, area: Phaser.Geom.Rectangle, compact: boolean) => number | void
  width: number
  height: number
  onClose?: () => void
}

function playSfx(scene: Phaser.Scene, key: string) {
  if (scene.cache.audio.exists(key)) scene.sound.play(key, { volume: POPUP_SFX_VOLUME })
}

export function showPopup(scene: Phaser.Scene, opts: PopupOptions) {
  playSfx(scene, AUDIO.popupOpen)
  let current = buildPopup(scene, opts, () => {
    scene.scale.off(Phaser.Scale.Events.RESIZE, rebuild)
    opts.onClose?.()
  })
  const rebuild = () => {
    current.destroy()
    current = buildPopup(scene, opts, () => {
      scene.scale.off(Phaser.Scale.Events.RESIZE, rebuild)
      opts.onClose?.()
    })
  }
  scene.scale.on(Phaser.Scale.Events.RESIZE, rebuild)
  return () => current.dismiss()
}

function buildPopup(scene: Phaser.Scene, opts: PopupOptions, onClose: () => void) {
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
  let pressed = false
  let closing = false
  const hold = createPressHold(scene)
  const close = scene.add
    .image(
      left + width + CLOSE_OFFSET.x,
      top + CLOSE_OFFSET.y,
      TEXTURE.closeButton,
    )
    .setOrigin(0)
    .setInteractive({ useHandCursor: true })
    .on('pointerover', () => {
      close.setTexture(TEXTURE.closeButtonHover)
      playHoverSound(scene)
    })
    .on('pointerout', () => {
      if (closing) return
      pressed = false
      close.setTexture(TEXTURE.closeButton)
    })
    .on('pointerdown', () => {
      pressed = true
      hold.down()
      close.setTexture(TEXTURE.closeButtonClick)
    })
    .on('pointerup', () => {
      if (!pressed) return
      closing = true
      hold.release(dismiss)
    })
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
    playSfx(scene, AUDIO.popupClose)
    container.destroy()
    onClose()
  }
  return { dismiss, destroy: () => container.destroy() }
}
