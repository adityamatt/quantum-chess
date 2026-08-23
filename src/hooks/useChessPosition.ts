import { useState, useCallback } from 'react'
import { parseFen, applyMove, STARTING_FEN } from '@/chess/position'
import type { Position } from '@/chess/position'

export interface ChessPositionState {
  position: Position
  fen: string
  history: string[]   // FEN history for navigation
  loadFen: (fen: string) => void
  makeMove: (move: string) => boolean
  reset: () => void
}

export function useChessPosition(): ChessPositionState {
  const [position, setPosition] = useState<Position>(() => parseFen(STARTING_FEN))
  const [history, setHistory] = useState<string[]>([STARTING_FEN])

  const loadFen = useCallback((fen: string) => {
    try {
      const p = parseFen(fen)
      setPosition(p)
      setHistory([p.fen()])
    } catch {
      // invalid FEN — silently ignore
    }
  }, [])

  const makeMove = useCallback((move: string): boolean => {
    try {
      const next = applyMove(position, move)
      setPosition(next)
      setHistory((h) => [...h, next.fen()])
      return true
    } catch {
      return false
    }
  }, [position])

  const reset = useCallback(() => {
    const p = parseFen(STARTING_FEN)
    setPosition(p)
    setHistory([STARTING_FEN])
  }, [])

  return { position, fen: position.fen(), history, loadFen, makeMove, reset }
}
