import Phaser from 'phaser'
import { MIN_PRESS_MS } from './config/timing'

export function createPressHold(scene: Phaser.Scene) {
  let downAt = -Infinity
  let timer: Phaser.Time.TimerEvent | undefined
  return {
    down() {
      timer?.remove()
      timer = undefined
      downAt = scene.time.now
    },
    release(fn: () => void) {
      timer?.remove()
      timer = undefined
      const wait = MIN_PRESS_MS - (scene.time.now - downAt)
      if (wait > 0) timer = scene.time.delayedCall(wait, fn)
      else fn()
    },
  }
}
