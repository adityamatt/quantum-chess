import type { Position } from "./position";

export type Field8x8 = number[][]; // [rank0..7][file0..7], rank 0 = rank 1 on board

export const PIECE_VALUE: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 11,
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

export function emptyField(): Field8x8 {
  return Array.from({ length: 8 }, () => Array(8).fill(0));
}

/**
 * 8x8 signed piece value field.
 * White pieces = positive, black pieces = negative.
 * Index: field[rank][file], rank 0 = rank 1, file 0 = file a.
 */
export function calculatePieceField(position: Position): Field8x8 {
  const field = emptyField();

  for (let rankIdx = 0; rankIdx < 8; rankIdx++) {
    for (let fileIdx = 0; fileIdx < 8; fileIdx++) {
      const sq = `${FILES[fileIdx]}${rankIdx + 1}` as Parameters<
        typeof position.get
      >[0];
      const piece = position.get(sq);
      if (!piece) continue;
      const val = PIECE_VALUE[piece.type] ?? 0;
      field[rankIdx][fileIdx] = piece.color === "w" ? val : -val;
    }
  }

  return field;
}
