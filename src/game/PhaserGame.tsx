import Phaser from 'phaser'
import { useEffect, useRef } from 'react'
import { MainScene } from './MainScene'

export function PhaserGame() {
  const parent = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let game: Phaser.Game | undefined
    let cancelled = false
    document.fonts.load('32px "FS Pixel Sans"').finally(() => {
      if (cancelled) return
      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: parent.current!,
        pixelArt: true,
        backgroundColor: '#000',
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: 1920,
          height: 1080,
        },
        scene: MainScene,
      })
    })
    return () => {
      cancelled = true
      game?.destroy(true)
    }
  }, [])

  return <div ref={parent} style={{ flex: 1, minHeight: 0, overflow: 'hidden', background: '#000' }} />
}
