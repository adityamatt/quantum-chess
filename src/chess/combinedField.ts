import type { Field8x8 } from './pieceField'
import { emptyField } from './pieceField'

export type FieldMode = 'piece' | 'attack' | 'combined'

export interface FieldConfig {
  attackWeight: number   // default 1.0; scale factor for attack field contribution
}

export const DEFAULT_FIELD_CONFIG: FieldConfig = {
  attackWeight: 1.0,
}

/**
 * combined[r][f] = pieceField[r][f] + attackWeight * attackField[r][f]
 */
export function combineFields(
  pieceField: Field8x8,
  attackField: Field8x8,
  config: FieldConfig = DEFAULT_FIELD_CONFIG,
): Field8x8 {
  const field = emptyField()
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      field[r][f] = pieceField[r][f] + config.attackWeight * attackField[r][f]
    }
  }
  return field
}

export function selectField(
  mode: FieldMode,
  pieceField: Field8x8,
  attackField: Field8x8,
  combined: Field8x8,
): Field8x8 {
  if (mode === 'piece') return pieceField
  if (mode === 'attack') return attackField
  return combined
}
