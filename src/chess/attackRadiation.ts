/**
 * Dirac Quantum Field Model — Kinetic Operator T̂ (Adaptive Depth)
 *
 * Depth propagation with A*-inspired heuristic pruning:
 * - Depth 1: piece moves to destination → value × λ^1
 * - Depth 2+: from destination, attacks radiate outward → value × λ^d
 * - Expansion heuristic decides which branches propagate deeper
 *
 * Pruning equation:
 *   expand(move, square, depth) = (pieceValue × λ^d × relevance(square)) ≥ τ
 *
 * relevance(s) = w₁×proximity(s) + w₂×underAttack(s) + w₃×targetValue(s)
 *
 * Termination: d ≥ d_max, amplitude < ε, reaches king, or fails heuristic.
 */

import { Chess, type Square, type Color } from 'chess.js'
import type { Position } from './position'
import { emptyField, type Field8x8, PIECE_VALUE } from './pieceField'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const ALL_SQUARES: Square[] = []
for (let r = 0; r < 8; r++) {
  for (let f = 0; f < 8; f++) {
    ALL_SQUARES.push(`${FILES[f]}${r + 1}` as Square)
  }
}

export const DEFAULT_TURN_WEIGHT = 0.5

// Heuristic constants
const MAX_DEPTH = 5
const TAU = 0.3          // pruning threshold
const EPSILON = 0.05     // minimum perceptible amplitude
const W_PROXIMITY = 0.5
const W_UNDER_ATTACK = 0.3
const W_TARGET = 0.2
const KING_PROXIMITY_WEIGHT = 50

/**
 * Chebyshev distance between two squares (king-move distance).
 */
function chebyshev(sq1: Square, sq2: Square): number {
  const f1 = sq1.charCodeAt(0) - 97
  const r1 = parseInt(sq1[1]) - 1
  const f2 = sq2.charCodeAt(0) - 97
  const r2 = parseInt(sq2[1]) - 1
  return Math.max(Math.abs(f1 - f2), Math.abs(r1 - r2))
}

/**
 * Find all piece positions for a given color.
 */
function findPieces(position: Chess, color: Color): { sq: Square; value: number; type: string }[] {
  const pieces: { sq: Square; value: number; type: string }[] = []
  for (const sq of ALL_SQUARES) {
    const p = position.get(sq)
    if (p && p.color === color) {
      pieces.push({ sq, value: PIECE_VALUE[p.type] || 1, type: p.type })
    }
  }
  return pieces
}

/**
 * Compute relevance(s) for the expansion heuristic.
 *
 * proximity: how close s is to opponent pieces (king weighted 50x)
 * underAttack: is a friendly piece here that needs support?
 * targetValue: is an opponent piece here worth capturing?
 */
function computeRelevance(
  sq: Square,
  player: Color,
  boardState: Chess,
): number {
  const opponent: Color = player === 'w' ? 'b' : 'w'

  // proximity — distance to opponent pieces
  const opponentPieces = findPieces(boardState, opponent)
  let rawProximity = 0
  for (const op of opponentPieces) {
    const dist = chebyshev(sq, op.sq)
    const weight = op.type === 'k' ? KING_PROXIMITY_WEIGHT : op.value
    rawProximity += weight / (dist + 1)
  }
  const proximity = Math.min(1.0, rawProximity / 20)

  // underAttack — friendly piece on this square needing support
  let underAttack = 0
  const pieceHere = boardState.get(sq)
  if (pieceHere && pieceHere.color === player) {
    const enemyAttackers = boardState.attackers(sq, opponent).length
    const friendlyDefenders = boardState.attackers(sq, player).length
    const netThreat = Math.max(0, enemyAttackers - friendlyDefenders)
    underAttack = Math.min(1.0, netThreat * (PIECE_VALUE[pieceHere.type] || 1) / 9)
  }

  // targetValue — opponent piece here worth taking
  let targetValue = 0
  if (pieceHere && pieceHere.color === opponent) {
    targetValue = (PIECE_VALUE[pieceHere.type] || 1) / 9
  }

  return W_PROXIMITY * proximity + W_UNDER_ATTACK * underAttack + W_TARGET * targetValue
}

/**
 * Recursive kinetic field propagation with heuristic pruning.
 *
 * At each depth:
 * 1. Enumerate legal moves from current position
 * 2. For each move, compute amplitude × relevance
 * 3. If above threshold, add contribution and recurse
 */
