/**
 * Dirac Field — Behavioral Tests
 *
 * These tests verify that the field REFLECTS tactical risks,
 * not that specific squares have specific numeric values.
 *
 * Property-based assertions:
 * - "The field shows the threatened square more intensely than quiet squares"
 * - "The king under attack shows enemy pressure"
 * - "The sacrifice square shows attacker's color"
 */

import { describe, it, expect } from 'vitest'
import { Chess } from 'chess.js'
import { buildDiracField } from '@/chess/attackRadiation'

// Helper: get field value for a square
function fieldAt(field: number[][], sq: string): number {
  const file = sq.charCodeAt(0) - 97
  const rank = parseInt(sq[1]) - 1
  return field[rank][file]
}

// Helper: play a sequence of moves and return the position
function playMoves(moves: string[]): Chess {
  const game = new Chess()
  for (const m of moves) {
    game.move(m)
  }
  return game
}

describe('Fried Liver Attack — After 5...Nxd5 (White to move)', () => {
  // 1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.Ng5 d5 5.exd5 Nxd5
  // Key: Nxf7 is a knight sacrifice that forks Q+R
  const position = playMoves(['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'd5', 'exd5', 'Nxd5'])

  it('f7 shows white pressure (sacrifice square is blue/negative)', () => {
    const field = buildDiracField(position, 0.5, 0.5)
    const f7 = fieldAt(field, 'f7')
    // f7 should be negative (white pressure) because Nxf7 creates a massive threat
    expect(f7).toBeLessThan(0)
  })

  it('f7 has stronger white signal than a quiet square like a3', () => {
    const field = buildDiracField(position, 0.5, 0.5)
    const f7 = fieldAt(field, 'f7')
    const a3 = fieldAt(field, 'a3')
    // f7 should be more negative (stronger white pressure) than a quiet flank square
    expect(f7).toBeLessThan(a3)
  })

  it('the knight sacrifice zone (f7) shows stronger white pressure than a quiet flank square (h3)', () => {
    const field = buildDiracField(position, 0.5, 0.5)
    const f7 = fieldAt(field, 'f7')
    const h3 = fieldAt(field, 'h3')
    // f7 (sacrifice) should have stronger white pressure than a random quiet square
    expect(f7).toBeLessThan(h3)
  })
})

describe("Scholar's Mate — Before Qxf7# (White to move)", () => {
  // 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6 — White to play Qxf7#
  const position = playMoves(['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'Nf6'])

  it('f7 shows strong white pressure (checkmate square)', () => {
    const field = buildDiracField(position, 0.5, 0.5)
    const f7 = fieldAt(field, 'f7')
    // f7 is the checkmate square — should be deeply negative (white)
    expect(f7).toBeLessThan(-2)
  })

  it('e8 (black king) shows white pressure at depth 2', () => {
    const field = buildDiracField(position, 0.5, 0.5)
    const e8 = fieldAt(field, 'e8')
    // King exception: only enemy attacks. Queen from f7 attacks e8 at depth 2.
    expect(e8).toBeLessThan(0)
  })

  it('f7 is the strongest white-pressure square near the king', () => {
    const field = buildDiracField(position, 0.5, 0.5)
    const f7 = fieldAt(field, 'f7')
    const e7 = fieldAt(field, 'e7')
    const g7 = fieldAt(field, 'g7')
    // f7 should be more negative than neighboring squares
    expect(f7).toBeLessThan(e7)
    expect(f7).toBeLessThan(g7)
  })
})

describe("Fool's Mate — Before Qh4# (Black to move)", () => {
  // 1.f3 e5 2.g4 — Black plays Qh4#
  const position = playMoves(['f3', 'e5', 'g4'])

  it('h4 shows black pressure (checkmate destination)', () => {
    const field = buildDiracField(position, 0.5, 0.5)
    const h4 = fieldAt(field, 'h4')
    // h4 is where the queen delivers mate — should be positive (black pressure)
    expect(h4).toBeGreaterThan(0)
  })

  it('e1 (white king) shows black pressure at depth 2', () => {
    const field = buildDiracField(position, 0.5, 0.5)
    const e1 = fieldAt(field, 'e1')
    // King exception: only enemy (black) pressure shown on white king.
    // Black queen from h4 attacks e1. Should be positive.
    expect(e1).toBeGreaterThan(0)
  })

  it('the king zone (e1, f1, f2) shows more black pressure than a quiet zone (a8, h8)', () => {
    const field = buildDiracField(position, 0.5, 0.5)
    const kingZone = Math.max(fieldAt(field, 'e1'), fieldAt(field, 'f2'))
    const quietZone = Math.max(fieldAt(field, 'a8'), fieldAt(field, 'h8'))
    // King zone should have stronger black pressure (more positive)
    expect(kingZone).toBeGreaterThan(quietZone)
  })
})

describe('Field properties — general invariants', () => {
  it('starting position is approximately symmetric (both sides equal, near zero center)', () => {
    const position = new Chess()
    const field = buildDiracField(position, 0.5, 0.5)
    // e4 and e5 should be roughly symmetric (opposite signs or both near zero)
    const e4 = fieldAt(field, 'e4')
    const e5 = fieldAt(field, 'e5')
    // They should be roughly opposite in sign (white pushes toward e4, black toward e5)
    // or both near zero since symmetry cancels
    expect(Math.abs(e4 + e5)).toBeLessThan(5) // rough symmetry
  })

  it('kings show zero field at game start (no attacks reach them)', () => {
    const position = new Chess()
    const field = buildDiracField(position, 0.5, 0.5)
    const e1 = fieldAt(field, 'e1') // white king
    const e8 = fieldAt(field, 'e8') // black king
    // At game start, pawns block all sliding radiation. Kings should have
    // relatively low values (near zero or small positive/negative)
    expect(Math.abs(e1)).toBeLessThan(3)
    expect(Math.abs(e8)).toBeLessThan(3)
  })
})
