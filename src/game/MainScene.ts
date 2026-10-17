import Phaser from 'phaser'
import { ANIM, IMAGES, SPRITESHEETS, TEXTURE } from './assets'
import { showPopup } from './Popup'

const END_HOLD_MS = 300
const OBTAINED_MS = 2000

const PERSON_POS = { x: 150, y: 110 }
const PROFILE_OFFSET = { x: 0.37, y: -0.05 }
const MUG_OFFSET = { x: 0.5, y: -0.23 }
const STEAM_ANCHOR = { x: -1.5, y: -6 }
const TODO_ORIGIN = { x: 13.5 / 32, y: 19.5 / 32 }
const TODO_NUDGE = { x: 4, y: -4 }
const TODO_CORNER = { papers: { x: 10, y: -20 }, mug: { x: 14, y: -9 } }
const TODO_HOP_MS = 150
const TODO_PAUSE_MS = { min: 2000, max: 4000 }
const STEAM_FPS = 5
const STEAM_ALPHA = 0.5

const TOOL_SLOTS = 4
const TOOLBAR_X = 0.057
const TOOLBAR_TOP = 0.085
const TOOL_GAP = 0.05
const TOOL_SCALE = 0.75
const TOOL_ICONS = [TEXTURE.linkedin, TEXTURE.github]
const TOOL_LABELS = ['LinkedIn', 'GitHub']
const TOOLTIP_DEPTH = 50
const TOOLTIP_CAP = 12
const TOOLTIP_PANEL = { left: 5, centerY: 19.5, minWidth: 22 }
const TOOLTIP_GAP = 1
const TOOLTIP_PAD = 4
const TOOLTIP_FONT = '"Press Start 2P", monospace'
const TOOLTIP_FONT_NATIVE = 4.5
const TOOLTIP_TEXT_COLOR = '#e0e0dd'
const TOOLTIP_TEXT_Y = -1.5
const TOOLTIP_LINE = { color: 0x544444, y: 2.5 }
const TOOLTIP_HOP_MS = 80
const TOOL_POP_MS = 300
const TOOL_SETTLE_MS = 600
const TOOL_OVERSHOOT = 1.25

const BG_SCALE = 1
const COUNTER_DROP = 0.1
const PERSON_HEIGHT = 0.65
const HOVER_SUFFIX = '-hover'
const HOVER_OUTLINE = [0x14, 0x36, 0x66]
const HOVER_BAND = [0x7f, 0xb8, 0xe8]
const HOVER_FILL = [0xd8, 0xf0, 0xff]
const FILL_MIX = 0.2
const BAND_MIX = 0.4
const BAND_WIDTH = 1
const OUTLINE_LUMA = 70

const POP_SHARE = TOOL_POP_MS / (TOOL_POP_MS + TOOL_SETTLE_MS)

function popThenSettle(t: number) {
  if (t < POP_SHARE) {
    const u = t / POP_SHARE
    return TOOL_OVERSHOOT * (1 - (1 - u) * (1 - u))
  }
  const u = (t - POP_SHARE) / (1 - POP_SHARE)
  return TOOL_OVERSHOOT + (1 - TOOL_OVERSHOOT) * Math.sin((u * Math.PI) / 2)
}

