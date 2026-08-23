import { useRef, useEffect } from 'react'
import { Canvas, extend } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'
import { Terrain } from './Terrain'
import { DiscreteBlocks } from './DiscreteBlocks'
import { GradientVectors } from './GradientVectors'
import type { ChessFields } from '@/hooks/useChessFields'

extend({ MeshLineGeometry, MeshLineMaterial })

interface Props {
  fields: ChessFields
  showGradient: boolean
  showWireframe: boolean
  discreteHeight: boolean
  playerSide: 'w' | 'b'
  selectedSquare: string | null
  onSquareHover: (sq: string | null) => void
}

export function ChessField3D({
  fields,
  showGradient,
  discreteHeight,
  playerSide,
  selectedSquare: _selectedSquare,
  onSquareHover: _onSquareHover,
}: Props) {
  const prevRef = useRef<Float32Array | null>(null)

  // Track previous piece field for height animation
  useEffect(() => {
    return () => { prevRef.current = fields.pieceInterp }
  })

  const prevField = prevRef.current

  // Camera looks from behind your pieces
  const cameraZ = playerSide === 'w' ? 10 : -10

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        key={playerSide}
        camera={{ position: [0, 8, cameraZ], fov: 45 }}
        gl={{ antialias: true }}
        style={{ background: '#111827' }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1.2}
        />
        <directionalLight position={[-5, 5, -5]} intensity={0.3} />

        {/* Board content */}
        <group>
        {discreteHeight ? (
          <DiscreteBlocks
            absPieceField={fields.absPieceField}
            pieceColors={fields.pieceColors}
            attackField={fields.attackField}
          />
        ) : (
          <Terrain
            heightField={fields.pieceInterp}
            colorField={fields.attackField}
            prevHeightField={prevField}
            discreteHeight={false}
            rawPieceField={fields.absPieceField}
            pieceColors={fields.pieceColors}
          />
        )}

        {showGradient && (
          <GradientVectors
            gradient={fields.gradient}
            field={fields.attackInterp}
            visible={showGradient}
          />
        )}

        {/* 8x8 grid overlay — MeshLine for reliable thick lines */}
        <group>
          {Array.from({ length: 9 }).map((_, i) => {
            const pos = -4 + i
            return (
              <group key={`grid-${i}`}>
                {/* Vertical line (file boundary) */}
                <mesh renderOrder={999}>
                  <meshLineGeometry points={[pos, 0.05, -4, pos, 0.05, 4]} />
                  <meshLineMaterial color="#000000" lineWidth={0.04} depthTest={false} transparent opacity={0.85} />
                </mesh>
                {/* Horizontal line (rank boundary) */}
                <mesh renderOrder={999}>
                  <meshLineGeometry points={[-4, 0.05, pos, 4, 0.05, pos]} />
                  <meshLineMaterial color="#000000" lineWidth={0.04} depthTest={false} transparent opacity={0.85} />
                </mesh>
              </group>
            )
          })}
        </group>

        {/* Corner labels — a1 bottom-left, h1 bottom-right, a8 top-left, h8 top-right */}
        {[
          { label: 'a1', pos: [-4.3, 0.1, 4.3] as [number, number, number] },
          { label: 'h1', pos: [4.3, 0.1, 4.3] as [number, number, number] },
          { label: 'a8', pos: [-4.3, 0.1, -4.3] as [number, number, number] },
          { label: 'h8', pos: [4.3, 0.1, -4.3] as [number, number, number] },
        ].map(({ label, pos }) => (
          <Html key={label} position={pos} center style={{ pointerEvents: 'none' }}>
            <span style={{
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'monospace',
              color: '#94a3b8',
              textShadow: '0 1px 4px rgba(0,0,0,0.8)',
              userSelect: 'none',
            }}>
              {label}
            </span>
          </Html>
        ))}
        </group>

        <OrbitControls
          makeDefault
          minDistance={3}
          maxDistance={25}
          enablePan
        />
      </Canvas>

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 4,
          fontSize: 10,
          fontFamily: 'monospace',
          pointerEvents: 'none',
        }}
      >
        {/* Gradient bar */}
        <div style={{
          width: 120,
          height: 12,
          borderRadius: 3,
          background: 'linear-gradient(to right, #dc2626, #f59e0b, #ffffff, #22d3ee, #1d4ed8)',
          border: '1px solid rgba(255,255,255,0.15)',
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', width: 120, color: '#9ca3af' }}>
          <span>− black</span>
          <span>0</span>
          <span>+ white</span>
        </div>
      </div>
    </div>
  )
}
