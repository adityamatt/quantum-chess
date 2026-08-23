import type { Field8x8 } from './pieceField'

export interface GradientField {
  dx: Field8x8
  dy: Field8x8
  magnitude: Field8x8
}

/**
 * Central-difference gradient approximation.
 * Uses forward/backward difference at edges.
 */
export function calculateGradient(field: Field8x8): GradientField {
  const dx: Field8x8 = Array.from({ length: 8 }, () => Array(8).fill(0))
  const dy: Field8x8 = Array.from({ length: 8 }, () => Array(8).fill(0))
  const magnitude: Field8x8 = Array.from({ length: 8 }, () => Array(8).fill(0))

  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      // dx: file direction
      const left = f > 0 ? field[r][f - 1] : field[r][f]
      const right = f < 7 ? field[r][f + 1] : field[r][f]
      dx[r][f] = (right - left) / (f > 0 && f < 7 ? 2 : 1)

      // dy: rank direction
      const down = r > 0 ? field[r - 1][f] : field[r][f]
      const up = r < 7 ? field[r + 1][f] : field[r][f]
      dy[r][f] = (up - down) / (r > 0 && r < 7 ? 2 : 1)

      magnitude[r][f] = Math.sqrt(dx[r][f] ** 2 + dy[r][f] ** 2)
    }
  }

  return { dx, dy, magnitude }
}
