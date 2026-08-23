/**
 * Dirac Quantum Field Model — Kinetic Operator T̂ (Depth 2)
 *
 * Applies the principles from Dirac's "The Principles of Quantum Mechanics" (1930):
 *
 * - V̂ (Potential): Static attack field with per-square decay (handled by attackField.ts)
 * - T̂ (Kinetic): Movement disruption — distance = MOVES, not squares.
 *
 * Depth 1: piece moves to destination → destination gets value × λ^1
 * Depth 2: from that destination, what does the piece ATTACK? → those squares get value × λ^2
 *
 * This means a queen moving to h4 (depth 1) also colors e1 (depth 2) if it
 * attacks e1 from h4. The king now shows incoming threats before they land.
 *
 * Combined Hamiltonian: Ĥ[sq] = V̂[sq] + α × T̂[sq]
 */

import { Chess, type Square, type Color } from 'chess.js'
import type { Position } from './position'
import { emptyField, type Field8x8, PIECE_VALUE } from './pieceField'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

export const DEFAULT_TURN_WEIGHT = 0.5

/**
 * Compute the kinetic field T̂ for a single player (depth 2).
 *
 * Depth 1: For each legal move, destination gets pieceValue × λ^1
 * Depth 2: For each legal move, compute what the piece attacks FROM the
 *          destination (on the post-move board). Those squares get pieceValue × λ^2
 *
 * This naturally shows:
 *   - Where pieces can GO (depth 1)
 *   - What they THREATEN once they arrive (depth 2)
 *   - Checkmate threats appear on the king at depth 2
 */
function playerKineticField(position: Position, player: Color, decay: number): Field8x8 {
  const field = emptyField()

  // chess.js only gives legal moves for the side to move
  const fen = position.fen()
  const parts = fen.split(' ')
  const currentTurn = parts[1]

  let adjustedFen = fen
  if (currentTurn !== player) {
    parts[1] = player
    adjustedFen = parts.join(' ')
  }

  let temp: Chess
  try {
    temp = new Chess(adjustedFen)
  } catch {
    return field
  }

  const moves = temp.moves({ verbose: true })

  for (const move of moves) {
    const piece = position.get(move.from as Square)
    if (!piece) continue

    const value = PIECE_VALUE[piece.type] || 1

    // Depth 1: destination square gets value × λ^1
    const destRank = parseInt(move.to[1]) - 1
    const destFile = move.to.charCodeAt(0) - 97
    field[destRank][destFile] += value * decay

    // Depth 2: from the destination, what does this piece attack?
    // Apply the move on a temp board, then check what the piece attacks from there
    let postMove: Chess
    try {
      postMove = new Chess(adjustedFen)
      postMove.move(move.san)
    } catch {
      continue // illegal or problematic move, skip depth 2
    }

    // Find all squares attacked by this piece from its new position
    const decay2 = decay * decay // λ^2
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const sq = `${FILES[f]}${r + 1}` as Square
        if (sq === move.to) continue // skip the square it's already on

        const attackers = postMove.attackers(sq, player)
        if (attackers.includes(move.to as Square)) {
          field[r][f] += value * decay2
        }
      }
    }
  }

  return field
}

/**
 * Build the full Hamiltonian field Ĥ = V̂ + α × T̂
 *
 * V̂ = base attack field (attacker count)
 * T̂ = kinetic field (depth 2: destinations + attacks-from-destination)
 * α = turnWeight (strength slider)
 *
 * Sign convention: white = negative (blue), black = positive (red)
 * King exception: on king's square, only enemy contributions count.
 */
export function buildDiracField(
  position: Position,
  turnWeight: number = DEFAULT_TURN_WEIGHT,
  decay: number = 0.5,
): Field8x8 {
  // T̂ for both players (depth 2)
  const whiteKinetic = playerKineticField(position, 'w', decay)
  const blackKinetic = playerKineticField(position, 'b', decay)

  // V̂ — base attack counts per player
  const whiteAttack = emptyField()
  const blackAttack = emptyField()
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = `${FILES[f]}${r + 1}` as Square
      whiteAttack[r][f] = position.attackers(sq, 'w').length
      blackAttack[r][f] = position.attackers(sq, 'b').length
    }
  }

  // Ĥ = V̂ + α × T̂ per player
  const whiteH = emptyField()
  const blackH = emptyField()
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      whiteH[r][f] = whiteAttack[r][f] + turnWeight * whiteKinetic[r][f]
      blackH[r][f] = blackAttack[r][f] + turnWeight * blackKinetic[r][f]
    }
  }

  // Signed field: black - white (with king exception)
  const field = emptyField()
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = `${FILES[f]}${r + 1}` as Square
      const piece = position.get(sq)

      if (piece?.type === 'k') {
        if (piece.color === 'w') {
          field[r][f] = blackH[r][f]
        } else {
          field[r][f] = -whiteH[r][f]
        }
      } else {
        field[r][f] = blackH[r][f] - whiteH[r][f]
      }
    }
  }

  return field
}
