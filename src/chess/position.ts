import { Chess } from 'chess.js'

export type Position = Chess

export const STARTING_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

export function parseFen(fen: string): Position {
  return new Chess(fen)
}

export function applyMove(position: Position, move: string): Position {
  const next = new Chess(position.fen())
  next.move(move)
  return next
}
