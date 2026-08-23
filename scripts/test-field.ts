#!/usr/bin/env npx tsx
/**
 * Dirac Field Test Engine
 *
 * Run specific positions through the field calculator and inspect results.
 * Usage: npx tsx scripts/test-field.ts
 */

import { Chess } from 'chess.js'
import type { Square } from 'chess.js'

// Inline the core logic so we can run standalone without Vite bundling
const PIECE_VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 11 }
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const ALL_SQUARES: Square[] = []
for (let r = 0; r < 8; r++) {
  for (let f = 0; f < 8; f++) {
    ALL_SQUARES.push(`${FILES[f]}${r + 1}` as Square)
  }
}

const MAX_DEPTH = 5
const TAU = 0.3
const EPSILON = 0.05
const W_PROXIMITY = 0.5
const W_UNDER_ATTACK = 0.3
const W_TARGET = 0.2
const KING_PROXIMITY_WEIGHT = 50

type Color = 'w' | 'b'
type Field8x8 = number[][]

function emptyField(): Field8x8 {
  return Array.from({ length: 8 }, () => Array(8).fill(0))
}

function chebyshev(sq1: Square, sq2: Square): number {
  const f1 = sq1.charCodeAt(0) - 97, r1 = parseInt(sq1[1]) - 1
  const f2 = sq2.charCodeAt(0) - 97, r2 = parseInt(sq2[1]) - 1
  return Math.max(Math.abs(f1 - f2), Math.abs(r1 - r2))
}

function computeRelevance(sq: Square, player: Color, boardState: Chess): number {
  const opponent: Color = player === 'w' ? 'b' : 'w'

  // proximity
  let rawProximity = 0
  for (const s of ALL_SQUARES) {
    const p = boardState.get(s)
    if (p && p.color === opponent) {
      const dist = chebyshev(sq, s)
      const weight = p.type === 'k' ? KING_PROXIMITY_WEIGHT : (PIECE_VALUE[p.type] || 1)
      rawProximity += weight / (dist + 1)
    }
  }
  const proximity = Math.min(1.0, rawProximity / 20)

  // underAttack
  let underAttack = 0
  const pieceHere = boardState.get(sq)
  if (pieceHere && pieceHere.color === player) {
    const enemyAtk = boardState.attackers(sq, opponent).length
    const friendlyDef = boardState.attackers(sq, player).length
    const netThreat = Math.max(0, enemyAtk - friendlyDef)
    underAttack = Math.min(1.0, netThreat * (PIECE_VALUE[pieceHere.type] || 1) / 9)
  }

  // targetValue
  let targetValue = 0
  if (pieceHere && pieceHere.color === opponent) {
    targetValue = (PIECE_VALUE[pieceHere.type] || 1) / 9
  }

  return W_PROXIMITY * proximity + W_UNDER_ATTACK * underAttack + W_TARGET * targetValue
}

interface Stats { nodes: number; expanded: number; pruned: number; logs: string[] }

function propagateKinetic(
  field: Field8x8, boardState: Chess, player: Color,
  decay: number, depth: number, stats: Stats
): void {
  if (depth > MAX_DEPTH) return

  const moves = boardState.moves({ verbose: true })
  const opponent: Color = player === 'w' ? 'b' : 'w'

  // Find opponent king for logging
  const opKingSq = ALL_SQUARES.find(sq => {
    const p = boardState.get(sq)
    return p?.type === 'k' && p.color === opponent
  })

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
    } catch { continue }

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
    const effectiveValue = Math.max(moverValue, threat)
    const moveAmplitude = effectiveValue * Math.pow(decay, depth)
    if (moveAmplitude < EPSILON) continue

    const relevance = computeRelevance(destSq, player, boardState)
    const expandScore = moveAmplitude * relevance

    field[destRank][destFile] += moveAmplitude

    // Log moves near king
    if (opKingSq && chebyshev(destSq, opKingSq) <= 2) {
      stats.logs.push(
        `[d${depth}] ${player} ${piece.type}${move.from}-${move.to} | threat=${threat} eff=${effectiveValue} amp=${moveAmplitude.toFixed(3)} rel=${relevance.toFixed(3)} expand=${expandScore.toFixed(3)} ${expandScore >= TAU ? '✅ EXPAND' : '❌ PRUNED'}`
      )
    }

    // Check if destination is opponent king
    const destPiece = postMove.get(destSq)
    if (destPiece && destPiece.type === 'k' && destPiece.color !== player) {
      stats.logs.push(`[d${depth}] ${player} ${piece.type}${move.from}-${move.to} → CAPTURES KING`)
      continue
    }

    if (depth >= MAX_DEPTH) continue
    if (expandScore < TAU) { stats.pruned++; continue }
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

        const targetPiece = postMove.get(sq)
        if (targetPiece && targetPiece.type === 'k' && targetPiece.color !== player) {
          stats.logs.push(
            `[d${depth + 1}] ${player} KING HIT: ${piece.type}${move.from}-${move.to} → from ${destSq} attacks ${sq} | amp=${(effectiveValue * decay2).toFixed(3)}`
          )
        }
      }
    }
  }
}

