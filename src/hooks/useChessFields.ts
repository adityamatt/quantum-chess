import { useMemo } from 'react'
import type { Position } from '@/chess/position'
import { calculatePieceField, emptyField } from '@/chess/pieceField'
import { calculateAttackField } from '@/chess/attackField'
import { buildTurnExpandedAttackField } from '@/chess/turnExpansion'
import { buildInteractionAttackField, DEFAULT_INTERACTION_CONFIG } from '@/chess/interactionWeights'
import { combineFields, type FieldConfig } from '@/chess/combinedField'
import { calculateGradient } from '@/chess/gradient'
import { interpolateField } from '@/chess/interpolation'

export const TERRAIN_SIZE = 64

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

export interface FieldOptions {
  attackWeight: number
  turnExpansion: boolean
  turnExpansionWeight: number
  interactionWeighted: boolean
}

export const DEFAULT_FIELD_OPTIONS: FieldOptions = {
  attackWeight: 1.0,
  turnExpansion: false,
  turnExpansionWeight: 0.5,
  interactionWeighted: false,
}

export interface ChessFields {
  pieceField: number[][]       // signed (white positive, black negative)
  absPieceField: number[][]    // absolute values (both sides positive for height)
  pieceColors: number[][]      // 1=white piece, -1=black piece, 0=empty
  attackField: number[][]
  combinedField: number[][]
  gradient: ReturnType<typeof calculateGradient>
  pieceInterp: Float32Array    // interpolated absolute piece field
  attackInterp: Float32Array
  combinedInterp: Float32Array
}

/**
 * Build pieceColors: 8x8 with 1 (white piece), -1 (black piece), 0 (empty).
 */
function buildPieceColors(position: Position): number[][] {
  const field = emptyField()
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = `${FILES[f]}${r + 1}` as Parameters<typeof position.get>[0]
      const piece = position.get(sq)
      if (piece) {
        field[r][f] = piece.color === 'w' ? 1 : -1
      }
    }
  }
  return field
}

/**
 * Build absolute piece field (both sides positive, for height).
 */
function buildAbsPieceField(pieceField: number[][]): number[][] {
  const field = emptyField()
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      field[r][f] = Math.abs(pieceField[r][f])
    }
  }
  return field
}

export function useChessFields(
  position: Position,
  options: FieldOptions = DEFAULT_FIELD_OPTIONS,
): ChessFields {
  return useMemo(() => {
    const pieceField = calculatePieceField(position)
    const absPieceField = buildAbsPieceField(pieceField)
    const pieceColors = buildPieceColors(position)

    let attackField: number[][]
    if (options.interactionWeighted) {
      attackField = buildInteractionAttackField(position, DEFAULT_INTERACTION_CONFIG)
    } else if (options.turnExpansion) {
      attackField = buildTurnExpandedAttackField(position, options.turnExpansionWeight)
    } else {
      attackField = calculateAttackField(position)
    }

    const config: FieldConfig = { attackWeight: options.attackWeight }
    const combinedField = combineFields(pieceField, attackField, config)
    const gradient = calculateGradient(attackField)

    return {
      pieceField,
      absPieceField,
      pieceColors,
      attackField,
      combinedField,
      gradient,
      pieceInterp: interpolateField(absPieceField, TERRAIN_SIZE),
      attackInterp: interpolateField(attackField, TERRAIN_SIZE),
      combinedInterp: interpolateField(combinedField, TERRAIN_SIZE),
    }
  }, [position, options.attackWeight, options.turnExpansion, options.turnExpansionWeight, options.interactionWeighted])
}
