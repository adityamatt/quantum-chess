import type { Field8x8 } from './pieceField'

export type FieldNxN = number[][]

/**
 * Pad an 8x8 field to 10x10 with a 1-cell zero border on all sides.
 * This ensures corner/edge pieces slope down to zero instead of clipping.
 */
export function padField(field: Field8x8): FieldNxN {
  const padded: FieldNxN = Array.from({ length: 10 }, () => Array(10).fill(0))
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      padded[r + 1][f + 1] = field[r][f]
    }
  }
  return padded
}

/**
 * Bilinear interpolation: upsample an NxN field to size×size.
 * Returns a flat Float32Array, row-major.
 * Row 0 = back of geometry (high rank / top border).
 */
export function interpolateField(field: Field8x8, size: number): Float32Array {
  // Pad to 10x10 for smooth edges
  const padded = padField(field)
  const N = 10
  const out = new Float32Array(size * size)
  const step = (N - 1) / (size - 1) // 0..9 in padded field coords

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const fx = col * step
      // Flip row: geometry row 0 = back = high index in field
      const fy = (size - 1 - row) * step

      const x0 = Math.min(Math.floor(fx), N - 2)
      const y0 = Math.min(Math.floor(fy), N - 2)
      const x1 = x0 + 1
      const y1 = y0 + 1

      const tx = fx - x0
      const ty = fy - y0

      const v =
        padded[y0][x0] * (1 - tx) * (1 - ty) +
        padded[y0][x1] * tx * (1 - ty) +
        padded[y1][x0] * (1 - tx) * ty +
        padded[y1][x1] * tx * ty

      out[row * size + col] = v
    }
  }

  return out
}

/**
 * Linearly interpolate between two flat fields for animation.
 */
export function lerpFields(
  a: Float32Array,
  b: Float32Array,
  t: number,
): Float32Array {
  const out = new Float32Array(a.length)
  for (let i = 0; i < a.length; i++) {
    out[i] = a[i] * (1 - t) + b[i] * t
  }
  return out
}
