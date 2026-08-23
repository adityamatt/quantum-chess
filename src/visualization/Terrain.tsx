import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { lerpFields } from '@/chess/interpolation'

const TERRAIN_SIZE = 64
const GRID = TERRAIN_SIZE - 1
const BOARD_WIDTH = 10
const HEIGHT_SCALE = 0.15

interface Props {
  heightField: Float32Array   // interpolated 64x64 (absolute piece values — both sides up)
  colorField: number[][]      // raw 8x8 attack field for base color
  prevHeightField: Float32Array | null
  discreteHeight: boolean
  rawPieceField: number[][]   // raw 8x8 signed piece field
  pieceColors: number[][]     // raw 8x8: 1=white, -1=black, 0=empty
}

/**
 * Attack-based colormap:
 * Positive (black attack) → red, Negative (white attack) → blue, Zero → white
 */
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

// Piece side colors
const WHITE_PIECE_COLOR = new THREE.Color(0.95, 0.85, 0.5)
const BLACK_PIECE_COLOR = new THREE.Color(0.15, 0.15, 0.2)

export function Terrain({ heightField, colorField, prevHeightField, discreteHeight, rawPieceField, pieceColors }: Props) {
  const meshRef = useRef<THREE.Mesh>(null)
  const animRef = useRef({ t: 1, from: heightField, to: heightField })

  useEffect(() => {
    if (prevHeightField && prevHeightField !== heightField) {
      animRef.current = { t: 0, from: prevHeightField, to: heightField }
    }
  }, [heightField, prevHeightField])

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(BOARD_WIDTH, BOARD_WIDTH, GRID, GRID)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [])

  const colorMaxAbs = useMemo(() => {
    let m = 1
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        m = Math.max(m, Math.abs(colorField[r][f]))
      }
    }
    return m
  }, [colorField])

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (!mesh) return

    const anim = animRef.current
    if (anim.t < 1) {
      anim.t = Math.min(1, anim.t + delta * 2.5)
    }

    const heights = anim.t >= 1 ? anim.to : lerpFields(anim.from, anim.to, anim.t)
    const positions = mesh.geometry.attributes.position as THREE.BufferAttribute
    const colors = mesh.geometry.attributes.color as THREE.BufferAttribute

    if (!colors) {
      const colorArr = new Float32Array(positions.count * 3)
      mesh.geometry.setAttribute('color', new THREE.BufferAttribute(colorArr, 3))
    }

    const colAttr = mesh.geometry.attributes.color as THREE.BufferAttribute
    const verticesPerRow = TERRAIN_SIZE

    for (let i = 0; i < positions.count; i++) {
      const row = Math.floor(i / verticesPerRow)
      const col = i % verticesPerRow

      const worldX = (col / (TERRAIN_SIZE - 1)) * 10
      const worldZ = (row / (TERRAIN_SIZE - 1)) * 10

      const boardX = worldX - 1
      const boardZ = worldZ - 1

      const squareFile = Math.floor(boardX)
      const squareRank = Math.floor(boardZ)

      // Height: always positive (both sides go up)
      let h: number
      if (discreteHeight) {
        if (squareFile >= 0 && squareFile < 8 && squareRank >= 0 && squareRank < 8) {
          const fieldRank = 7 - squareRank
          h = Math.abs(rawPieceField[fieldRank]?.[squareFile] ?? 0) * HEIGHT_SCALE
        } else {
          h = 0
        }
      } else {
        // Smooth interpolated — already absolute in the field
        h = (heights[i] ?? 0) * HEIGHT_SCALE
      }
      positions.setY(i, h)

      // Color logic
      if (squareFile >= 0 && squareFile < 8 && squareRank >= 0 && squareRank < 8) {
        const fieldRank = 7 - squareRank
        const pieceColor = pieceColors[fieldRank]?.[squareFile] ?? 0
        const attackVal = colorField[fieldRank]?.[squareFile] ?? 0

        if (discreteHeight) {
          // Discrete mode: crisp split
          // Interior of cell = piece side color (top face of block)
          // Edge band of cell = attack field color (sides of block)
          const cellFracX = boardX - squareFile  // 0..1 within cell
          const cellFracZ = boardZ - squareRank  // 0..1 within cell
          const edge = 0.12  // hard edge band width

          const onEdge =
            cellFracX < edge || cellFracX > (1 - edge) ||
            cellFracZ < edge || cellFracZ > (1 - edge)

          if (pieceColor !== 0 && !onEdge && h > 0.01) {
            // Interior top face: piece side color
            const c = pieceColor === 1 ? WHITE_PIECE_COLOR : BLACK_PIECE_COLOR
            colAttr.setXYZ(i, c.r, c.g, c.b)
          } else {
            // Edge band or empty square: attack field color
            const c = attackToColor(attackVal, colorMaxAbs)
            colAttr.setXYZ(i, c.r, c.g, c.b)
          }
        } else {
          // Smooth mode: top 25% of cell gets piece color (hard boundary)
          const cellFracX = boardX - squareFile
          const cellFracZ = boardZ - squareRank
          const inTop25 = cellFracZ < 0.25 && cellFracX >= 0.12 && cellFracX <= 0.88

          if (pieceColor !== 0 && inTop25 && h > 0.01) {
            const c = pieceColor === 1 ? WHITE_PIECE_COLOR : BLACK_PIECE_COLOR
            colAttr.setXYZ(i, c.r, c.g, c.b)
          } else {
            const c = attackToColor(attackVal, colorMaxAbs)
            colAttr.setXYZ(i, c.r, c.g, c.b)
          }
        }
      } else {
        colAttr.setXYZ(i, 0.15, 0.15, 0.18)
      }
    }

    positions.needsUpdate = true
    colAttr.needsUpdate = true
    mesh.geometry.computeVertexNormals()
  })

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        vertexColors
        side={THREE.DoubleSide}
        roughness={0.6}
        metalness={0.1}
      />
    </mesh>
  )
}
