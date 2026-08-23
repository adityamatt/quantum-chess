import { useMemo } from 'react'
import * as THREE from 'three'

const HEIGHT_SCALE = 0.15
const WHITE_PIECE_COLOR = new THREE.Color(1, 0.5, 0.2)
const BLACK_PIECE_COLOR = new THREE.Color(0.15, 0.15, 0.2)

function attackToColor(v: number, maxAbs: number): THREE.Color {
  const t = Math.max(-1, Math.min(1, v / (maxAbs || 1)))
  if (t >= 0) {
    if (t < 0.5) { const s = t * 2; return new THREE.Color(1, 1 - s * 0.3, 1 - s) }
    else { const s = (t - 0.5) * 2; return new THREE.Color(1, 0.7 - s * 0.6, 0) }
  } else {
    const a = -t
    if (a < 0.5) { const s = a * 2; return new THREE.Color(1 - s, 1 - s * 0.3, 1) }
    else { const s = (a - 0.5) * 2; return new THREE.Color(0, 0.7 - s * 0.5, 1 - s * 0.3) }
  }
}

interface Props {
  absPieceField: number[][]   // 8x8 absolute piece values
  pieceColors: number[][]     // 8x8: 1=white, -1=black, 0=empty
  attackField: number[][]     // 8x8 attack field for coloring
}

/**
 * Renders each occupied square as a proper cuboid box:
 * - Top face center 25% = piece side color (white/black)
 * - All other surfaces (rest of top + 4 sides) = attack field color
 * - Empty squares rendered as flat slabs with attack color only
 */
export function DiscreteBlocks({ absPieceField, pieceColors, attackField }: Props) {
  const colorMaxAbs = useMemo(() => {
    let m = 1
    for (let r = 0; r < 8; r++)
      for (let f = 0; f < 8; f++)
        m = Math.max(m, Math.abs(attackField[r][f]))
    return m
  }, [attackField])

  const blocks = useMemo(() => {
    const result: {
      x: number; z: number; h: number
      pieceColor: number
      attackColor: THREE.Color
    }[] = []

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const val = absPieceField[rank][file]
        const h = val * HEIGHT_SCALE
        // World coords: file 0 -> x=-3.5, rank 0 (field top) -> z=-3.5
        const x = -4 + file + 0.5
        const z = 4 - rank - 0.5
        const ac = attackToColor(attackField[rank][file], colorMaxAbs)
        result.push({ x, z, h, pieceColor: pieceColors[rank][file], attackColor: ac })
      }
    }
    return result
  }, [absPieceField, pieceColors, attackField, colorMaxAbs])

  return (
    <group>
      {blocks.map(({ x, z, h, pieceColor, attackColor }, i) => {
        if (h < 0.001) {
          // Empty square: flat slab at ground level with attack color
          return (
            <mesh key={i} position={[x, 0.005, z]}>
              <boxGeometry args={[1, 0.01, 1]} />
              <meshStandardMaterial color={attackColor} roughness={0.5} metalness={0.05} />
            </mesh>
          )
        }

        // Occupied square: cuboid with custom face colors
        return <PieceBlock key={i} x={x} z={z} h={h} pieceColor={pieceColor} attackColor={attackColor} />
      })}
    </group>
  )
}

/**
 * Single piece block with:
 * - Main box = all attack field color (uniform, no vertex colors)
 * - Separate small plane on top = piece side color (25% area, crisp edges)
 * Two separate meshes = zero color interpolation at the boundary.
 */
function PieceBlock({ x, z, h, pieceColor, attackColor }: {
  x: number; z: number; h: number; pieceColor: number; attackColor: THREE.Color
}) {
  const topColor = pieceColor === 1 ? WHITE_PIECE_COLOR :
                   pieceColor === -1 ? BLACK_PIECE_COLOR : null

  return (
    <group>
      {/* Main box — all attack field color */}
      <mesh position={[x, h / 2, z]}>
        <boxGeometry args={[1, h, 1]} />
        <meshStandardMaterial color={attackColor} roughness={0.5} metalness={0.05} />
      </mesh>
      {/* Top center cap — 50% width x 50% depth = 25% area, piece side color */}
      {topColor && (
        <mesh position={[x, h + 0.001, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.5, 0.5]} />
          <meshStandardMaterial color={topColor} roughness={0.4} metalness={0.05} />
        </mesh>
      )}
    </group>
  )
}
