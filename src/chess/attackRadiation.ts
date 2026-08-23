/**
 * Attack Radiation Model
 *
 * For each square, look at which pieces attack it. For each attacker,
 * hypothetically place that piece on the attacked square and compute
 * what further squares it would attack from there. Add discounted
 * influence to those radiated squares.
 *
 * This is NOT legal-move-based (unlike turn expansion). It's a spatial
 * projection: "if pressure reaches here, where does it radiate next?"
 *
 * The more pieces attacking a square, the more radiation emanates from it.
 * Each attacker contributes its own radiation pattern from that square.
 */

import { Chess, type Square, type PieceSymbol, type Color } from 'chess.js'
import type { Position } from './position'
import { emptyField, type Field8x8 } from './pieceField'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

export const DEFAULT_RADIATION_WEIGHT = 0.4

/**
 * Get all squares that a piece of the given type would attack from a given square.
 * Uses a temporary board to compute attack patterns.
 */
function getAttackPattern(pieceType: PieceSymbol, square: Square, color: Color): Square[] {
  // Build a minimal valid FEN with kings out of the way + our piece on the target square
  // Kings go on a1 and h8 (or shifted if square conflicts)
  const wKingSq: Square = (square === 'a1' ? 'b1' : 'a1') as Square
  const bKingSq: Square = (square === 'h8' ? 'g8' : 'h8') as Square

  const temp = new Chess()
  temp.clear()
  temp.put({ type: 'k', color: 'w' }, wKingSq)
  temp.put({ type: 'k', color: 'b' }, bKingSq)
  temp.put({ type: pieceType, color }, square)

  // Find all squares this piece attacks from here
  const attacked: Square[] = []
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = `${FILES[f]}${r + 1}` as Square
      if (sq === square) continue
      // Check if our piece attacks this square
      const attackers = temp.attackers(sq, color)
      if (attackers.includes(square)) {
        attacked.push(sq)
      }
    }
  }
  return attacked
}

/**
 * Convert square string to field indices.
 */
function sqToIdx(sq: Square): [number, number] {
  const file = sq.charCodeAt(0) - 97 // 'a' = 0
  const rank = parseInt(sq[1]) - 1    // '1' = 0
  return [rank, file]
}

/**
 * Calculate the radiation field for a single player.
 *
 * For each square on the board:
 * 1. Find all pieces of this player that attack it
 * 2. For each attacker, compute what it would attack FROM this square
 * 3. Add discounted influence to those radiated squares
 *
 * The radiation from a square scales with how many pieces attack it —
 * more pressure on a square = stronger radiation outward.
 */
function playerRadiationField(position: Position, player: Color): Field8x8 {
  const radiation = emptyField()

  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = `${FILES[f]}${r + 1}` as Square

      // Get all pieces of this player attacking this square
      const attackerSquares = position.attackers(sq, player)
      if (attackerSquares.length === 0) continue

      // For each attacker, project its attack pattern from this square
      for (const attackerSq of attackerSquares) {
        const piece = position.get(attackerSq as Square)
        if (!piece) continue

        // Get what this piece type would attack from the target square
        const radiatedSquares = getAttackPattern(piece.type, sq, player)

        // Add radiation to each projected square
        for (const radSq of radiatedSquares) {
          const [rr, rf] = sqToIdx(radSq)
          // Each attacker contributes 1.0 radiation to its projected squares
          radiation[rr][rf] += 1.0
        }
      }
    }
  }

  return radiation
}

/**
 * Calculate the current attack field for a single player (count of attackers per square).
 */
function playerAttackField(position: Position, player: Color): Field8x8 {
  const field = emptyField()
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = `${FILES[f]}${r + 1}` as Square
      field[r][f] = position.attackers(sq, player).length
    }
  }
  return field
}

/**
 * Combine current attacks with radiation:
 * effective[r][f] = current[r][f] + weight * radiation[r][f]
 */
function combineWithRadiation(
  current: Field8x8,
  radiation: Field8x8,
  weight: number,
): Field8x8 {
  const effective = emptyField()
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      effective[r][f] = current[r][f] + weight * radiation[r][f]
    }
  }
  return effective
}

/**
 * Build the signed radiation attack field for visualization.
 *
 * Both players get radiation computed. The active player (whose turn it is)
 * uses radiation; the opponent uses only current attacks (or also radiation
 * for symmetric mode).
 *
 * Sign convention: white = negative, black = positive.
 */
export function buildRadiationAttackField(
  position: Position,
  weight: number = DEFAULT_RADIATION_WEIGHT,
): Field8x8 {
  const whiteAttack = playerAttackField(position, 'w')
  const blackAttack = playerAttackField(position, 'b')
  const whiteRadiation = playerRadiationField(position, 'w')
  const blackRadiation = playerRadiationField(position, 'b')

  const whiteEffective = combineWithRadiation(whiteAttack, whiteRadiation, weight)
  const blackEffective = combineWithRadiation(blackAttack, blackRadiation, weight)

  // Signed: black - white
  const field = emptyField()
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      field[r][f] = blackEffective[r][f] - whiteEffective[r][f]
    }
  }

  return field
}
