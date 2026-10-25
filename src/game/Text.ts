import Phaser from 'phaser'
import { GLYPHS, GLYPH_ROWS } from './pixelFont'

const FONT_FAMILY = '"CalculatorExtended", monospace'
export const FONT_LOAD = '7px "CalculatorExtended"'

const TEXT_RESOLUTION = 1

const GLYPH_ADVANCE = 6

const glyphCache = new Map<string, HTMLCanvasElement>()

function inkRange(ch: string) {
  const rows = GLYPHS[ch]
  if (!rows) return null
  const cols = rows.flatMap((row) => [...row].flatMap((c, x) => (c === '#' ? [x] : [])))
  return cols.length ? { left: Math.min(...cols), right: Math.max(...cols) } : null
}

function advanceOf(ch: string) {
  const ink = inkRange(ch)
  return ink ? ink.right - ink.left + 2 : GLYPH_ADVANCE
}

function lineWidth(line: string) {
  let width = 0
  for (const ch of line) width += advanceOf(ch)
  return width
}

function glyphFor(ch: string, color: string, ascent: number, height: number) {
  const key = `${color}|${ch}`
  let glyph = glyphCache.get(key)
  if (glyph) return glyph
  glyph = document.createElement('canvas')
  glyph.width = GLYPH_ADVANCE
  glyph.height = height
  const ctx = glyph.getContext('2d')!
  ctx.fillStyle = color
  const rows = GLYPHS[ch] ?? GLYPHS['?']
  const left = inkRange(GLYPHS[ch] ? ch : '?')?.left ?? 0
  const top = Math.round(ascent) - GLYPH_ROWS
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === '#') ctx.fillRect(x - left, top + y, 1, 1)
  })
  glyphCache.set(key, glyph)
  return glyph
}

function redraw(text: Phaser.GameObjects.Text) {
  const { canvas, context, style, renderer } = text
  const { ascent, fontSize: lineHeight } = (style as unknown as { metrics: { ascent: number; fontSize: number } }).metrics
  const color = typeof style.color === 'string' ? style.color : '#fff'
  const wrapped = style.wordWrapWidth || style.wordWrapCallback ? text.runWordWrap(text.text) : text.text
  const lines = wrapped.split(/(?:\r\n|\r|\n)/)
  const maxLines = style.maxLines > 0 ? Math.min(style.maxLines, lines.length) : lines.length

  context.clearRect(0, 0, canvas.width, canvas.height)
  for (let i = 0; i < maxLines; i++) {
    const line = lines[i].trimEnd()
    const slack = canvas.width - lineWidth(line)
    let x = style.align === 'right' ? slack : style.align === 'center' ? Math.round(slack / 2) : 0
    const y = i * (lineHeight + text.lineSpacing)
    for (const ch of line) {
      if (ch !== ' ') context.drawImage(glyphFor(ch, color, ascent, lineHeight), x, y)
      x += advanceOf(ch)
    }
  }

  if (renderer && 'gl' in renderer && renderer.gl) {
    text.frame.source.glTexture = (renderer as Phaser.Renderer.WebGL.WebGLRenderer).canvasToTexture(
      canvas,
      text.frame.source.glTexture ?? undefined,
      true,
    )
  }
}

export function addText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string | string[],
  style: Phaser.Types.GameObjects.Text.TextStyle,
) {
  const label = scene.add.text(x, y, text, { ...style, fontFamily: FONT_FAMILY, fontSize: '7px', resolution: TEXT_RESOLUTION })
  const updateText = label.updateText
  label.updateText = function () {
    updateText.call(this)
    redraw(this)
    return this
  }
  label.updateText()
  return label
}
