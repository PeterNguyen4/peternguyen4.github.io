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
  portraitLift?: number
  stackPortraitOnMobile?: boolean
  dim?: number
  typewriter?: boolean
  bottom?: number | (() => number)
  onClose?: () => void
}

function createLabel(scene: Phaser.Scene, speaker: string) {
  const { slice, height, padX, textY, x, overlap } = DIALOG_LABEL
  const labelWidth = inkWidth(speaker) + padX * 2
  const bg = scene.add
    .nineslice(0, 0, TEXTURE.dialogueLabel, undefined, labelWidth, height, slice, slice, slice, slice)
    .setOrigin(0)
  const text = addText(scene, 0, 0, speaker, { color: DIALOG_NAME.color }).setOrigin(0)
  const place = (left: number, top: number) => {
    const labelTop = top - height + overlap
    bg.setPosition(left + x, labelTop)
    text.setPosition(left + x + padX, labelTop + textY)
  }
  return { parts: [bg, text], place }
}

export function showDialog(scene: Phaser.Scene, opts: DialogOptions) {
  const container = scene.add.container(0, 0).setDepth(POPUP_DEPTH)
  const catcher = scene.add.rectangle(0, 0, 1, 1, 0x000000, opts.dim ?? 0).setOrigin(0).setInteractive()
  const portrait = opts.portrait ? scene.add.image(0, 0, opts.portrait).setOrigin(1, 1) : undefined
  const { slice } = DIALOG_PANEL
  const panel = scene.add.nineslice(0, 0, TEXTURE.dialogue, undefined, 1, 1, slice, slice, slice, slice).setOrigin(0)
  const label = opts.speaker ? createLabel(scene, opts.speaker) : undefined
  const arrow = scene.add.image(0, 0, TEXTURE.termination).setVisible(false)

  const tokens = opts.parts.flatMap(([str, color]) =>
    (str.match(/\S+\s*|\s+/g) ?? []).map((token) => {
      const text = addText(scene, 0, 0, token, { color: color ?? DIALOG_TEXT_COLOR }).setOrigin(0)
      const metrics = { w: text.width, h: text.height, ink: inkWidth(token) }
      text.setText('').setVisible(false)
      return { text, full: token, ...metrics }
    }),
  )
  const chars = tokens.flatMap(({ full }, token) => [...full].map((ch) => ({ token, ch })))

  let ay = 0
  let raised = false
  const layout = () => {
    const { width: W, height: H } = scene.scale
    const bottomEdge = typeof opts.bottom === 'function' ? opts.bottom() : opts.bottom ?? H
    const width = Math.round(W * DIALOG_WIDTH)
    const left = Math.round((W - width) / 2)
    const stacked = !!portrait && !!opts.stackPortraitOnMobile && W < H && !scene.sys.game.device.os.desktop
    const inset = portrait && !stacked ? portrait.width + DIALOG_PORTRAIT.right : 0

    const startX = left + DIALOG_TEXT_PAD.x
    const maxX = left + width - inset - DIALOG_ARROW.right - DIALOG_TEXT_PAD.x / 2
    let x = startX
    let y = DIALOG_TEXT_PAD.y
    let textBottom = y
    let atWordStart = true
    const rel = tokens.map((t) => {
      if (atWordStart && x > startX && x + t.ink > maxX) {
        x = startX
        y += t.h + DIALOG_LINE_GAP
      }
      const pos = { x, y }
      textBottom = Math.max(textBottom, y + t.h)
      x += t.w
      atWordStart = /\s$/.test(t.full)
      return pos
    })
    const panelHeight = Math.max(DIALOG_HEIGHT, textBottom + DIALOG_TEXT_PAD.y)
    const top = bottomEdge - DIALOG_BOTTOM_MARGIN - panelHeight

    catcher.setSize(W, H)
    catcher.input?.hitArea.setSize(W, H)
    panel.setPosition(left, top).setSize(width, panelHeight)
    tokens.forEach(({ text }, i) => text.setPosition(rel[i].x, top + rel[i].y))
    label?.place(left, top)
    portrait?.setPosition(
      left + width - DIALOG_PORTRAIT.right,
      stacked ? top : top + panelHeight - DIALOG_PORTRAIT.bottom - (opts.portraitLift ?? 0),
    )
    if (portrait) {
      if (stacked) container.moveTo(portrait, container.getIndex(panel))
      else container.bringToTop(portrait)
      container.bringToTop(arrow)
    }
    ay = top + panelHeight - DIALOG_ARROW.bottom
    arrow.setPosition(left + width - inset - DIALOG_ARROW.right, raised ? ay - 1 : ay)
  }

  container.add([
    catcher,
    panel,
    ...(label?.parts ?? []),
    ...tokens.map((t) => t.text),
    ...(portrait ? [portrait] : []),
    arrow,
  ])
  layout()
  scene.scale.on(Phaser.Scale.Events.RESIZE, layout)
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.scale.off(Phaser.Scale.Events.RESIZE, layout))

  const bobTimer = scene.time.addEvent({
    delay: DIALOG_ARROW.bobMs,
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

  catcher.on('pointerdown', () => {
    if (shown < chars.length) {
      typer?.remove()
      blip?.stop()
      reveal(chars.length)
      return
    }
    scene.scale.off(Phaser.Scale.Events.RESIZE, layout)
    bobTimer.remove()
    blip?.destroy()
    container.destroy()
    opts.onClose?.()
  })
}
