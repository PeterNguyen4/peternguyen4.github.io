import Phaser from 'phaser'
import { ANIM, IMAGES, SPRITESHEETS, TEXTURE } from './assets'
import {
  COUNTER_DROP,
  MACHINE_OFFSET,
  MACHINE_ORIGIN,
  MUG_OFFSET,
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
  COFFEE_BANNER,
  CTA_ARROW_GAP,
  CTA_ARROW_TINT,
  CONTACT_GMAIL,
  ERWIX_FALLBACK_URL,
  ERWIX_URL,
  COFFEE_CTA,
  COFFEE_FRAME_SLICE,
  COFFEE_LEFT_X,
  COFFEE_RATINGS,
  COFFEE_STATS_PLATE,
  COFFEE_RIGHT_X,
  COFFEE_ROW_HEIGHT,
  COFFEE_STARS_Y,
  COFFEE_TUB_Y,
  ICON_GAP,
  NIGHT_COLOR,
} from './config/coffee'
import { ITEM_COLOR } from './config/dialog'
import { COFFEE_POPUP, PALETTE, PANEL_SLICE, POPUP_WRAP_PAD, PROFILE_LAYOUT, PROFILE_POPUP } from './config/popup'
import { END_HOLD_MS, HAND_PROFILE_FPS, PROFILE_LAST_FRAME_HOLD_MS, STEAM_FPS, TODO_HOP_MS, TODO_PAUSE_MS } from './config/timing'
import {
  TOOL_GAP,
  TOOL_ICONS,
  TOOL_LABELS,
  TOOL_LINKS,
  TOOL_SLOTS,
  TOOLBAR_TOP,
  TOOLBAR_X,
  TOOLTIP_ARROW,
  TOOLTIP_CAP,
  TOOLTIP_DEPTH,
  TOOLTIP_GAP,
  TOOLTIP_HOP_MS,
  TOOLTIP_LINE,
  TOOLTIP_PAD,
  TOOLTIP_PANEL,
  TOOLTIP_TEXT_COLOR,
  TOOLTIP_TEXT_Y,
} from './config/toolbar'
import { TOOL_GLOW_DELAY_MS, TOOL_GLOW_MS, TOOL_POP_HOLD_MS, TOOL_POP_SCALE, TOOL_RUMBLE_PX, TOOL_RUMBLE_STEP_MS, TOOL_RUMBLE_X } from './effects/easing'
import { makeHoverable } from './effects/hover'
import { addBanner, BANNER_TALL_STYLE } from './Banner'
import { showDialog } from './Dialog'
import { showPopup } from './Popup'
import { addStars } from './Rating'
import { addText } from './Text'

function openWithFallback(url: string, fallback: string) {
  const tab = window.open('', '_blank')
  if (!tab) return
  tab.opener = null
  const timeout = new AbortController()
  const timer = setTimeout(() => timeout.abort(), 4000)
  fetch(url, { mode: 'no-cors', signal: timeout.signal })
    .then(() => (tab.location.href = url))
    .catch(() => (tab.location.href = fallback))
    .finally(() => clearTimeout(timer))
}

