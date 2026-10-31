import Phaser from 'phaser'
import { ANIM, AUDIO, IMAGES, SOUNDS, SPRITESHEETS, TEXTURE } from './assets'
import {
  CAT_OFFSET,
  DIPLOMA_POS,
  COUNTER_DROP,
  MACHINE_OFFSET,
  MACHINE_ORIGIN,
  MUG_OFFSET,
  NARROW_COUNTER_SHIFT,
  NARROW_TOOLBAR_BOTTOM,
  ROTATE_OVERLAY,
  ROTATE_TEXT,
  PERSON_POS,
  PET_ORIGIN_X,
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
  COFFEE_BANNER,
  COFFEE_BUFF_SIZE,
  CTA_ARROW_GAP,
  DIPLOMA_BANNER_EXTRA,
  DIPLOMA_OUTLINE_DEPTH,
  DIPLOMA_PLATE_PAD,
  DIPLOMA_BANNER_Y,
  DIPLOMA_RATINGS,
  DIPLOMA_TRAIT_ROW_GAP,
  DIPLOMA_TRAIT_Y,
  NOSTALGIA_COLOR,
  CTA_ARROW_TINT,
  CONTACT_GMAIL,
  ERWIX_FALLBACK_URL,
  ERWIX_URL,
  COFFEE_CTA,
  COFFEE_COMPACT_GAP,
  COFFEE_FRAME_SLICE,
  COFFEE_LEFT_X,
  COFFEE_RATINGS,
  COFFEE_STATS_PLATE,
  COFFEE_RIGHT_X,
  COFFEE_ROW_HEIGHT,
  COFFEE_STARS_Y,
  RATINGS_COL_GAP,
  STARS_INSET,
  COFFEE_TUB_Y,
  ICON_GAP,
  NIGHT_COLOR,
} from './config/coffee'
import { ITEM_COLOR } from './config/dialog'
import { COFFEE_POPUP, DIPLOMA_POPUP, PALETTE, PANEL_SLICE, POPUP_WRAP_PAD, PROFILE_LAYOUT, PROFILE_POPUP } from './config/popup'
import { CAT_FPS, END_HOLD_MS, HAND_PROFILE_FPS, PET_DIALOG_DELAY_MS, PET_FPS, PET_FRAMES, ROTATE_FADE_MS, ROTATE_FPS, ROTATE_PLAYS, ROTATE_REPEAT_DELAY_MS, PROFILE_LAST_FRAME_HOLD_MS, STEAM_FPS, TODO_HOP_MS, TODO_PAUSE_MS } from './config/timing'
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
  MUSIC_VOLUME,
  VOLUME_BUTTON,
} from './config/toolbar'
import { TOOL_GLOW_DELAY_MS, TOOL_GLOW_MS, TOOL_POP_HOLD_MS, TOOL_POP_SCALE, TOOL_RUMBLE_PX, TOOL_RUMBLE_STEP_MS, TOOL_RUMBLE_X } from './effects/easing'
import { makeHoverable, makeHoverableSprite } from './effects/hover'
import { addBanner, BANNER_STYLE, BANNER_TALL_STYLE } from './Banner'
import { showDialog } from './Dialog'
import { showPopup } from './Popup'
import { createPressHold } from './PressHold'
import { STAR_COUNT, STAR_GAP } from './config/rating'
import { addStars } from './Rating'
import { addText, inkWidth } from './Text'
import { GLYPH_ROWS } from './pixelFont'

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
  private personPet!: Phaser.GameObjects.Sprite
  private petting = false
  private onPetDone?: () => void
  private profiles!: Phaser.GameObjects.Image
  private mug!: Phaser.GameObjects.Image
  private machine!: Phaser.GameObjects.Image
  private steam!: Phaser.GameObjects.Sprite
  private cat!: Phaser.GameObjects.Sprite
  private diploma!: Phaser.GameObjects.Image
  private todos!: { icon: Phaser.GameObjects.Image; baseY: number }[]
  private toolItems: Phaser.GameObjects.Image[] = []
  private toolIcons: Phaser.GameObjects.Image[] = []
  private toolLabels: string[] = [...TOOL_LABELS]
  private tooltip!: Phaser.GameObjects.Container
  private tooltipPanel!: Phaser.GameObjects.NineSlice
  private tooltipPanelV!: Phaser.GameObjects.NineSlice[]
  private tooltipLabel!: Phaser.GameObjects.Text
  private tooltipLine!: Phaser.GameObjects.Rectangle
  private tooltipArrow!: Phaser.GameObjects.Image
  private tooltipHop: Phaser.Time.TimerEvent[] = []
  private volumeButton!: Phaser.GameObjects.Image
  private musicOn = false
  private horizontalBar = false
  private portrait = false
  private rotateHint?: { dim: Phaser.GameObjects.Rectangle; icon: Phaser.GameObjects.Sprite; label: Phaser.GameObjects.Text }
  private volumeTipX = 0
  private coffeeObtained = false
  private sceneBottom = 0

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
    this.diploma = this.add.image(0, 0, TEXTURE.diplomaWall).setDepth(1)
    this.person = this.add.sprite(0, 0, TEXTURE.peterProfile, 0).setOrigin(0.5, 1).setDepth(4)
    this.personPet = this.add.sprite(0, 0, TEXTURE.peterPet, 0).setOrigin(PET_ORIGIN_X, 1).setDepth(4).setVisible(false)
    this.counter = this.add.image(0, 0, TEXTURE.counter).setOrigin(0.5, 1).setDepth(2)
    this.counter.setCrop(0, 0, this.counter.width, this.counter.height - COUNTER_DROP)
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
    this.cat = this.add.sprite(0, 0, TEXTURE.cat, 0).setOrigin(0, 1).setDepth(3)
    this.todos = [0, 1, 2, 3].map(() => ({
      icon: this.add.image(0, 0, TEXTURE.todo).setOrigin(TODO_ORIGIN.x, TODO_ORIGIN.y).setDepth(3.5),
      baseY: 0,
    }))
    this.todos.forEach((todo, i) => this.hopTodo(todo, i * TODO_HOP_MS))
    this.toolItems = Array.from({ length: TOOL_SLOTS }, () =>
      this.add.image(0, 0, TEXTURE.toolItem).setDepth(5),
    )
    this.toolItems.forEach((item, i) => {
      item.setInteractive({ cursor: i < TOOL_ICONS.length ? 'pointer' : 'default' })
      item.on('pointerover', () => {
        item.setTexture(TEXTURE.toolItemFocus)
        this.showTooltip(i)
      })
      const hold = createPressHold(this)
      item.on('pointerdown', () => hold.down())
      item.on('pointerout', () => {
        hold.release(() => item.setTexture(TEXTURE.toolItem))
        this.hideTooltip()
      })
      const link = TOOL_LINKS[i]
      if (link) {
        item.on('pointerup', () => {
          window.open(link, '_blank', 'noopener,noreferrer')
          hold.release(() => item.setTexture(TEXTURE.toolItem))
          this.hideTooltip()
        })
      }
    })
    this.tooltipPanel = this.add
      .nineslice(0, 0, TEXTURE.tooltip, undefined, 32, 32, TOOLTIP_CAP, TOOLTIP_CAP)
      .setOrigin(0)
    const vertical = this.textures.get(TEXTURE.tooltipVertical)
    vertical.add('vl', 0, 0, 0, 16, 32)
    vertical.add('vr', 0, 16, 0, 16, 32)
    this.tooltipPanelV = ['vl', 'vr'].map((frame) =>
      this.add.nineslice(0, 0, TEXTURE.tooltipVertical, frame, 16, 32, frame === 'vl' ? 12 : 1, frame === 'vl' ? 2 : 12, 12, 12).setOrigin(0),
    )
    this.tooltipLabel = addText(this, 0, 0, '', { color: TOOLTIP_TEXT_COLOR })
      .setOrigin(0.5)
    this.tooltipLine = this.add.rectangle(0, 0, 1, 1, TOOLTIP_LINE.color).setOrigin(0)
    this.tooltipArrow = this.add.image(0, 0, TEXTURE.arrow).setOrigin(0, 0.5)
    this.tooltip = this.add
      .container(0, 0, [this.tooltipPanel, ...this.tooltipPanelV, this.tooltipLabel, this.tooltipLine, this.tooltipArrow])
      .setDepth(TOOLTIP_DEPTH)
      .setVisible(false)
    this.toolIcons = TOOL_ICONS.map((key) => this.add.image(0, 0, key).setDepth(5.5))
    this.addVolumeButton()
    makeHoverable(this, this.profiles, TEXTURE.papers)
    makeHoverable(this, this.mug, TEXTURE.mug)
    makeHoverable(this, this.diploma, TEXTURE.diplomaWall, DIPLOMA_OUTLINE_DEPTH)
    this.diploma.on('pointerdown', () => {
      this.removeTodo(3)
      this.showDiploma()
    })
    makeHoverableSprite(this, this.cat, TEXTURE.cat, SPRITESHEETS[TEXTURE.cat].frameWidth, SPRITESHEETS[TEXTURE.cat].frameHeight)
    this.cat.on('pointerdown', () => {
      if (this.petting) return
      this.removeTodo(2)
      this.petCat(() =>
        this.time.delayedCall(PET_DIALOG_DELAY_MS, () =>
          showDialog(this, { parts: [['...']], speaker: 'Cat', portrait: TEXTURE.catDialogue, typewriter: true, bottom: this.sceneBottom }),
        ),
      )
    })
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
      key: ANIM.petCat,
      frames: this.anims.generateFrameNumbers(TEXTURE.peterPet, { start: 0, end: PET_FRAMES - 1 }),
      frameRate: PET_FPS,
    })
    this.personPet.on(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + ANIM.petCat, () => {
      this.personPet.setVisible(false)
      this.person.setVisible(true)
      this.petting = false
      this.onPetDone?.()
      this.onPetDone = undefined
    })

    this.anims.create({
      key: ANIM.steam,
      frames: this.anims.generateFrameNumbers(TEXTURE.steam, { start: 0, end: 7 }),
      frameRate: STEAM_FPS,
      repeat: -1,
    })
    this.steam.play(ANIM.steam)

    const catFrames = this.textures.get(TEXTURE.cat).frameTotal - 1
    if (catFrames > 1) {
      this.anims.create({
        key: ANIM.cat,
        frames: this.anims.generateFrameNumbers(TEXTURE.cat, { start: 0, end: catFrames - 1 }),
        frameRate: CAT_FPS,
        repeat: -1,
        yoyo: true,
      })
      this.cat.play(ANIM.cat)
    }

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
    this.showRotateHint()
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this))
  }

  private showRotateHint() {
    if (!this.portrait || this.sys.game.device.os.desktop) return
    const dim = this.add
      .rectangle(0, 0, 1, 1, 0x000000, ROTATE_OVERLAY.alpha)
      .setOrigin(0)
      .setDepth(ROTATE_OVERLAY.depth)
      .setInteractive()
    const icon = this.add
      .sprite(0, 0, TEXTURE.rotate, 0)
      .setScale(ROTATE_OVERLAY.scale)
      .setDepth(ROTATE_OVERLAY.depth + 1)
    const label = addText(this, 0, 0, ROTATE_TEXT.label, {
        color: ROTATE_TEXT.color,
        align: 'center',
        wordWrap: { width: this.scale.width - 2 * ROTATE_TEXT.margin },
      })
      .setOrigin(0.5, 0)
      .setDepth(ROTATE_OVERLAY.depth + 1)
    this.rotateHint = { dim, icon, label }
    this.anims.create({
      key: ANIM.rotate,
      frames: this.anims.generateFrameNumbers(TEXTURE.rotate, { start: 0, end: 7 }),
      frameRate: ROTATE_FPS,
      repeat: ROTATE_PLAYS - 1,
      repeatDelay: ROTATE_REPEAT_DELAY_MS,
    })
    icon.play(ANIM.rotate)
    icon.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + ANIM.rotate, () => this.hideRotateHint())
    dim.once('pointerdown', () => this.hideRotateHint())
    this.layout()
  }

  private hideRotateHint() {
    const hint = this.rotateHint
    if (!hint) return
    this.rotateHint = undefined
    this.tweens.add({
      targets: [hint.dim, hint.icon, hint.label],
      alpha: 0,
      duration: ROTATE_FADE_MS,
      onComplete: () => {
        hint.dim.destroy()
        hint.icon.destroy()
        hint.label.destroy()
      },
    })
  }

  private loadMusic() {
    this.load.audio(AUDIO.music, SOUNDS[AUDIO.music])
    this.load.once(`filecomplete-audio-${AUDIO.music}`, () => {
      this.sound.play(AUDIO.music, { loop: true, volume: MUSIC_VOLUME })
    })
    this.load.start()
  }

  private addVolumeButton() {
    const { textures } = VOLUME_BUTTON
    this.musicOn = false
    this.sound.mute = !this.musicOn
    this.loadMusic()
    const frames = () => (this.musicOn ? textures.on : textures.off)
    const showTip = () => {
      this.showTooltipAt(this.musicOn ? 'Music: ON' : 'Music: OFF', this.volumeTipX, this.volumeButton.y, false)
    }
    this.volumeButton = this.add.image(0, 0, textures.off.base).setDepth(5.5)
    const hold = createPressHold(this)
    this.volumeButton
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        this.volumeButton.setTexture(frames().hover)
        showTip()
      })
      .on('pointerout', () => {
        hold.release(() => this.volumeButton.setTexture(frames().base))
        this.hideTooltip()
      })
      .on('pointerdown', () => {
        hold.down()
        this.volumeButton.setTexture(frames().click)
      })
      .on('pointerup', () => {
        this.musicOn = !this.musicOn
        this.sound.mute = !this.musicOn
        hold.release(() => this.volumeButton.setTexture(frames().hover))
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

  private petCat(onDone: () => void) {
    this.petting = true
    this.onPetDone = onDone
    this.person.setVisible(false)
    this.personPet.setVisible(true).play(ANIM.petCat)
  }

  private removeTodo(i: number) {
    const { icon } = this.todos[i]
    if (icon.active) icon.destroy()
  }

  private showTooltip(i: number) {
    const label = this.toolLabels[i]
    const slot = this.toolItems[i]
    if (!label || !this.toolIcons[i]) return
    if (this.horizontalBar) {
      this.showTooltipAt(label, slot.x, slot.y - slot.displayHeight / 2 - 13.5, !!TOOL_LINKS[i], true)
      return
    }
    this.showTooltipAt(label, slot.x + slot.displayWidth / 2, slot.y, !!TOOL_LINKS[i])
  }

  private showTooltipAt(label: string, edgeX: number, y: number, hasArrow: boolean, centered = false) {
    if (!window.matchMedia('(hover: hover)').matches) return
    this.tooltipLabel.setText(label)
    const fullW = this.tooltipLabel.width
    const labelW = inkWidth(label)
    const arrowW = hasArrow ? TOOLTIP_ARROW.gap + TOOLTIP_ARROW.size : 0
    const panelW = Math.max(TOOLTIP_PANEL.minWidth, Math.ceil(labelW + arrowW) + 2 * TOOLTIP_PAD)
    const groupLeft = (panelW - labelW - arrowW) / 2

    const fullPanelW = panelW + 2 * TOOLTIP_PANEL.left
    this.tooltipPanel
      .setSize(fullPanelW, 32)
      .setPosition(-TOOLTIP_PANEL.left, -TOOLTIP_PANEL.centerY)
      .setVisible(!centered)
    const leftW = Math.ceil(fullPanelW / 2) + 1
    this.tooltipPanelV[0]
      .setSize(leftW, 32)
      .setPosition(-TOOLTIP_PANEL.left, -TOOLTIP_PANEL.centerY)
      .setVisible(centered)
    this.tooltipPanelV[1]
      .setSize(fullPanelW - leftW, 32)
      .setPosition(-TOOLTIP_PANEL.left + leftW, -TOOLTIP_PANEL.centerY)
      .setVisible(centered)
    this.tooltipLabel.setPosition(groupLeft + fullW / 2, TOOLTIP_TEXT_Y)
    this.tooltipLine
      .setSize(labelW, 1)
      .setPosition(groupLeft, TOOLTIP_LINE.y)
    this.tooltipArrow
      .setVisible(hasArrow)
      .setPosition(groupLeft + labelW + TOOLTIP_ARROW.gap, TOOLTIP_TEXT_Y + TOOLTIP_ARROW.y)

    this.clearTooltipHop()
    const x = centered
      ? Phaser.Math.Clamp(Math.round(edgeX - panelW / 2), TOOLTIP_PANEL.left, this.scale.width - panelW - TOOLTIP_PANEL.left)
      : edgeX + TOOLTIP_GAP
    this.tooltip
      .setPosition(x, y)
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
    showDialog(this, { parts: [['You obtained '], [item, color], ['!']], onClose, bottom: this.sceneBottom })
  }

  private showProfile() {
    showPopup(this, {
      title: 'PETER NGUYEN',
      ...PROFILE_POPUP,
      content: (container, area, compact) => this.buildProfile(container, area, compact),
      onClose: () => this.addProfileTool(),
    })
  }

  private buildProfile(container: Phaser.GameObjects.Container, area: Phaser.Geom.Rectangle, compact: boolean) {
    const P = PROFILE_LAYOUT
    const left = area.x + PANEL_SLICE + POPUP_WRAP_PAD / 2
    const innerW = area.width - 2 * (PANEL_SLICE + POPUP_WRAP_PAD / 2)
    const text = (x: number, y: number, str: string, color: string = PALETTE.text) =>
      addText(this, x, y, str, { color }).setOrigin(0, 0.5)

    container.add(text(left, area.y + P.headingY, 'Full-Stack Software Engineer', P.headingColor))

    let x = left
    let rowShift = 0
    const skills: [string, string][] = [
      [TEXTURE.python, 'Python'],
      [TEXTURE.typescript, 'TypeScript'],
      [TEXTURE.postgresql, 'PostgreSQL'],
    ]
    for (const [texture, label] of skills) {
      const icon = this.add.image(x, area.y + P.skillsY + rowShift, texture).setOrigin(0, 0.5)
      const name = text(x + icon.displayWidth + P.iconGap, area.y + P.skillsY + rowShift, label)
      if (compact && x > left && name.x + name.width > left + innerW) {
        rowShift += P.skillRowH
        x = left
        icon.setPosition(x, area.y + P.skillsY + rowShift)
        name.setPosition(x + icon.displayWidth + P.iconGap, area.y + P.skillsY + rowShift)
      }
      container.add([icon, name])
      x = name.x + name.width + P.skillGap
    }

    container.add(text(left, area.y + P.projectsY + rowShift, 'Projects', P.headingColor))

    const { edge } = COFFEE_FRAME_SLICE
    const frameTop = area.y + P.rowY + rowShift
    const frameW = P.frameNative.w
    const frameH = P.frameNative.h
    const frameLeft = compact ? Math.round(area.x + (area.width - frameW) / 2) : left
    const frame = this.add
      .nineslice(frameLeft + frameW / 2, frameTop + frameH / 2, TEXTURE.inset, undefined, P.frameNative.w, P.frameNative.h, edge, edge, edge, edge)
    const shot = this.add.image(frameLeft + frameW / 2, frameTop + frameH / 2, TEXTURE.erwix)
    container.add([frame, shot])

    const bannerWidth = Math.min(P.bannerWidth, innerW)
    const plateWidth = Math.min(P.plateWidth, innerW - 4)
    const cx = compact
      ? Math.round(area.x + area.width / 2)
      : Math.round(left + frameW + P.columnGap + bannerWidth / 2)
    const bannerTop = compact ? frameTop + frameH + P.stackGap : frameTop
    const banner = addBanner(
      this,
      cx,
      bannerTop,
      P.title,
      COFFEE_BANNER.lineSpacing,
      COFFEE_BANNER.padX,
      bannerWidth,
    )
    const bulletLeft = cx - plateWidth / 2 + P.platePadX + P.bulletShiftX
    let y = banner.overlapY + P.bulletsOffsetY
    const bullets = P.bullets.map((str) => {
      const bean = this.add.image(bulletLeft, y, TEXTURE.coffeeBean).setOrigin(0)
      const textX = bulletLeft + bean.displayWidth + P.bulletGap
      const label = addText(this, textX, y, str, {
          color: PALETTE.text,
          lineSpacing: P.bulletLineSpacing,
          wordWrap: { width: plateWidth - 2 * P.platePadX - P.bulletShiftX - bean.displayWidth - P.bulletGap },
        })
        .setOrigin(0)
      const rowH = Math.max(label.height, bean.displayHeight)
      y += rowH + P.bulletRowGap
      return [bean, label]
    })
    const { slice } = COFFEE_STATS_PLATE
    const plateTop = banner.overlapY
    const plateBottom = Math.ceil(y - P.bulletRowGap + P.plateBottomPad)
    const plate = this.add
      .nineslice(cx, (plateTop + plateBottom) / 2, TEXTURE.stats, undefined, plateWidth, plateBottom - plateTop, slice, slice, slice, slice)
    container.add([plate, ...bullets.flat(), ...banner.objects])

    return this.addCta(
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
      content: (container, area, compact) => this.buildCoffeeReview(container, area, compact),
      onClose: () => this.addTool(TEXTURE.coffee, 'Coffee', () => this.showCoffee()),
    })
  }

  private buildCoffeeReview(container: Phaser.GameObjects.Container, area: Phaser.Geom.Rectangle, compact: boolean) {
    const text = (x: number, y: number, str: string) =>
      addText(this, x, y, str, { color: PALETTE.text, align: 'center' })

    const leftX = Math.round(area.x + area.width * (compact ? 0.5 : COFFEE_LEFT_X))
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

    if (compact) {
      const ratingsTop = plateBottom + COFFEE_COMPACT_GAP
      const ratingsBottom = this.addCompactRatings(container, COFFEE_RATINGS, area, ratingsTop)
      const ctaTop = ratingsBottom + COFFEE_CTA.offsetY
      return this.addCta(container, leftX, ctaTop, COFFEE_CTA.text, () => window.open(CONTACT_GMAIL, '_blank', 'noopener'), true)
    }

    const rightX = Math.round(area.x + area.width * COFFEE_RIGHT_X)
    COFFEE_RATINGS.forEach(([label, value], i) => {
      const y = area.y + i * COFFEE_ROW_HEIGHT
      const name = text(rightX, y, label).setAlign('left').setOrigin(0)
      container.add([name, ...addStars(this, rightX + STARS_INSET, y + COFFEE_STARS_Y, value)])
    })

    const ctaX = rightX + COFFEE_CTA.offsetX
    const ctaY = area.y + COFFEE_RATINGS.length * COFFEE_ROW_HEIGHT + COFFEE_CTA.offsetY
    this.addCta(container, ctaX, ctaY, COFFEE_CTA.text, () => window.open(CONTACT_GMAIL, '_blank', 'noopener'), true)
  }

  private showDiploma() {
    showPopup(this, {
      title: 'COLLEGE',
      ...DIPLOMA_POPUP,
      content: (container, area, compact) => this.buildDiplomaReview(container, area, compact),
    })
  }

  private buildDiplomaReview(container: Phaser.GameObjects.Container, area: Phaser.Geom.Rectangle, compact: boolean) {
    const text = (x: number, y: number, str: string, color: string = PALETTE.text) =>
      addText(this, x, y, str, { color, align: 'center' })

    const leftX = Math.round(area.x + area.width * (compact ? 0.5 : COFFEE_LEFT_X))
    const itemY = area.y + COFFEE_TUB_Y
    const { size: sliceSize, edge } = COFFEE_FRAME_SLICE
    const frame = this.add
      .nineslice(leftX, itemY, TEXTURE.inset, undefined, sliceSize, sliceSize, edge, edge, edge, edge)
    const item = this.add.image(leftX, itemY, TEXTURE.diplomaItem)
    const rowY = (i: number) => area.y + DIPLOMA_TRAIT_Y + i * DIPLOMA_TRAIT_ROW_GAP
    const heading = text(0, rowY(0), 'Passive Trait', PROFILE_LAYOUT.headingColor).setOrigin(0.5, 0)
    const gain = text(0, rowY(1), 'Gain').setOrigin(0)
    const heart = this.add.image(0, rowY(1) + GLYPH_ROWS / 2, TEXTURE.heart).setOrigin(0, 0.5)
    const nostalgia = text(0, rowY(1), 'Nostalgia', NOSTALGIA_COLOR).setOrigin(0)
    const where = text(0, rowY(2), 'when in San Diego').setOrigin(0.5, 0)

    const row1W = gain.width + ICON_GAP + heart.displayWidth + ICON_GAP + nostalgia.width
    const row1Left = leftX - row1W / 2
    gain.setX(row1Left)
    heart.setX(row1Left + gain.width + ICON_GAP)
    nostalgia.setX(heart.x + heart.displayWidth)
    heading.setX(leftX)
    where.setX(leftX)

    const { slice, padY } = COFFEE_STATS_PLATE
    const { left: padLeft, right: padRight } = DIPLOMA_PLATE_PAD
    const contentW = Math.max(row1W, heading.width, where.width)
    const plateW = contentW + padLeft + padRight
    const banner = addBanner(
      this,
      leftX,
      area.y + DIPLOMA_BANNER_Y,
      'UCSD Diploma',
      COFFEE_BANNER.lineSpacing,
      COFFEE_BANNER.padX,
      plateW + DIPLOMA_BANNER_EXTRA,
      BANNER_STYLE,
    )

    const plateTop = banner.overlapY
    const plateBottom = rowY(2) + GLYPH_ROWS + padY
    const plate = this.add
      .nineslice(
        leftX + (padRight - padLeft) / 2,
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
    container.add([frame, item, plate, heading, gain, heart, nostalgia, where, ...banner.objects])

    if (compact) {
      const ratingsTop = plateBottom + COFFEE_COMPACT_GAP
      return this.addCompactRatings(container, DIPLOMA_RATINGS, area, ratingsTop)
    }

    const rightX = Math.round(area.x + area.width * COFFEE_RIGHT_X)
    DIPLOMA_RATINGS.forEach(([label, value], i) => {
      const y = area.y + i * COFFEE_ROW_HEIGHT
      container.add([text(rightX, y, label).setAlign('left').setOrigin(0), ...addStars(this, rightX + STARS_INSET, y + COFFEE_STARS_Y, value)])
    })
  }

  private addCompactRatings(
    container: Phaser.GameObjects.Container,
    ratings: [string, number][],
    area: Phaser.Geom.Rectangle,
    top: number,
  ) {
    const starW = this.textures.get(TEXTURE.star).getSourceImage().width
    const starsW = STAR_COUNT * (starW + STAR_GAP) - STAR_GAP + STARS_INSET
    const itemW = Math.max(starsW, ...ratings.map(([label]) => inkWidth(label)))
    const left = Math.round(area.x + (area.width - (2 * itemW + RATINGS_COL_GAP)) / 2)
    ratings.forEach(([label, value], i) => {
      const x = left + (i % 2) * (itemW + RATINGS_COL_GAP)
      const y = top + Math.floor(i / 2) * COFFEE_ROW_HEIGHT
      const name = addText(this, x, y, label, { color: PALETTE.text }).setOrigin(0)
      container.add([name, ...addStars(this, x + STARS_INSET, y + COFFEE_STARS_Y, value)])
    })
    return top + Math.ceil(ratings.length / 2) * COFFEE_ROW_HEIGHT
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
      if (!cta.active) return
      button.setTexture(texture)
      face.forEach((o, i) => (o.y = restY[i] + (pressed ? pressDepth : 0)))
    }
    const hold = createPressHold(this)
    let pressed = false
    cta
      .setSize(btnW, btnH)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => setState(TEXTURE.buttonHover, false))
      .on('pointerout', () => {
        pressed = false
        hold.release(() => setState(TEXTURE.button, false))
      })
      .on('pointerdown', () => {
        pressed = true
        hold.down()
        setState(TEXTURE.buttonClick, true)
      })
      .on('pointerup', () => {
        if (!pressed) return
        pressed = false
        hold.release(() => setState(TEXTURE.buttonHover, false))
        onClick()
      })
    container.add(cta)
    return top + btnH
  }

  private statRows(
    cx: number,
    rows: { y: number; icon: string; parts: [string, string?][] }[],
  ) {
    const built = rows.map((row) => ({
      icon: this.add.image(0, row.y + GLYPH_ROWS / 2, row.icon).setOrigin(0.5),
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
    const icon = this.add.image(slot.x, slot.y, textureKey).setDepth(5.5).setScale(TOOL_POP_SCALE)
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

    this.portrait = W < H
    this.horizontalBar = this.portrait || H > this.bg.height
    if (this.rotateHint) {
      this.rotateHint.dim.setSize(W, H)
      this.rotateHint.dim.input?.hitArea.setSize(W, H)
      this.rotateHint.icon.setPosition(Math.round(W / 2), Math.round(H / 2))
      this.rotateHint.label.setPosition(Math.round(W / 2), Math.round(H / 2 + this.rotateHint.icon.displayHeight / 2 + ROTATE_TEXT.gap))
      if (!this.portrait) this.hideRotateHint()
    }
    const shift = this.portrait ? Math.min(NARROW_COUNTER_SHIFT, Math.max(0, (this.counter.width - W) / 2)) : 0
    const centerX = Math.round(W / 2 + shift)
    const bgBottom = this.horizontalBar ? Math.min(H, Math.round((H + this.bg.height) / 2)) : H
    this.bg.setOrigin(0.5, 1).setPosition(centerX, bgBottom)
    this.sceneBottom = bgBottom
    this.machine.setVisible(!this.portrait)
    this.diploma.setPosition(centerX - this.bg.width / 2 + DIPLOMA_POS.x, bgBottom - this.bg.height + DIPLOMA_POS.y)

    const counterH = this.counter.height
    const bottom = bgBottom + COUNTER_DROP
    this.counter.setPosition(centerX, bottom)
    const left = centerX - this.counter.width / 2
    const top = bottom - counterH

    const personX = left + PERSON_POS.x
    const personY = top + PERSON_POS.y
    this.person.setPosition(personX, personY)
    this.personPet.setPosition(personX, personY)

    this.profiles.setPosition(personX + PROFILE_OFFSET.x, personY + PROFILE_OFFSET.y)
    this.mug.setPosition(this.profiles.x + MUG_OFFSET.x, this.profiles.y + MUG_OFFSET.y)
    this.machine.setPosition(this.mug.x + MACHINE_OFFSET.x, this.mug.y + MACHINE_OFFSET.y)
    this.steam.setPosition(this.mug.x + STEAM_ANCHOR.x, this.mug.y + STEAM_ANCHOR.y)
    this.cat.setPosition(personX + CAT_OFFSET.x, personY + CAT_OFFSET.y)

    const place = (i: number, target: { x: number; y: number }, corner: { x: number; y: number }) => {
      const todo = this.todos[i]
      todo.baseY = target.y + corner.y + TODO_NUDGE.y
      todo.icon.setPosition(target.x + corner.x + TODO_NUDGE.x, todo.baseY)
    }
    place(0, this.profiles, TODO_CORNER.papers)
    place(1, this.mug, TODO_CORNER.mug)
    place(2, this.cat, TODO_CORNER.cat)
    place(3, this.diploma, TODO_CORNER.diploma)

    const slot = this.toolItems[0].height
    const step = slot + TOOL_GAP
    const toolTop = TOOLBAR_TOP + slot / 2
    this.volumeButton.setPosition(TOOLBAR_X, toolTop - VOLUME_BUTTON.lift)
    if (this.horizontalBar) {
      const barY = H - NARROW_TOOLBAR_BOTTOM - slot / 2
      const barLeft = Math.round(W / 2 - (step * TOOL_SLOTS - TOOL_GAP) / 2 + slot / 2)
      const toolX = (i: number) => barLeft + i * step
      this.toolItems.forEach((item, i) => item.setPosition(toolX(i), barY))
      this.toolIcons.forEach((icon, i) => icon.setPosition(toolX(i), barY))
      this.volumeTipX = this.volumeButton.x + this.volumeButton.displayWidth / 2
      return
    }

    const toolY = (i: number) => toolTop + (i + VOLUME_BUTTON.rows) * step
    this.toolItems.forEach((item, i) => item.setPosition(TOOLBAR_X, toolY(i)))
    this.toolIcons.forEach((icon, i) => icon.setPosition(TOOLBAR_X, toolY(i)))
    this.volumeTipX = this.volumeButton.x + this.volumeButton.displayWidth / 2
  }
}
