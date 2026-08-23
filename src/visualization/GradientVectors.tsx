import { useMemo } from 'react'
import * as THREE from 'three'
import type { GradientField } from '@/chess/gradient'

const HEIGHT_SCALE = 0.15
const BOARD_WIDTH = 8
const CELL = BOARD_WIDTH / 8

interface Props {
  gradient: GradientField
  field: Float32Array   // interpolated for height lookup
  visible: boolean
}

export function GradientVectors({ gradient, field, visible }: Props) {
  const arrows = useMemo(() => {
    if (!visible) return []
    const result: { position: [number, number, number]; dir: [number, number, number]; length: number }[] = []

    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const gx = gradient.dx[r][f]
        const gz = gradient.dy[r][f]
        const mag = gradient.magnitude[r][f]
        if (mag < 0.1) continue

        // World position: center of square
        const wx = (f - 3.5) * CELL
        const wz = (r - 3.5) * CELL

        // Height from interpolated field at this square center
        const fieldIdx = r * 64 + f * 8 // rough mapping
        const wy = (field[fieldIdx] ?? 0) * HEIGHT_SCALE + 0.05

        const len = Math.min(mag * 0.15, 0.4)
        const nx = gx / mag
        const nz = gz / mag

        result.push({
          position: [wx, wy, wz],
          dir: [nx, 0, nz],
          length: len,
        })
      }
    }
    return result
  }, [gradient, field, visible])

  if (!visible || arrows.length === 0) return null

  return (
    <group>
      {arrows.map((a, i) => {
        const origin = new THREE.Vector3(...a.position)
        const dir = new THREE.Vector3(...a.dir).normalize()
        return (
          <arrowHelper
            key={i}
            args={[dir, origin, a.length, 0xfbbf24, a.length * 0.4, a.length * 0.25]}
          />
        )
      })}
    </group>
  )
}