export class MainScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.Image
  private counter!: Phaser.GameObjects.Image
  private person!: Phaser.GameObjects.Sprite
  private profiles!: Phaser.GameObjects.Image
  private mug!: Phaser.GameObjects.Image
  private machine!: Phaser.GameObjects.Image
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
  private coffeeObtained = false

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
    this.machine = this.add
      .image(0, 0, TEXTURE.coffeeMachine)
      .setOrigin(MACHINE_ORIGIN.x, MACHINE_ORIGIN.y)
      .setDepth(3)
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
    this.tooltipLabel = addText(this, 0, 0, '', { color: TOOLTIP_TEXT_COLOR })
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
      if (this.coffeeObtained) return this.showCoffee()
      this.coffeeObtained = true
      this.showObtained('COFFEE', ITEM_COLOR.coffee, () => this.showCoffee())
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
      this.time.delayedCall(PROFILE_LAST_FRAME_HOLD_MS, () => {
        this.person.setFrame(0)
        this.time.delayedCall(END_HOLD_MS, () => this.showObtained("PETER'S PROFILE", ITEM_COLOR.profile, () => this.showProfile()))
      })
    })

    this.layout()
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this))
  }

  private addVolumeButton() {
    const { textures, depth } = VOLUME_BUTTON
    this.musicOn = false
    this.sound.mute = !this.musicOn
    this.sound.play(AUDIO.music, { loop: true, volume: MUSIC_VOLUME })
    const frames = () => (this.musicOn ? textures.on : textures.off)
    const showTip = () => {
      const slot = this.toolItems[0]
      this.showTooltipAt(this.musicOn ? 'Music: ON' : 'Music: OFF', slot.x + slot.displayWidth / 2, this.volumeButton.y, false)
    }
    this.volumeButton = this.add.image(0, 0, textures.off.base).setDepth(depth)
    this.volumeButton
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        this.volumeButton.setTexture(frames().hover)
        showTip()
      })
      .on('pointerout', () => {
        this.volumeButton.setTexture(frames().base)
        this.hideTooltip()
      })
      .on('pointerdown', () => this.volumeButton.setTexture(frames().click))
      .on('pointerup', () => {
        this.musicOn = !this.musicOn
        this.sound.mute = !this.musicOn
        this.volumeButton.setTexture(frames().hover)
        showTip()
      })
  }

  private hopTodo(todo: { icon: Phaser.GameObjects.Image; baseY: number }, delay: number) {
    this.time.delayedCall(delay, () => {
      if (!todo.icon.active) return
      todo.icon.setY(todo.baseY - 1)
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
    this.showTooltipAt(label, slot.x + slot.displayWidth / 2, slot.y, !!TOOL_LINKS[i])
  }

  private showTooltipAt(label: string, edgeX: number, y: number, hasArrow: boolean) {
    this.tooltipLabel.setText(label)
    const labelW = this.tooltipLabel.width
    const arrowW = hasArrow ? TOOLTIP_ARROW.gap + TOOLTIP_ARROW.size : 0
    const panelW = Math.max(TOOLTIP_PANEL.minWidth, Math.ceil(labelW + arrowW) + 2 * TOOLTIP_PAD)
    const groupLeft = (panelW - labelW - arrowW) / 2

    this.tooltipPanel
      .setSize(panelW + 2 * TOOLTIP_PANEL.left, 32)
      .setPosition(-TOOLTIP_PANEL.left, -TOOLTIP_PANEL.centerY)
    this.tooltipLabel.setPosition(groupLeft + labelW / 2, TOOLTIP_TEXT_Y)
    this.tooltipLine
      .setSize(this.tooltipLabel.width, 1)
      .setPosition(groupLeft, TOOLTIP_LINE.y)
    this.tooltipArrow
      .setVisible(hasArrow)
      .setPosition(groupLeft + labelW + TOOLTIP_ARROW.gap, TOOLTIP_TEXT_Y + TOOLTIP_ARROW.y)

    this.clearTooltipHop()
    this.tooltip
      .setPosition(edgeX + TOOLTIP_GAP, y)
      .setVisible(true)
    this.tooltipHop = [
      this.time.delayedCall(TOOLTIP_HOP_MS, () => this.tooltip.setY(y - 1)),
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

  private showObtained(item: string, color: string, onClose: () => void) {
    showDialog(this, { parts: [['You obtained '], [item, color], ['!']], onClose })
  }

  private showProfile() {
    showPopup(this, {
      title: 'PETER NGUYEN',
      ...PROFILE_POPUP,
      content: (container, area) => this.buildProfile(container, area),
      onClose: () => this.addProfileTool(),
    })
  }

  private buildProfile(container: Phaser.GameObjects.Container, area: Phaser.Geom.Rectangle) {
    const P = PROFILE_LAYOUT
    const left = area.x + PANEL_SLICE + POPUP_WRAP_PAD / 2
    const text = (x: number, y: number, str: string, color: string = PALETTE.text) =>
      addText(this, x, y, str, { color }).setOrigin(0, 0.5)

    container.add(text(left, area.y + P.headingY, 'Full-Stack Software Engineer', P.headingColor))

    let x = left
    const skills: [string, string][] = [
      [TEXTURE.python, 'Python'],
      [TEXTURE.typescript, 'TypeScript'],
      [TEXTURE.postgresql, 'PostgreSQL'],
    ]
    for (const [texture, label] of skills) {
      const icon = this.add.image(x, area.y + P.skillsY, texture).setOrigin(0, 0.5)
      const name = text(x + icon.displayWidth + P.iconGap, area.y + P.skillsY, label)
      container.add([icon, name])
      x = name.x + name.width + P.skillGap
    }

    container.add(text(left, area.y + P.projectsY, 'Projects', P.headingColor))

    const { edge } = COFFEE_FRAME_SLICE
    const frameTop = area.y + P.rowY
    const frameW = P.frameNative.w
    const frameH = P.frameNative.h
    const frame = this.add
      .nineslice(left + frameW / 2, frameTop + frameH / 2, TEXTURE.inset, undefined, P.frameNative.w, P.frameNative.h, edge, edge, edge, edge)
    const shot = this.add.image(left + frameW / 2, frameTop + frameH / 2, TEXTURE.erwix)
    container.add([frame, shot])

    const cx = Math.round(left + frameW + P.columnGap + P.bannerWidth / 2)
    const banner = addBanner(
      this,
      cx,
      frameTop,
      P.title,
      COFFEE_BANNER.lineSpacing,
      COFFEE_BANNER.padX,
      P.bannerWidth,
    )
    const bulletLeft = cx - P.plateWidth / 2 + P.platePadX
    let y = banner.overlapY + P.bulletsOffsetY
    const bullets = P.bullets.map((str) => {
      const bean = this.add.image(bulletLeft, y, TEXTURE.coffeeBean).setOrigin(0)
      const textX = bulletLeft + bean.displayWidth + P.bulletGap
      const label = addText(this, textX, y, str, {
          color: PALETTE.text,
          lineSpacing: P.bulletLineSpacing,
          wordWrap: { width: P.plateWidth - 2 * P.platePadX - bean.displayWidth - P.bulletGap },
        })
        .setOrigin(0)
      const rowH = Math.max(label.height, bean.displayHeight)
      bean.y = y + (rowH - bean.displayHeight) / 2
      label.y = y + (rowH - label.height) / 2
      y += rowH + P.bulletRowGap
      return [bean, label]
    })
    const { slice } = COFFEE_STATS_PLATE
    const plateTop = banner.overlapY
    const plateBottom = y - P.bulletRowGap + P.plateBottomPad
    const plateW = P.plateWidth
    const plate = this.add
      .nineslice(cx, (plateTop + plateBottom) / 2, TEXTURE.stats, undefined, plateW, plateBottom - plateTop, slice, slice, slice, slice)
    container.add([plate, ...bullets.flat(), ...banner.objects])

    this.addCta(
      container,
      cx,
      plateBottom + P.ctaGap,
      'VIEW',
      () => openWithFallback(ERWIX_URL, ERWIX_FALLBACK_URL),
      true,
    )
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
    const text = (x: number, y: number, str: string) =>
      addText(this, x, y, str, { color: PALETTE.text, align: 'center' })

    const leftX = Math.round(area.x + area.width * COFFEE_LEFT_X)
    const tubY = area.y + COFFEE_TUB_Y
    const { size: sliceSize, edge } = COFFEE_FRAME_SLICE
    const frame = this.add
      .nineslice(leftX, tubY, TEXTURE.inset, undefined, sliceSize, sliceSize, edge, edge, edge, edge)
    const tub = this.add.image(leftX, tubY, TEXTURE.coffeeTub)
    const banner = addBanner(
      this,
      leftX,
      area.y + COFFEE_BANNER.y,
      COFFEE_BANNER.text,
      COFFEE_BANNER.lineSpacing,
      COFFEE_BANNER.padX,
      0,
      BANNER_TALL_STYLE,
    )
    const buff = this.statRows(
      leftX,
      [
        { y: area.y + COFFEE_BUFF_ROWS.energy, icon: TEXTURE.energy, parts: [['+15', BUFF_COLOR], [' Energy']] },
        { y: area.y + COFFEE_BUFF_ROWS.night, icon: TEXTURE.night, parts: [['2x', NIGHT_COLOR], [' at Night']] },
      ],
      COFFEE_BUFF_SIZE,
    )
    const { slice, padLeft, padRight, padY } = COFFEE_STATS_PLATE
    const left = Math.min(...buff.map((o) => o.x))
    const right = Math.max(...buff.map((o) => o.x + o.displayWidth))
    const plateTop = banner.overlapY
    const plateBottom = area.y + COFFEE_BUFF_ROWS.night + COFFEE_BUFF_SIZE + padY
    const plateW = right - left + padLeft + padRight
    const plate = this.add
      .nineslice(
        (left - padLeft + right + padRight) / 2,
        (plateTop + plateBottom) / 2,
        TEXTURE.stats,
        undefined,
        plateW,
        plateBottom - plateTop,
        slice,
        slice,
        slice,
        slice,
      )
    container.add([frame, tub, plate, ...buff, ...banner.objects])

    const rightX = Math.round(area.x + area.width * COFFEE_RIGHT_X)
    COFFEE_RATINGS.forEach(([label, value], i) => {
      const y = area.y + i * COFFEE_ROW_HEIGHT
      const name = text(rightX, y, label).setOrigin(0)
      container.add([name, ...addStars(this, rightX, y + COFFEE_STARS_Y, value)])
    })

    const ctaX = rightX + COFFEE_CTA.offsetX
    const ctaY = area.y + COFFEE_RATINGS.length * COFFEE_ROW_HEIGHT + COFFEE_CTA.offsetY
    this.addCta(container, ctaX, ctaY, COFFEE_CTA.text, () => window.open(CONTACT_GMAIL, '_blank', 'noopener'), true)
  }

  private addCta(
    container: Phaser.GameObjects.Container,
    cx: number,
    top: number,
    text: string,
    onClick: () => void,
    withArrow = false,
  ) {
    const { edge: btnEdge, padding, pressDepth } = COFFEE_CTA
    const label = addText(this, 0, 0, text, { color: PALETTE.edge })
      .setOrigin(0.5)
    const arrow = withArrow
      ? this.add.image(0, 0, TEXTURE.arrow).setOrigin(0.5).setTint(CTA_ARROW_TINT)
      : undefined
    const arrowW = arrow ? CTA_ARROW_GAP + arrow.displayWidth : 0
    const contentW = label.width + arrowW
    label.x = -contentW / 2 + label.width / 2
    arrow?.setX(contentW / 2 - arrow.displayWidth / 2)
    const btnW = Math.ceil(contentW + padding.x * 2)
    const btnH = Math.ceil(label.height + padding.y * 2)
    const button = this.add
      .nineslice(0, 0, TEXTURE.button, undefined, btnW, btnH, btnEdge, btnEdge, btnEdge, btnEdge)
    const face = arrow ? [label, arrow] : [label]
    const cta = this.add.container(cx, top + btnH / 2, [button, ...face])
    const restY = [COFFEE_CTA.labelOffsetY, COFFEE_CTA.arrowOffsetY]
    face.forEach((o, i) => (o.y = restY[i]))
    const setState = (texture: string, pressed: boolean) => {
      button.setTexture(texture)
      face.forEach((o, i) => (o.y = restY[i] + (pressed ? pressDepth : 0)))
    }
    cta
      .setSize(btnW, btnH)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => setState(TEXTURE.buttonHover, false))
      .on('pointerout', () => setState(TEXTURE.button, false))
      .on('pointerdown', () => setState(TEXTURE.buttonClick, true))
      .on('pointerup', () => {
        setState(TEXTURE.buttonHover, false)
        onClick()
      })
    container.add(cta)
  }

  private statRows(
    cx: number,
    rows: { y: number; icon: string; parts: [string, string?][] }[],
    size: number,
  ) {
    const built = rows.map((row) => ({
      icon: this.add.image(0, row.y + size / 2, row.icon).setOrigin(0.5),
      texts: row.parts.map(([str, color]) =>
        addText(this, 0, row.y, str, { color: color ?? PALETTE.text })
          .setOrigin(0),
      ),
    }))
    const iconW = Math.max(...built.map((r) => r.icon.displayWidth))
    const textW = Math.max(...built.map((r) => r.texts.reduce((sum, t) => sum + t.width, 0)))
    const left = cx - (iconW + ICON_GAP + textW) / 2
    for (const { icon, texts } of built) {
      icon.setX(left + iconW / 2)
      let x = left + iconW + ICON_GAP
      for (const t of texts) {
        t.setX(x)
        x += t.width
      }
    }
    return built.flatMap((r) => [r.icon, ...r.texts])
  }

  private addProfileTool() {
    this.addTool(TEXTURE.profileIcon, 'Profile', () => this.showProfile())
  }

  private addTool(textureKey: string, label: string, onClick: () => void) {
    const index = this.toolIcons.length
    if (index >= TOOL_SLOTS || this.toolIcons.some((icon) => icon.texture.key === textureKey)) return
    const slot = this.toolItems[index]
    const icon = this.add.image(slot.x, slot.y, textureKey).setDepth(1.5).setScale(TOOL_POP_SCALE)
    this.toolIcons[index] = icon
    this.toolLabels[index] = label
    slot.input!.cursor = 'pointer'
    slot.on('pointerdown', onClick)

    this.time.delayedCall(TOOL_POP_HOLD_MS, () => {
      icon.setScale(1)
      TOOL_RUMBLE_X.forEach((dx, i) => {
        this.time.delayedCall(TOOL_RUMBLE_STEP_MS * i, () => icon.setX(slot.x + dx * TOOL_RUMBLE_PX))
      })
      this.time.delayedCall(TOOL_RUMBLE_STEP_MS * TOOL_RUMBLE_X.length + TOOL_GLOW_DELAY_MS, () => {
        slot.setTexture(TEXTURE.toolItemFocus)
        this.time.delayedCall(TOOL_GLOW_MS, () => slot.setTexture(TEXTURE.toolItem))
      })
    })
  }

  private layout() {
    const { width: W, height: H } = this.scale

    this.bg.setOrigin(0.5, 1).setPosition(Math.round(W / 2), H)

    const counterH = this.counter.height
    const bottom = H + COUNTER_DROP
    this.counter.setPosition(Math.round(W / 2), bottom)
    const left = Math.round(W / 2) - this.counter.width / 2
    const top = bottom - counterH

    const personX = left + PERSON_POS.x
    const personY = top + PERSON_POS.y
    this.person.setPosition(personX, personY)

    this.profiles.setPosition(personX + PROFILE_OFFSET.x, personY + PROFILE_OFFSET.y)
    this.mug.setPosition(this.profiles.x + MUG_OFFSET.x, this.profiles.y + MUG_OFFSET.y)
    this.machine.setPosition(this.mug.x + MACHINE_OFFSET.x, this.mug.y + MACHINE_OFFSET.y)
    this.steam.setPosition(this.mug.x + STEAM_ANCHOR.x, this.mug.y + STEAM_ANCHOR.y)

    const place = (i: number, target: Phaser.GameObjects.Image, corner: { x: number; y: number }) => {
      const todo = this.todos[i]
      todo.baseY = target.y + corner.y + TODO_NUDGE.y
      todo.icon.setPosition(target.x + corner.x + TODO_NUDGE.x, todo.baseY)
    }
    place(0, this.profiles, TODO_CORNER.papers)
    place(1, this.mug, TODO_CORNER.mug)

    const slot = this.toolItems[0].height
    const toolTop = TOOLBAR_TOP + slot / 2
    const step = slot + TOOL_GAP
    const toolY = (i: number) => toolTop + (i + VOLUME_BUTTON.rows) * step
    this.toolItems.forEach((item, i) => item.setPosition(TOOLBAR_X, toolY(i)))
    this.toolIcons.forEach((icon, i) => icon.setPosition(TOOLBAR_X, toolY(i)))
    this.volumeButton.setPosition(TOOLBAR_X, toolTop - VOLUME_BUTTON.lift)
  }
}
