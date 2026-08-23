import { Chess } from 'chess.js'
import type { Position } from './position'
import { emptyField, type Field8x8 } from './pieceField'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

export const DEFAULT_TURN_EXPANSION_WEIGHT = 0.5

type Color = 'w' | 'b'

// ── Current Attack Field ─────────────────────────────────────────────────────

/**
 * Calculate attack field for a single player (unsigned, 0+ values).
 * Returns how many of that player's pieces attack each square.
 */
function playerAttackField(position: Position, player: Color): Field8x8 {
  const field = emptyField()
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = `${FILES[f]}${r + 1}` as Parameters<typeof position.attackers>[0]
      field[r][f] = position.attackers(sq, player).length
    }
  }
  return field
}

// ── Move Viability ───────────────────────────────────────────────────────────

/**
 * Calculate the viability of a move for turn expansion purposes.
 *
 * MVP rule:
 * - King moves that result in the king being in check → viability 0
 *   (chess.js already filters illegal moves, but we check if the resulting
 *    position has the king attacked by the opponent — this catches moves
 *    where the king lands on an attacked square in the resulting position)
 * - All other moves → viability 1
 *
 * Note: chess.js only generates legal moves, so a king move in the legal
 * move list means the king isn't in check after the move. However, we still
 * apply viability=0 if the destination square is attacked by the opponent,
 * because while the move is legal, the king is under threat there —
 * the square is not "safe" for expansion purposes even if it's technically
 * reachable (the opponent choosing not to capture doesn't make it safe).
 *
 * Wait — actually chess.js won't generate a king move to an attacked square.
 * That's an illegal move. So all legal king moves have viability=1 by default.
 *
 * The real scenario from the spec: the king CAN'T move to g1 if it's attacked.
 * chess.js already handles this — that move won't be in the legal moves list.
 * So the current implementation is already correct for the MVP case.
 *
 * But there's a subtlety: after a non-king move, the resulting position's
 * attack field includes the king's current coverage from its new
 * (unchanged) position. The concern is about future propagation from
 * positions that are dangerous. Let's keep the viability framework for
 * extensibility but start with binary: king move to opponent-attacked
 * destination = 0, else = 1.
 */
function calculateMoveViability(
  nextPosition: Position,
  move: { piece: string; to: string },
  player: Color,
): number {
  if (move.piece === 'k') {
    // Check if destination square is attacked by opponent in the resulting position
    const opponent: Color = player === 'w' ? 'b' : 'w'
    const sq = move.to as Parameters<typeof nextPosition.attackers>[0]
    const attackers = nextPosition.attackers(sq, opponent)
    if (attackers.length > 0) {
      return 0
    }
  }
  return 1
}

// ── Viability-Weighted Future Attack Field ───────────────────────────────────

/**
 * For each legal move:
 * 1. Apply the move
 * 2. Calculate viability of that move
 * 3. Compute the attack field in the resulting position
 * 4. Weight it by viability
 * 5. Element-wise max across all weighted results
 */
export function calculateWeightedFutureAttackField(
  position: Position,
  player: Color,
): Field8x8 {
  const maxField = emptyField()
  const moves = position.moves({ verbose: true })

  for (const move of moves) {
    const next = new Chess(position.fen())
    next.move(move.san)

    const viability = calculateMoveViability(next, move, player)
    if (viability === 0) continue // Skip entirely — no contribution

    const afterField = playerAttackField(next, player)

    // Element-wise max of (viability * afterField)
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const weighted = viability * afterField[r][f]
        if (weighted > maxField[r][f]) {
          maxField[r][f] = weighted
        }
      }
    }
  }

  return maxField
}

// ── Effective Field (current + discounted future) ────────────────────────────

/**
 * effective[r][f] = max(current[r][f], weight × future[r][f])
 */
export function calculateEffectiveAttackField(
  current: Field8x8,
  future: Field8x8,
  weight: number,
): Field8x8 {
  const effective = emptyField()
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      effective[r][f] = Math.max(current[r][f], weight * future[r][f])
    }
  }
  return effective
}

// ── Combined Turn-Adjusted Field ─────────────────────────────────────────────

/**
 * Full pipeline: current + viability-weighted future for the active player.
 */
export function calculateTurnAdjustedAttackField(
  position: Position,
  player: Color,
  weight: number = DEFAULT_TURN_EXPANSION_WEIGHT,
): { current: Field8x8; future: Field8x8; effective: Field8x8 } {
  const current = playerAttackField(position, player)
  const future = calculateWeightedFutureAttackField(position, player)
  const effective = calculateEffectiveAttackField(current, future, weight)
  return { current, future, effective }
}

// ── Signed Field for Visualization ───────────────────────────────────────────

/**
 * Build the signed attack field with viability-weighted turn expansion
 * applied to the active player.
 * Sign convention: white = negative, black = positive.
 */
export function buildTurnExpandedAttackField(
  position: Position,
  weight: number = DEFAULT_TURN_EXPANSION_WEIGHT,
): Field8x8 {
  const turn = position.turn()
  const opponent: Color = turn === 'w' ? 'b' : 'w'

  const { effective: activeEffective } = calculateTurnAdjustedAttackField(position, turn, weight)
  const opponentField = playerAttackField(position, opponent)

  const field = emptyField()
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const w = turn === 'w' ? activeEffective[r][f] : opponentField[r][f]
      const b = turn === 'b' ? activeEffective[r][f] : opponentField[r][f]
      field[r][f] = b - w
    }
  }

  return field
}
