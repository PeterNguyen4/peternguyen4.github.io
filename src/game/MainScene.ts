import Phaser from 'phaser'
import { ANIM, IMAGES, SPRITESHEETS, TEXTURE } from './assets'
import {
  BG_SCALE,
  COUNTER_DROP,
  MUG_OFFSET,
  PERSON_HEIGHT,
  PERSON_POS,
  PROFILE_OFFSET,
  STEAM_ALPHA,
  STEAM_ANCHOR,
  TODO_CORNER,
  TODO_NUDGE,
  TODO_ORIGIN,
} from './config/layout'
import {
  BUFF_COLOR,
  COFFEE_BUFF_ROWS,
  COFFEE_BUFF_SIZE,
  COFFEE_CAPTION,
  COFFEE_CTA,
  COFFEE_FRAME_SLICE,
  COFFEE_LABEL_SIZE,
  COFFEE_LEFT_X,
  COFFEE_RATINGS,
  COFFEE_RIGHT_X,
  COFFEE_ROW_HEIGHT,
  COFFEE_STARS_Y,
  COFFEE_TUB_SCALE,
  COFFEE_TUB_Y,
  ICON_GAP,
  ICON_SCALE,
  NIGHT_COLOR,
} from './config/coffee'
import { COFFEE_POPUP, FONT, OBTAINED_POPUP, PALETTE, PROFILE_POPUP } from './config/popup'
import { END_HOLD_MS, HAND_PROFILE_FPS, OBTAINED_MS, STEAM_FPS, TODO_HOP_MS, TODO_PAUSE_MS } from './config/timing'
import {
  TOOL_GAP,
  TOOL_ICONS,
  TOOL_LABELS,
  TOOL_LINKS,
  TOOL_SCALE,
  TOOL_SLOTS,
  TOOLBAR_TOP,
  TOOLBAR_X,
  TOOLTIP_ARROW,
  TOOLTIP_CAP,
  TOOLTIP_DEPTH,
  TOOLTIP_FONT,
  TOOLTIP_FONT_NATIVE,
  TOOLTIP_GAP,
  TOOLTIP_HOP_MS,
  TOOLTIP_LINE,
  TOOLTIP_PAD,
  TOOLTIP_PANEL,
  TOOLTIP_TEXT_COLOR,
  TOOLTIP_TEXT_Y,
} from './config/toolbar'
import { popThenSettle, TOOL_POP_MS, TOOL_SETTLE_MS } from './effects/easing'
import { makeHoverable } from './effects/hover'
import { showPopup } from './Popup'
import { addStars } from './Rating'

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
  private tooltipArrow!: Phaser.GameObjects.Image
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
      const link = TOOL_LINKS[i]
      if (link) {
        item.on('pointerdown', () => {
          window.open(link, '_blank', 'noopener,noreferrer')
          item.setTexture(TEXTURE.toolItem)
          this.hideTooltip()
        })
      }
    })
    this.tooltipPanel = this.add
      .nineslice(0, 0, TEXTURE.tooltip, undefined, 32, 32, TOOLTIP_CAP, TOOLTIP_CAP)
      .setOrigin(0)
    this.tooltipLabel = this.add
      .text(0, 0, '', { fontFamily: TOOLTIP_FONT, color: TOOLTIP_TEXT_COLOR })
      .setOrigin(0.5)
    this.tooltipLine = this.add.rectangle(0, 0, 1, 1, TOOLTIP_LINE.color).setOrigin(0)
    this.tooltipArrow = this.add.image(0, 0, TEXTURE.arrow).setOrigin(0, 0.5)
    this.tooltip = this.add
      .container(0, 0, [this.tooltipPanel, this.tooltipLabel, this.tooltipLine, this.tooltipArrow])
      .setDepth(TOOLTIP_DEPTH)
      .setVisible(false)
    this.toolIcons = TOOL_ICONS.map((key) => this.add.image(0, 0, key).setDepth(1.5))
    makeHoverable(this, this.profiles, TEXTURE.papers)
    makeHoverable(this, this.mug, TEXTURE.mug)
    this.mug.on('pointerdown', () => {
      this.removeTodo(1)
      this.showCoffee()
    })

    this.anims.create({
      key: ANIM.handProfile,
      frames: this.anims.generateFrameNumbers(TEXTURE.peterProfile, { start: 0, end: 11 }),
      frameRate: HAND_PROFILE_FPS,
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
    const hasArrow = !!TOOL_LINKS[i]
    const labelW = this.tooltipLabel.width / ts
    const arrowW = hasArrow ? TOOLTIP_ARROW.gap + TOOLTIP_ARROW.size : 0
    const panelW = Math.max(TOOLTIP_PANEL.minWidth, Math.ceil(labelW + arrowW) + 2 * TOOLTIP_PAD)
    const groupLeft = (panelW - labelW - arrowW) / 2

    this.tooltipPanel
      .setSize(panelW + 2 * TOOLTIP_PANEL.left, 32)
      .setScale(ts)
      .setPosition(-TOOLTIP_PANEL.left * ts, -TOOLTIP_PANEL.centerY * ts)
    this.tooltipLabel.setPosition((groupLeft + labelW / 2) * ts, TOOLTIP_TEXT_Y * ts)
    this.tooltipLine
      .setSize(this.tooltipLabel.width, ts)
      .setPosition(groupLeft * ts, TOOLTIP_LINE.y * ts)
    this.tooltipArrow
      .setVisible(hasArrow)
      .setScale(ts)
      .setPosition((groupLeft + labelW + TOOLTIP_ARROW.gap) * ts, (TOOLTIP_TEXT_Y + TOOLTIP_ARROW.y) * ts)

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
      ...OBTAINED_POPUP,
      autoDismissMs: OBTAINED_MS,
      onClose: () => this.showProfile(),
    })
  }

  private showProfile() {
    showPopup(this, {
      title: 'PETER NGUYEN',
      body: 'Full-Stack Software Engineer\n\nProjects',
      ...PROFILE_POPUP,
      onClose: () => this.addProfileTool(),
    })
  }

  private showCoffee() {
    showPopup(this, {
      title: 'COFFEE',
      ...COFFEE_POPUP,
      content: (container, area) => this.buildCoffeeReview(container, area),
      onClose: () => this.addTool(TEXTURE.coffee, 'Coffee', () => this.showCoffee()),
    })
  }

  private buildCoffeeReview(container: Phaser.GameObjects.Container, area: Phaser.Geom.Rectangle) {
    const text = (x: number, y: number, str: string, size: number) =>
      this.add.text(x, y, str, { fontFamily: FONT, fontSize: `${size}px`, color: PALETTE.text, align: 'center' })

    const leftX = area.x + area.width * COFFEE_LEFT_X
    const tubY = area.y + COFFEE_TUB_Y
    const { size: sliceSize, edge } = COFFEE_FRAME_SLICE
    const frame = this.add
      .nineslice(leftX, tubY, TEXTURE.inset, undefined, sliceSize, sliceSize, edge, edge, edge, edge)
      .setScale(COFFEE_TUB_SCALE)
    const tub = this.add.image(leftX, tubY, TEXTURE.coffeeTub).setScale(COFFEE_TUB_SCALE)
    const caption = text(leftX, area.y + COFFEE_CAPTION.y, COFFEE_CAPTION.text, COFFEE_CAPTION.size)
      .setOrigin(0.5, 0)
      .setLineSpacing(COFFEE_CAPTION.lineSpacing)
    const buff = [
      ...this.coloredLine(
        leftX,
        area.y + COFFEE_BUFF_ROWS.energy,
        [{ icon: TEXTURE.energy }, ['+15', BUFF_COLOR], [' Energy']],
        COFFEE_BUFF_SIZE,
      ),
      ...this.coloredLine(
        leftX,
        area.y + COFFEE_BUFF_ROWS.night,
        [{ icon: TEXTURE.night }, ['2x', NIGHT_COLOR], [' at Night']],
        COFFEE_BUFF_SIZE,
      ),
    ]
    container.add([frame, tub, caption, ...buff])

    const rightX = area.x + area.width * COFFEE_RIGHT_X
    COFFEE_RATINGS.forEach(([label, value], i) => {
      const y = area.y + i * COFFEE_ROW_HEIGHT
      const name = text(rightX, y, label, COFFEE_LABEL_SIZE).setOrigin(0)
      container.add([name, ...addStars(this, rightX, y + COFFEE_STARS_Y, value)])
    })

    const cta = this.add
      .text(
        rightX + COFFEE_CTA.offsetX,
        area.y + COFFEE_RATINGS.length * COFFEE_ROW_HEIGHT + COFFEE_CTA.offsetY,
        COFFEE_CTA.text,
        {
          fontFamily: FONT,
          fontSize: COFFEE_CTA.size,
          color: PALETTE.edge,
          backgroundColor: PALETTE.outline,
          padding: COFFEE_CTA.padding,
        },
      )
      .setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => window.open(TOOL_LINKS[0], '_blank', 'noopener'))
    container.add(cta)
  }

  /** Centered single line of colored text segments and inline icons. */
  private coloredLine(cx: number, y: number, parts: ([string, string?] | { icon: string })[], size: number) {
    const objs = parts.map((part) =>
      'icon' in part
        ? this.add.image(0, y + size / 2, part.icon).setOrigin(0, 0.5).setScale(ICON_SCALE)
        : this.add
            .text(0, y, part[0], {
              fontFamily: FONT,
              fontSize: `${size}px`,
              color: part[1] ?? PALETTE.text,
            })
            .setOrigin(0),
    )
    const widths = objs.map((o) => o.displayWidth + (o instanceof Phaser.GameObjects.Image ? ICON_GAP : 0))
    let x = cx - widths.reduce((sum, w) => sum + w, 0) / 2
    objs.forEach((o, i) => {
      o.setX(x)
      x += widths[i]
    })
    return objs
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