export class MainScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.Image
  private counter!: Phaser.GameObjects.Image
  private person!: Phaser.GameObjects.Sprite
  private profiles!: Phaser.GameObjects.Image
  private mug!: Phaser.GameObjects.Image
  private steam!: Phaser.GameObjects.Sprite
  private todos!: { icon: Phaser.GameObjects.Image; baseY: number }[]
  private toolItems: Phaser.GameObjects.Image[] = []
  private toolIcons: Phaser.GameObjects.Image[] = []
  private toolLabels: string[] = [...TOOL_LABELS]
  private tooltip!: Phaser.GameObjects.Container
  private tooltipPanel!: Phaser.GameObjects.NineSlice
  private tooltipLabel!: Phaser.GameObjects.Text
  private tooltipLine!: Phaser.GameObjects.Rectangle
  private tooltipHop: Phaser.Time.TimerEvent[] = []
  private toolScale = 1

  constructor() {
    super('main')
  }

  preload() {
    for (const [key, url] of Object.entries(IMAGES)) this.load.image(key, url)
    for (const [key, { url, ...frame }] of Object.entries(SPRITESHEETS)) {
      this.load.spritesheet(key, url, frame)
    }
  }

  create() {
    this.bg = this.add.image(0, 0, TEXTURE.background).setOrigin(0.5).setDepth(0)
    this.person = this.add.sprite(0, 0, TEXTURE.peterProfile, 0).setOrigin(0.5, 1).setDepth(4)
    this.counter = this.add.image(0, 0, TEXTURE.counter).setOrigin(0.5, 1).setDepth(2)
    this.profiles = this.add.image(0, 0, TEXTURE.papers).setDepth(3)
    this.mug = this.add.image(0, 0, TEXTURE.mug).setDepth(3)
    this.steam = this.add
      .sprite(0, 0, TEXTURE.steam, 0)
      .setOrigin(0.5, 1)
      .setDepth(3)
      .setAlpha(STEAM_ALPHA)
    this.todos = [0, 1].map(() => ({
      icon: this.add.image(0, 0, TEXTURE.todo).setOrigin(TODO_ORIGIN.x, TODO_ORIGIN.y).setDepth(3.5),
      baseY: 0,
    }))
    this.todos.forEach((todo, i) => this.hopTodo(todo, i === 0 ? 0 : TODO_HOP_MS))
    this.toolItems = Array.from({ length: TOOL_SLOTS }, () =>
      this.add.image(0, 0, TEXTURE.toolItem).setDepth(1),
    )
    this.toolItems.forEach((item, i) => {
      item.setInteractive({ cursor: i < TOOL_ICONS.length ? 'pointer' : 'default' })
      item.on('pointerover', () => {
        item.setTexture(TEXTURE.toolItemFocus)
        this.showTooltip(i)
      })
      item.on('pointerout', () => {
        item.setTexture(TEXTURE.toolItem)
        this.hideTooltip()
      })
    })
    this.tooltipPanel = this.add
      .nineslice(0, 0, TEXTURE.tooltip, undefined, 32, 32, TOOLTIP_CAP, TOOLTIP_CAP)
      .setOrigin(0)
    this.tooltipLabel = this.add
      .text(0, 0, '', { fontFamily: TOOLTIP_FONT, color: TOOLTIP_TEXT_COLOR })
      .setOrigin(0.5)
    this.tooltipLine = this.add.rectangle(0, 0, 1, 1, TOOLTIP_LINE.color).setOrigin(0)
    this.tooltip = this.add
      .container(0, 0, [this.tooltipPanel, this.tooltipLabel, this.tooltipLine])
      .setDepth(TOOLTIP_DEPTH)
      .setVisible(false)
    this.toolIcons = TOOL_ICONS.map((key) => this.add.image(0, 0, key).setDepth(1.5))
    this.makeHoverable(this.profiles, TEXTURE.papers)
    this.makeHoverable(this.mug, TEXTURE.mug)
    this.mug.on('pointerdown', () => {
      this.removeTodo(1)
      this.showCoffee()
    })

    this.anims.create({
      key: ANIM.handProfile,
      frames: this.anims.generateFrameNumbers(TEXTURE.peterProfile, { start: 0, end: 11 }),
      frameRate: 8,
    })

    this.anims.create({
      key: ANIM.steam,
      frames: this.anims.generateFrameNumbers(TEXTURE.steam, { start: 0, end: 7 }),
      frameRate: STEAM_FPS,
      repeat: -1,
    })
    this.steam.play(ANIM.steam)

    this.profiles.once('pointerdown', () => {
      this.profiles.setTexture(TEXTURE.papers)
      this.profiles.disableInteractive(true)
      this.removeTodo(0)
      this.person.play(ANIM.handProfile)
    })

    this.person.on(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + ANIM.handProfile, () => {
      this.time.delayedCall(END_HOLD_MS, () => this.showObtained())
    })

    this.layout()
  }

  private hopTodo(todo: { icon: Phaser.GameObjects.Image; baseY: number }, delay: number) {
    this.time.delayedCall(delay, () => {
      if (!todo.icon.active) return
      todo.icon.setY(todo.baseY - this.toolScale)
      this.time.delayedCall(TODO_HOP_MS, () => {
        if (!todo.icon.active) return
        todo.icon.setY(todo.baseY)
        this.hopTodo(todo, Phaser.Math.Between(TODO_PAUSE_MS.min, TODO_PAUSE_MS.max))
      })
    })
  }

  private removeTodo(i: number) {
    const { icon } = this.todos[i]
    if (icon.active) icon.destroy()
  }

  private showTooltip(i: number) {
    const label = this.toolLabels[i]
    const slot = this.toolItems[i]
    if (!label || !this.toolIcons[i]) return
    const ts = this.toolScale

    this.tooltipLabel.setFontSize(Math.round(ts * TOOLTIP_FONT_NATIVE)).setText(label)
    const panelW = Math.max(TOOLTIP_PANEL.minWidth, Math.ceil(this.tooltipLabel.width / ts) + 2 * TOOLTIP_PAD)

    this.tooltipPanel
      .setSize(panelW + 2 * TOOLTIP_PANEL.left, 32)
      .setScale(ts)
      .setPosition(-TOOLTIP_PANEL.left * ts, -TOOLTIP_PANEL.centerY * ts)
    this.tooltipLabel.setPosition((panelW / 2) * ts, TOOLTIP_TEXT_Y * ts)
    const lineW = this.tooltipLabel.width
    this.tooltipLine
      .setSize(lineW, ts)
      .setPosition((panelW / 2) * ts - lineW / 2, TOOLTIP_LINE.y * ts)

    const y = slot.y
    this.clearTooltipHop()
    this.tooltip
      .setPosition(slot.x + slot.displayWidth / 2 + TOOLTIP_GAP * ts, y)
      .setVisible(true)
    this.tooltipHop = [
      this.time.delayedCall(TOOLTIP_HOP_MS, () => this.tooltip.setY(y - ts)),
      this.time.delayedCall(TOOLTIP_HOP_MS * 2, () => this.tooltip.setY(y)),
    ]
  }

  private hideTooltip() {
    this.clearTooltipHop()
    this.tooltip.setVisible(false)
  }

  private clearTooltipHop() {
    this.tooltipHop.forEach((timer) => timer.remove())
    this.tooltipHop = []
  }

  private showObtained() {
    this.person.setFrame(0)
    showPopup(this, {
      title: "You obtained\nPETER'S PROFILE!",
      width: 1100,
      height: 320,
      autoDismissMs: OBTAINED_MS,
      onClose: () => this.showProfile(),
    })
  }

  private showProfile() {
    showPopup(this, {
      title: 'PETER NGUYEN',
      body: 'Full-Stack Software Engineer\n\nProjects',
      width: 1300,
      height: 760,
      onClose: () => this.addProfileTool(),
    })
  }

  private showCoffee() {
    showPopup(this, {
      title: 'COFFEE',
      body: "Fuel for late-night builds.\n\nLet's chat!",
      width: 1100,
      height: 520,
      onClose: () => this.addTool(TEXTURE.coffee, 'Coffee', () => this.showCoffee()),
    })
  }

  private addProfileTool() {
    this.addTool(TEXTURE.profileIcon, 'Profile', () => this.showProfile())
  }

  private addTool(textureKey: string, label: string, onClick: () => void) {
    const index = this.toolIcons.length
    if (index >= TOOL_SLOTS || this.toolIcons.some((icon) => icon.texture.key === textureKey)) return
    const slot = this.toolItems[index]
    const icon = this.add.image(slot.x, slot.y, textureKey).setDepth(1.5).setScale(0)
    this.toolIcons[index] = icon
    this.toolLabels[index] = label
    slot.input!.cursor = 'pointer'
    slot.on('pointerdown', onClick)

    this.tweens.add({
      targets: icon,
      scale: this.toolScale,
      duration: TOOL_POP_MS + TOOL_SETTLE_MS,
      ease: popThenSettle,
    })
  }

  private makeHoverable(image: Phaser.GameObjects.Image, textureKey: string) {
    const hoverKey = `${textureKey}${HOVER_SUFFIX}`
    const mask = this.buildHoverTexture(textureKey, hoverKey)
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

  private buildHoverTexture(textureKey: string, hoverKey: string) {
    const src = this.textures.get(textureKey).getSourceImage() as HTMLImageElement
    const mask = new Uint8Array(src.width * src.height)
    const canvas = this.textures.createCanvas(hoverKey, src.width, src.height)
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

  private layout() {
    const { width: W, height: H } = this.scale

    this.bg.setDisplaySize(W * BG_SCALE, H * BG_SCALE).setPosition(W / 2, (H * BG_SCALE) / 2)

    const s = W / this.counter.width
    const counterH = this.counter.height * s
    const bottom = H + COUNTER_DROP * counterH
    this.counter.setScale(s).setPosition(W / 2, bottom)
    const left = 0
    const top = bottom - counterH

    const frameH = H * PERSON_HEIGHT
    const personX = left + PERSON_POS.x * s
    const personY = top + PERSON_POS.y * s
    this.person.setScale(frameH / this.person.frame.height).setPosition(personX, personY)

    this.profiles
      .setScale(s)
      .setPosition(personX + PROFILE_OFFSET.x * frameH - s, personY + PROFILE_OFFSET.y * frameH - s)

    this.mug
      .setScale(s)
      .setPosition(
        this.profiles.x + MUG_OFFSET.x * this.profiles.displayWidth,
        this.profiles.y + MUG_OFFSET.y * this.profiles.displayHeight,
      )

    this.steam
      .setScale(s)
      .setPosition(this.mug.x + STEAM_ANCHOR.x * s, this.mug.y + STEAM_ANCHOR.y * s)

    const place = (i: number, target: Phaser.GameObjects.Image, corner: { x: number; y: number }) => {
      const todo = this.todos[i]
      todo.baseY = target.y + (corner.y + TODO_NUDGE.y) * s
      todo.icon.setScale(s).setPosition(target.x + (corner.x + TODO_NUDGE.x) * s, todo.baseY)
    }
    place(0, this.profiles, TODO_CORNER.papers)
    place(1, this.mug, TODO_CORNER.mug)

    const ts = s * TOOL_SCALE
    this.toolScale = ts
    const slot = this.toolItems[0].height * ts
    const toolTop = H * TOOLBAR_TOP + slot / 2
    const step = slot * (1 + TOOL_GAP)
    const toolX = Math.round(W * TOOLBAR_X)
    const toolY = (i: number) => Math.round(toolTop + i * step)
    this.toolItems.forEach((item, i) => item.setScale(ts).setPosition(toolX, toolY(i)))
    this.toolIcons.forEach((icon, i) => icon.setScale(ts).setPosition(toolX, toolY(i)))
  }
}