function computeField(fen: string, decay: number = 0.5, turnWeight: number = 0.5) {
  const position = new Chess(fen)
  const results: Record<string, { field: Field8x8; stats: Stats }> = {}

  for (const player of ['w', 'b'] as Color[]) {
    const field = emptyField()
    const stats: Stats = { nodes: 0, expanded: 0, pruned: 0, logs: [] }

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
      results[player] = { field, stats }
      continue
    }

    propagateKinetic(field, temp, player, decay, 1, stats)
    results[player] = { field, stats }
  }

  // Build signed Hamiltonian
  const whiteAttack = emptyField()
  const blackAttack = emptyField()
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = `${FILES[f]}${r + 1}` as Square
      whiteAttack[r][f] = position.attackers(sq, 'w').length
      blackAttack[r][f] = position.attackers(sq, 'b').length
    }
  }

  const finalField = emptyField()
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const wH = whiteAttack[r][f] + turnWeight * results['w'].field[r][f]
      const bH = blackAttack[r][f] + turnWeight * results['b'].field[r][f]
      const sq = `${FILES[f]}${r + 1}` as Square
      const piece = position.get(sq)
      if (piece?.type === 'k') {
        finalField[r][f] = piece.color === 'w' ? bH : -wH
      } else {
        finalField[r][f] = bH - wH
      }
    }
  }

  return { finalField, white: results['w'], black: results['b'], position }
}

function printField(field: Field8x8, position: Chess) {
  console.log('\n  a     b     c     d     e     f     g     h')
  for (let r = 7; r >= 0; r--) {
    let row = `${r + 1} `
    for (let f = 0; f < 8; f++) {
      const val = field[r][f]
      const sq = `${FILES[f]}${r + 1}` as Square
      const piece = position.get(sq)
      const pieceStr = piece ? `${piece.color}${piece.type}` : '  '
      const valStr = val >= 0 ? `+${val.toFixed(1)}` : val.toFixed(1)
      row += `${pieceStr}${valStr} `
    }
    console.log(row)
  }
}

function printSquares(field: Field8x8, squares: string[]) {
  for (const sqStr of squares) {
    const f = sqStr.charCodeAt(0) - 97
    const r = parseInt(sqStr[1]) - 1
    console.log(`  ${sqStr}: ${field[r][f].toFixed(3)}`)
  }
}

// ============================================================
// TEST CASES
// ============================================================

console.log('='.repeat(70))
console.log('FRIED LIVER ATTACK — After 1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.Ng5 d5 5.exd5 Nxd5')
console.log('White to move. Key move: Nxf7 (knight sacrifice)')
console.log('='.repeat(70))

// Position after 5...Nxd5 in Fried Liver
// White: Kg1? No, early game. Let me construct it properly.
// 1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.Ng5 d5 5.exd5 Nxd5
const friedLiver = new Chess()
const moves = ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'd5', 'exd5', 'Nxd5']
for (const m of moves) {
  friedLiver.move(m)
}
const friedLiverFen = friedLiver.fen()
console.log(`\nFEN: ${friedLiverFen}`)
console.log(`Turn: ${friedLiver.turn() === 'w' ? 'White' : 'Black'}`)
console.log(`\nLegal moves for white involving f7:`)
const wMoves = friedLiver.moves({ verbose: true }).filter(m => m.to === 'f7')
for (const m of wMoves) {
  console.log(`  ${m.piece}${m.from}-${m.to} (${m.san})`)
}

console.log('\n--- Computing field (decay=0.5, α=0.5) ---')
const result = computeField(friedLiverFen, 0.5, 0.5)

console.log('\n--- White kinetic stats ---')
console.log(`Nodes: ${result.white.stats.nodes} | Expanded: ${result.white.stats.expanded} | Pruned: ${result.white.stats.pruned}`)
console.log('\n--- White moves near black king ---')
for (const log of result.white.stats.logs) {
  console.log(`  ${log}`)
}

console.log('\n--- Key squares (final Hamiltonian) ---')
printSquares(result.finalField, ['e8', 'f7', 'g8', 'd8', 'e7', 'f8', 'g7', 'h7'])

console.log('\n--- Full field ---')
printField(result.finalField, result.position)

// Also test Scholar's mate position
console.log('\n\n' + '='.repeat(70))
console.log("SCHOLAR'S MATE — Before Qxf7# (White to move)")
console.log('='.repeat(70))

const scholars = new Chess()
const sMoves = ['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'Nf6']
for (const m of sMoves) {
  scholars.move(m)
}
console.log(`\nFEN: ${scholars.fen()}`)
console.log(`Turn: ${scholars.turn() === 'w' ? 'White' : 'Black'}`)

const sResult = computeField(scholars.fen(), 0.5, 0.5)
console.log('\n--- White moves near black king ---')
for (const log of sResult.white.stats.logs) {
  console.log(`  ${log}`)
}
console.log('\n--- Key squares ---')
printSquares(sResult.finalField, ['e8', 'f7', 'g8', 'e7', 'f8'])
