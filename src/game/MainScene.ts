import Phaser from 'phaser'
import { ANIM, IMAGES, SPRITESHEETS, TEXTURE } from './assets'

const PERSON_POS = { x: 150, y: 110 }
const PROFILE_OFFSET = { x: 0.4, y: -0.05 }
const PROFILE_SIZE = 0.08

const BG_SCALE = 1
const COUNTER_DROP = 0.1
const PERSON_HEIGHT = 0.65

export class MainScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.Image
  private counter!: Phaser.GameObjects.Image
  private person!: Phaser.GameObjects.Sprite
  private profiles!: Phaser.GameObjects.Rectangle

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
    this.person = this.add.sprite(0, 0, TEXTURE.peterProfile, 0).setOrigin(0.5, 1).setDepth(3)
    this.counter = this.add.image(0, 0, TEXTURE.counter).setOrigin(0.5, 1).setDepth(2)
    this.profiles = this.add
      .rectangle(0, 0, 1, 1, 0xff0000)
      .setDepth(4)
      .setInteractive({ useHandCursor: true })

    this.textures.get(TEXTURE.peterProfile).setFilter(Phaser.Textures.FilterMode.LINEAR)

    this.anims.create({
      key: ANIM.handProfile,
      frames: this.anims.generateFrameNumbers(TEXTURE.peterProfile, { start: 0, end: 11 }),
      frameRate: 8,
    })

    this.profiles.on('pointerdown', () => {
      if (this.person.anims.isPlaying) return
      this.person.play(ANIM.handProfile)
    })

    this.layout()
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

    const size = frameH * PROFILE_SIZE
    this.profiles
      .setDisplaySize(size, size)
      .setPosition(personX + PROFILE_OFFSET.x * frameH, personY + PROFILE_OFFSET.y * frameH)
    this.profiles.input?.hitArea.setSize(size, size)
  }
}
