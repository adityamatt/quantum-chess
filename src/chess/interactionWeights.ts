import type { Position } from './position'
import { emptyField, type Field8x8 } from './pieceField'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

// ── Piece values for ratio computation ───────────────────────────────────────

const PIECE_VAL: Record<string, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 12,
}

// ── Configurable parameters ──────────────────────────────────────────────────

export interface InteractionConfig {
  emptySquareWeight: number   // weight when attacking an empty square
  kingAttackWeight: number    // weight when anything attacks the king
  kingDangerK: number         // exponential steepness for escape pressure
  kingAttackingPiece: number  // weight when king attacks a non-king piece
}

export const DEFAULT_INTERACTION_CONFIG: InteractionConfig = {
  emptySquareWeight: 0.3,
  kingAttackWeight: 50.0,
  kingDangerK: 3.0,
  kingAttackingPiece: 1.0,
}

// ── Interaction weight (asymmetric, ratio-based) ─────────────────────────────

/**
 * Weight for a single attacker→target relationship.
 * Attacker and target are piece type strings ('p','n','b','r','q','k') or null (empty).
 */
export function interactionWeight(
  attackerType: string,
  targetType: string | null,
  config: InteractionConfig = DEFAULT_INTERACTION_CONFIG,
): number {
  // Attacking empty square
  if (!targetType) return config.emptySquareWeight

  // Anything attacking king
  if (targetType === 'k') {
    if (attackerType === 'k') return 0 // king vs king nonsensical
    return config.kingAttackWeight
  }

  // King attacking a piece (not a favorable trade, just coverage)
  if (attackerType === 'k') return config.kingAttackingPiece

  // Piece vs piece: ratio-based (targetValue / attackerValue)
  const attackerVal = PIECE_VAL[attackerType] ?? 1
  const targetVal = PIECE_VAL[targetType] ?? 1
  return Math.max(0.1, targetVal / attackerVal)
}

// ── King escape pressure ─────────────────────────────────────────────────────

/**
 * Get all adjacent squares for a given square (accounting for board edges).
 * Returns 3 (corner), 5 (edge), or 8 (center) squares.
 */
function getAdjacentSquares(square: string): string[] {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0)
  const rank = parseInt(square[1]) - 1
  const adjacent: string[] = []

  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (df === 0 && dr === 0) continue
      const f = file + df
      const r = rank + dr
      if (f >= 0 && f < 8 && r >= 0 && r < 8) {
        adjacent.push(String.fromCharCode('a'.charCodeAt(0) + f) + (r + 1))
      }
    }
  }
  return adjacent
}

/**
 * Calculate king danger multiplier based on escape squares controlled by opponent.
 * Uses exponential: exp(k * (1 - freeEscapes/totalEscapes))
 *
 * Corner king (3 squares) with 2 blocked: exp(3 * 0.67) = 7.4×
 * Center king (8 squares) with 6 blocked: exp(3 * 0.75) = 9.5×
 */
export function kingDangerMultiplier(
  position: Position,
  kingSquare: string,
  opponentColor: 'w' | 'b',
  config: InteractionConfig = DEFAULT_INTERACTION_CONFIG,
): number {
  const adjacent = getAdjacentSquares(kingSquare)
  const totalEscapes = adjacent.length

  let blockedEscapes = 0
  for (const sq of adjacent) {
    const attackers = position.attackers(
      sq as Parameters<typeof position.attackers>[0],
      opponentColor,
    )
    if (attackers.length > 0) blockedEscapes++
  }

  const escapeProbability = (totalEscapes - blockedEscapes) / totalEscapes
  return Math.exp(config.kingDangerK * (1 - escapeProbability))
}

// ── Weighted attack field ────────────────────────────────────────────────────

type Color = 'w' | 'b'

/**
 * Calculate the interaction-weighted attack field for a single player.
 *
 * For each square:
 *   influence = sum(interactionWeight(attacker_i, target)) for each attacker
 *   If target is the opponent's king: multiply by kingDangerMultiplier
 */
export function calculateWeightedAttackField(
  position: Position,
  attackingPlayer: Color,
  config: InteractionConfig = DEFAULT_INTERACTION_CONFIG,
): Field8x8 {
  const field = emptyField()
  const opponentColor: Color = attackingPlayer === 'w' ? 'b' : 'w'

  // Find opponent's king square for danger multiplier
  let opponentKingSquare: string | null = null
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = `${FILES[f]}${r + 1}` as Parameters<typeof position.get>[0]
      const piece = position.get(sq)
      if (piece && piece.type === 'k' && piece.color === opponentColor) {
        opponentKingSquare = `${FILES[f]}${r + 1}`
      }
    }
  }

  // Compute king danger multiplier once
  const kingMultiplier = opponentKingSquare
    ? kingDangerMultiplier(position, opponentKingSquare, attackingPlayer, config)
    : 1.0

  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = `${FILES[f]}${r + 1}` as Parameters<typeof position.attackers>[0]

      // Who is on this square?
      const target = position.get(sq as Parameters<typeof position.get>[0])
      const targetType = target?.type ?? null

      // Only count attacks from the attacking player
      const attackers = position.attackers(sq, attackingPlayer)
      if (attackers.length === 0) continue

      // Sum interaction weights for each attacker
      let influence = 0
      for (const attackerSq of attackers) {
        const attackerPiece = position.get(attackerSq as Parameters<typeof position.get>[0])
        if (!attackerPiece) continue
        influence += interactionWeight(attackerPiece.type, targetType, config)
      }

      // Apply king danger multiplier if this square has the opponent's king
      if (targetType === 'k' && target?.color === opponentColor) {
        influence *= kingMultiplier
      }

      field[r][f] = influence
    }
  }

  return field
}

/**
 * Build signed interaction-weighted attack field.
 * Same convention: white attacks = negative, black attacks = positive.
 */
export function buildInteractionAttackField(
  position: Position,
  config: InteractionConfig = DEFAULT_INTERACTION_CONFIG,
): Field8x8 {
  const whiteAttack = calculateWeightedAttackField(position, 'w', config)
  const blackAttack = calculateWeightedAttackField(position, 'b', config)

  const field = emptyField()
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      field[r][f] = blackAttack[r][f] - whiteAttack[r][f]
    }
  }

  return field
}
