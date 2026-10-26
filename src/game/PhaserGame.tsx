import Phaser from 'phaser'
import { useEffect, useRef } from 'react'
import { MainScene } from './MainScene'
import { FONT_LOAD } from './Text'
import { MIN_VIEW_H, MIN_VIEW_W, NARROW_VIEW_W } from './config/layout'
import background from '../assets/backgrounds/background.png'

function measure(el: HTMLElement) {
  const dpr = window.devicePixelRatio || 1
  const devW = el.clientWidth * dpr
  const devH = el.clientHeight * dpr
  const minW = devW < devH ? NARROW_VIEW_W : MIN_VIEW_W
  const zoom = Math.max(1, Math.floor(Math.min(devW / minW, devH / MIN_VIEW_H)))
  return { dpr, zoom, width: Math.floor(devW / zoom), height: Math.floor(devH / zoom) }
}

function styleCanvas(game: Phaser.Game, el: HTMLElement, dpr: number, zoom: number) {
  const { width, height, canvas } = game.scale
  const offsetX = Math.floor((el.clientWidth * dpr - width * zoom) / 2)
  const offsetY = Math.floor((el.clientHeight * dpr - height * zoom) / 2)
  canvas.style.position = 'absolute'
  canvas.style.left = `${offsetX / dpr}px`
  canvas.style.top = `${offsetY / dpr}px`
  canvas.style.width = `${(width * zoom) / dpr}px`
  canvas.style.height = `${(height * zoom) / dpr}px`
  game.scale.refresh()
}

export function PhaserGame() {
  const parent = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = parent.current!
    let game: Phaser.Game | undefined
    let cancelled = false
    let observer: ResizeObserver | undefined
    document.fonts.load(FONT_LOAD).finally(() => {
      if (cancelled) return
      const { dpr, zoom, width, height } = measure(el)
      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: el,
        pixelArt: true,
        roundPixels: true,
        transparent: true,
        scale: { mode: Phaser.Scale.NONE, width, height, autoRound: false },
        scene: MainScene,
      })
      styleCanvas(game, el, dpr, zoom)
      observer = new ResizeObserver(() => {
        const next = measure(el)
        game!.scale.resize(next.width, next.height)
        styleCanvas(game!, el, next.dpr, next.zoom)
      })
      observer.observe(el)
    })
    return () => {
      cancelled = true
      observer?.disconnect()
      game?.destroy(true)
    }
  }, [])

  return (
    <div className="game-frame">
      <div className="game-frame-fill" style={{ backgroundImage: `url(${background})` }} />
      <div ref={parent} className="game-frame-canvas" />
    </div>
  )
}
