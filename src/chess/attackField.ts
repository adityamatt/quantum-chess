import type { Position } from './position'
import { emptyField, type Field8x8 } from './pieceField'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

/**
 * 8x8 signed attack influence field.
 * Convention (opposite of piece field so combined reads naturally):
 *   White attacks = negative (white pressure pushing down)
 *   Black attacks = positive (black pressure pushing up)
 *
 * Multiple attacks on the same square accumulate.
 */
export function calculateAttackField(position: Position): Field8x8 {
  const field = emptyField()

  for (let rankIdx = 0; rankIdx < 8; rankIdx++) {
    for (let fileIdx = 0; fileIdx < 8; fileIdx++) {
      const sq = `${FILES[fileIdx]}${rankIdx + 1}` as Parameters<typeof position.attackers>[0]
      const whiteAttackers = position.attackers(sq, 'w').length
      const blackAttackers = position.attackers(sq, 'b').length
      // white attacks = negative, black attacks = positive
      field[rankIdx][fileIdx] = blackAttackers - whiteAttackers
    }
  }

  return field
}
