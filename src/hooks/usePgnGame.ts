import { useState, useCallback } from 'react'
import { Chess } from 'chess.js'

export interface PgnMove {
  index: number
  san: string
  fen: string
  moveNumber: number
  color: 'w' | 'b'
  isVariation?: boolean   // true if user-added (not from original PGN)
}

export interface PgnGame {
  moves: PgnMove[]
  originalMoves: PgnMove[]  // the unmodified PGN line (for restore on back)
  startFen: string
  headers: Record<string, string>
  forkIndex: number | null  // index at which the user diverged (null = no fork)
}

export interface PgnGameState {
  game: PgnGame | null
  currentIndex: number
  currentFen: string
  error: string | null
  loadPgn: (pgn: string) => void
  goTo: (index: number) => void
  goNext: () => void
  goPrev: () => void
  goStart: () => void
  goEnd: () => void
  clearGame: () => void
  makeMove: (move: string) => boolean  // fork: truncate future + append
}

export function usePgnGame(defaultFen: string): PgnGameState {
  const [game, setGame] = useState<PgnGame | null>(null)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [error, setError] = useState<string | null>(null)

  const loadPgn = useCallback((pgn: string) => {
    try {
      const chess = new Chess()
      chess.loadPgn(pgn.trim())

      const history = chess.history({ verbose: true })
      const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

      const replay = new Chess()
      const moves: PgnMove[] = history.map((m, i) => {
        replay.move(m.san)
        return {
          index: i,
          san: m.san,
          fen: replay.fen(),
          moveNumber: Math.floor(i / 2) + 1,
          color: (i % 2 === 0 ? 'w' : 'b') as 'w' | 'b',
        }
      })

      const headers: Record<string, string> = {}
      for (const [key, value] of Object.entries(chess.header())) {
        if (value != null) headers[key] = value
      }

      setGame({ moves, originalMoves: [...moves], startFen, headers, forkIndex: null })
      setCurrentIndex(-1)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid PGN')
    }
  }, [])

  const makeMove = useCallback((move: string): boolean => {
    if (!game) return false

    // Current FEN to apply the move to
    const fen = currentIndex >= 0 ? game.moves[currentIndex].fen : game.startFen

    try {
      const chess = new Chess(fen)
      const result = chess.move(move)
      if (!result) return false

      const newMoveIndex = currentIndex + 1
      const newMove: PgnMove = {
        index: newMoveIndex,
        san: result.san,
        fen: chess.fen(),
        moveNumber: Math.floor(newMoveIndex / 2) + 1,
        color: (newMoveIndex % 2 === 0 ? 'w' : 'b') as 'w' | 'b',
        isVariation: true,
      }

      // Determine fork point
      const forkIndex = game.forkIndex ?? newMoveIndex

      // Truncate everything after currentIndex, append the new move
      const keptMoves = game.moves.slice(0, currentIndex + 1)
      const newMoves = [...keptMoves, newMove]

      // Re-index
      const reindexed = newMoves.map((m, i) => ({ ...m, index: i }))

      setGame({
        ...game,
        moves: reindexed,
        forkIndex,
      })
      setCurrentIndex(newMoveIndex)
      return true
    } catch {
      return false
    }
  }, [game, currentIndex])

  const goTo = useCallback((index: number) => {
    if (!game) return

    // If navigating back before the fork point, restore original moves
    if (game.forkIndex !== null && index < game.forkIndex) {
      setGame({
        ...game,
        moves: [...game.originalMoves],
        forkIndex: null,
      })
    }

    setCurrentIndex(index)
  }, [game])

  const goNext = useCallback(() => {
    setCurrentIndex((i) => {
      if (!game) return i
      return Math.min(i + 1, game.moves.length - 1)
    })
  }, [game])

  const goPrev = useCallback(() => {
    if (!game) return

    const newIndex = Math.max(currentIndex - 1, -1)

    // If going back before fork, restore original line
    if (game.forkIndex !== null && newIndex < game.forkIndex) {
      setGame({
        ...game,
        moves: [...game.originalMoves],
        forkIndex: null,
      })
    }

    setCurrentIndex(newIndex)
  }, [game, currentIndex])

  const goStart = useCallback(() => {
    if (game?.forkIndex !== null && game) {
      setGame({ ...game, moves: [...game.originalMoves], forkIndex: null })
    }
    setCurrentIndex(-1)
  }, [game])

  const goEnd = useCallback(() => {
    setCurrentIndex(game ? game.moves.length - 1 : -1)
  }, [game])

  const clearGame = useCallback(() => {
    setGame(null)
    setCurrentIndex(-1)
    setError(null)
  }, [])

  const currentFen =
    game && currentIndex >= 0
      ? game.moves[currentIndex].fen
      : game
        ? game.startFen
        : defaultFen

  return {
    game,
    currentIndex,
    currentFen,
    error,
    loadPgn,
    goTo,
    goNext,
    goPrev,
    goStart,
    goEnd,
    clearGame,
    makeMove,
  }
}
