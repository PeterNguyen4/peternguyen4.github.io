import Phaser from 'phaser'
import { AUDIO, TEXTURE } from './assets'
import {
  DIALOG_ARROW,
  DIALOG_BLIP_VOLUME,
  DIALOG_PANEL,
  DIALOG_BOTTOM_MARGIN,
  DIALOG_HEIGHT,
  DIALOG_LABEL,
  DIALOG_LINE_GAP,
  DIALOG_NAME,
  DIALOG_PORTRAIT,
  DIALOG_TEXT_COLOR,
  DIALOG_TEXT_PAD,
  DIALOG_TYPE_MS,
  DIALOG_WIDTH,
} from './config/dialog'
import { POPUP_DEPTH } from './config/popup'
import { addText, inkWidth } from './Text'

export interface DialogOptions {
  parts: [string, string?][]
  speaker?: string
  portrait?: string
  typewriter?: boolean
  bottom?: number
  onClose?: () => void
}

function createLabel(scene: Phaser.Scene, speaker: string, left: number, top: number) {
  const { slice, height, padX, textY, x, overlap } = DIALOG_LABEL
  const labelWidth = inkWidth(speaker) + padX * 2
  const labelTop = top - height + overlap
  const bg = scene.add
    .nineslice(left + x, labelTop, TEXTURE.dialogueLabel, undefined, labelWidth, height, slice, slice, slice, slice)
    .setOrigin(0)
  const text = addText(scene, left + x + padX, labelTop + textY, speaker, { color: DIALOG_NAME.color }).setOrigin(0)
  return [bg, text]
}

export function showDialog(scene: Phaser.Scene, opts: DialogOptions) {
  const { width: W, height: H } = scene.scale
  const width = Math.round(W * DIALOG_WIDTH)
  const left = Math.round((W - width) / 2)
  const top = (opts.bottom ?? H) - DIALOG_BOTTOM_MARGIN - DIALOG_HEIGHT
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

  const portrait = opts.portrait
    ? scene.add
        .image(left + width - DIALOG_PORTRAIT.right, top + DIALOG_HEIGHT - DIALOG_PORTRAIT.bottom, opts.portrait)
        .setOrigin(1, 1)
    : undefined
  const inset = portrait ? portrait.width + DIALOG_PORTRAIT.right : 0

  const labelParts = opts.speaker ? createLabel(scene, opts.speaker, left, top) : []

  const startX = left + DIALOG_TEXT_PAD.x
  const maxX = left + width - inset - DIALOG_ARROW.right - DIALOG_TEXT_PAD.x / 2
  let textX = startX
  let textY = top + DIALOG_TEXT_PAD.y
  let atWordStart = true
  const tokens = opts.parts.flatMap(([str, color]) =>
    (str.match(/\S+\s*|\s+/g) ?? []).map((token) => {
      const t = addText(scene, 0, 0, token, { color: color ?? DIALOG_TEXT_COLOR }).setOrigin(0)
      if (atWordStart && textX > startX && textX + inkWidth(token) > maxX) {
        textX = startX
        textY += t.height + DIALOG_LINE_GAP
      }
      t.setPosition(textX, textY)
      textX += t.width
      atWordStart = /\s$/.test(token)
      t.setText('').setVisible(false)
      return { text: t, full: token }
    }),
  )
  const chars = tokens.flatMap(({ full }, token) => [...full].map((ch) => ({ token, ch })))

  const { right, bottom, bobMs } = DIALOG_ARROW
  const ax = left + width - inset - right
  const ay = top + DIALOG_HEIGHT - bottom
  const arrow = scene.add.image(ax, ay, TEXTURE.termination).setVisible(false)
  let raised = false
  const bobTimer = scene.time.addEvent({
    delay: bobMs,
    loop: true,
    callback: () => {
      raised = !raised
      arrow.setY(raised ? ay - 1 : ay)
    },
  })

  const blip = opts.typewriter && scene.cache.audio.exists(AUDIO.dialogue)
    ? scene.sound.add(AUDIO.dialogue, { volume: DIALOG_BLIP_VOLUME })
    : undefined

  let shown = 0
  let typer: Phaser.Time.TimerEvent | undefined
  const reveal = (count: number) => {
    shown = count
    tokens.forEach(({ text, full }, i) => {
      const n = chars.filter((c, k) => c.token === i && k < count).length
      text.setVisible(n > 0)
      if (n > 0 && text.text !== full.slice(0, n)) text.setText(full.slice(0, n))
    })
    if (shown >= chars.length) arrow.setVisible(true)
  }
  const typeNext = () => {
    let next = shown + 1
    while (next < chars.length && /\s/.test(chars[next - 1].ch)) next++
    reveal(next)
    if (shown === 1 || /\s/.test(chars[shown - 2].ch)) blip?.play()
    if (shown >= chars.length) return
    typer = scene.time.delayedCall(chars[shown - 1].ch === '.' ? DIALOG_TYPE_MS.dot : DIALOG_TYPE_MS.char, typeNext)
  }
  if (opts.typewriter) typeNext()
  else reveal(chars.length)

  container.add([catcher, panel, ...labelParts,...tokens.map((t) => t.text), ...(portrait ? [portrait] : []), arrow])
  catcher.on('pointerdown', () => {
    if (shown < chars.length) {
      typer?.remove()
      blip?.stop()
      reveal(chars.length)
      return
    }
    bobTimer.remove()
    blip?.destroy()
    container.destroy()
    opts.onClose?.()
  })
}
