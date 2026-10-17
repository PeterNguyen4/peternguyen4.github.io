export const TOOL_POP_MS = 300
export const TOOL_SETTLE_MS = 600
const TOOL_OVERSHOOT = 1.25

const POP_SHARE = TOOL_POP_MS / (TOOL_POP_MS + TOOL_SETTLE_MS)

export function popThenSettle(t: number) {
  if (t < POP_SHARE) {
    const u = t / POP_SHARE
    return TOOL_OVERSHOOT * (1 - (1 - u) * (1 - u))
  }
  const u = (t - POP_SHARE) / (1 - POP_SHARE)
  return TOOL_OVERSHOOT + (1 - TOOL_OVERSHOOT) * Math.sin((u * Math.PI) / 2)
}
