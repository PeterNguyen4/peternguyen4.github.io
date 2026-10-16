import Phaser from 'phaser'
import { ANIM, IMAGES, SPRITESHEETS, TEXTURE } from './assets'
import { showPopup } from './Popup'

const END_HOLD_MS = 300
const OBTAINED_MS = 2000

const PERSON_POS = { x: 150, y: 110 }
const PROFILE_OFFSET = { x: 0.37, y: -0.05 }
const MUG_OFFSET = { x: 0.5, y: -0.23 }
const STEAM_ANCHOR = { x: -1.5, y: -6 }
const STEAM_FPS = 5
const STEAM_ALPHA = 0.5

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

export class MainScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.Image
  private counter!: Phaser.GameObjects.Image
  private person!: Phaser.GameObjects.Sprite
  private profiles!: Phaser.GameObjects.Image
  private mug!: Phaser.GameObjects.Image
  private steam!: Phaser.GameObjects.Sprite

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
    this.makeHoverable(this.profiles, TEXTURE.papers)
    this.makeHoverable(this.mug, TEXTURE.mug)

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
      this.person.play(ANIM.handProfile)
    })

    this.person.on(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + ANIM.handProfile, () => {
      this.time.delayedCall(END_HOLD_MS, () => this.showObtained())
    })

    this.layout()
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
  }
}