function propagateKinetic(
  field: Field8x8,
  boardState: Chess,
  player: Color,
  decay: number,
  depth: number,
  stats: { nodes: number; expanded: number; pruned: number },
): void {
  if (depth > MAX_DEPTH) return

  // Get all legal moves from this position
  const moves = boardState.moves({ verbose: true })
  const opponent: Color = player === 'w' ? 'b' : 'w'

  for (const move of moves) {
    const piece = boardState.get(move.from as Square)
    if (!piece) continue

    stats.nodes++

    const moverValue = PIECE_VALUE[piece.type] || 1

    // Apply the move to compute threat from destination
    let postMove: Chess
    try {
      postMove = new Chess(boardState.fen())
      postMove.move(move.san)
    } catch {
      continue
    }

    const destSq = move.to as Square
    const destRank = parseInt(move.to[1]) - 1
    const destFile = move.to.charCodeAt(0) - 97

    // Compute threat: sum of opponent piece values attacked from destination
    let threat = 0
    for (const sq of ALL_SQUARES) {
      if (sq === destSq) continue
      const attackers = postMove.attackers(sq, player)
      if (attackers.includes(destSq)) {
        const target = postMove.get(sq)
        if (target && target.color === opponent) {
          threat += PIECE_VALUE[target.type] || 1
        }
      }
    }

    // Amplitude = max(moverValue, threat) × λ^d
    // Quiet move: just moverValue. Threatening move: threat value dominates.
    const effectiveValue = Math.max(moverValue, threat)
    const moveAmplitude = effectiveValue * Math.pow(decay, depth)

    if (moveAmplitude < EPSILON) continue

    // Compute relevance of destination for expansion decision
    const relevance = computeRelevance(destSq, player, boardState)
    const expandScore = moveAmplitude * relevance

    // Add contribution to destination square
    field[destRank][destFile] += moveAmplitude

    // Debug: log moves near opponent king
    const opponentKingSq = ALL_SQUARES.find(sq => {
      const p = boardState.get(sq)
      return p?.type === 'k' && p.color === opponent
    })
    if (opponentKingSq && chebyshev(destSq, opponentKingSq) <= 2) {
      console.log(
        `[T̂ d${depth}] ${player} ${piece.type}${move.from}-${move.to} | threat=${threat} eff=${effectiveValue} amp=${moveAmplitude.toFixed(2)} rel=${relevance.toFixed(2)} expand=${expandScore.toFixed(2)} ${expandScore >= TAU ? '✅' : '❌'}`
      )
    }

    // Check if destination is the opponent king — terminate this branch
    const destPiece = postMove.get(destSq)
    if (destPiece && destPiece.type === 'k' && destPiece.color !== player) {
      continue
    }

    // Decide whether to propagate deeper
    if (depth >= MAX_DEPTH) continue
    if (expandScore < TAU) {
      stats.pruned++
      continue
    }

    stats.expanded++

    // Depth 2+: project attacks from destination with threat-based amplitude
    const decay2 = Math.pow(decay, depth + 1)
    for (const sq of ALL_SQUARES) {
      if (sq === destSq) continue
      const attackers = postMove.attackers(sq, player)
      if (attackers.includes(destSq)) {
        const attackRank = parseInt(sq[1]) - 1
        const attackFile = sq.charCodeAt(0) - 97
        field[attackRank][attackFile] += effectiveValue * decay2

        // Check if this attacked square has the opponent king
        const targetPiece = postMove.get(sq)
        if (targetPiece && targetPiece.type === 'k' && targetPiece.color !== player) {
          console.log(
            `[T̂ d${depth + 1}] ${player} KING HIT via ${piece.type}${move.from}-${move.to} → attacks ${sq} (king) | amp=${(effectiveValue * decay2).toFixed(2)}`
          )
          continue
        }
      }
    }
  }
}

/**
 * Compute the kinetic field T̂ for a single player using adaptive-depth propagation.
 */
function playerKineticField(position: Position, player: Color, decay: number): { field: Field8x8; stats: { nodes: number; expanded: number; pruned: number } } {
  const field = emptyField()
  const stats = { nodes: 0, expanded: 0, pruned: 0 }

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
    return { field, stats }
  }

  // Propagate from depth 1
  propagateKinetic(field, temp, player, decay, 1, stats)

  return { field, stats }
}

/**
 * Build the full Hamiltonian field Ĥ = V̂ + α × T̂
 *
 * V̂ = base attack field (attacker count)
 * T̂ = kinetic field (adaptive depth with heuristic pruning)
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
  // T̂ for both players (adaptive depth)
  const whiteResult = playerKineticField(position, 'w', decay)
  const blackResult = playerKineticField(position, 'b', decay)
  const whiteKinetic = whiteResult.field
  const blackKinetic = blackResult.field

  // Log node evaluation stats
  const totalNodes = whiteResult.stats.nodes + blackResult.stats.nodes
  const totalExpanded = whiteResult.stats.expanded + blackResult.stats.expanded
  const totalPruned = whiteResult.stats.pruned + blackResult.stats.pruned
  console.log(
    `[Dirac T̂] nodes: ${totalNodes} | expanded: ${totalExpanded} | pruned: ${totalPruned} | ratio: ${totalNodes > 0 ? ((totalPruned / totalNodes) * 100).toFixed(1) : 0}% pruned`
  )

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
