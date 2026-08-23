import { useState, useMemo } from 'react'
import { useChessPosition } from '@/hooks/useChessPosition'
import { useChessFields } from '@/hooks/useChessFields'
import { usePgnGame } from '@/hooks/usePgnGame'
import { parseFen } from '@/chess/position'
import { ChessBoard } from '@/components/ChessBoard'
import { MoveNavigator } from '@/components/MoveNavigator'
import { FenInput } from '@/components/FenInput'
import { PgnImport } from '@/components/PgnImport'
import { GameSelector } from '@/components/GameSelector'
import { ChessField3D } from '@/visualization/ChessField3D'
import { FieldControls, DEFAULT_VIEW_OPTIONS } from '@/visualization/FieldControls'
import type { FieldViewOptions } from '@/visualization/FieldControls'

export default function App() {
  const freePlay = useChessPosition()
  const pgn = usePgnGame(freePlay.fen)

  const activeFen = pgn.game ? pgn.currentFen : freePlay.fen
  const activePosition = useMemo(() => parseFen(activeFen), [activeFen])

  const [fieldOptions, setFieldOptions] = useState<FieldViewOptions>(DEFAULT_VIEW_OPTIONS)

  const fields = useChessFields(activePosition, {
    attackWeight: fieldOptions.attackWeight,
    turnExpansion: fieldOptions.turnExpansion ?? false,
    turnExpansionWeight: fieldOptions.turnExpansionWeight ?? 0.5,
  })

  function handleMove(move: string): boolean {
    if (pgn.game) {
      return pgn.makeMove(move)
    }
    return freePlay.makeMove(move)
  }

  function handleGoTo(index: number) {
    pgn.goTo(index)
  }
  function handleGoNext() {
    pgn.goNext()
  }
  function handleGoPrev() {
    pgn.goPrev()
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border-b border-gray-700">
        <GameSelector onSelect={pgn.loadPgn} />
        <PgnImport onLoad={pgn.loadPgn} error={pgn.error} />
        <div className="w-px h-4 bg-gray-700" />
        <FenInput
          currentFen={activeFen}
          onLoad={(fen) => { pgn.clearGame(); freePlay.loadFen(fen) }}
          onReset={() => { pgn.clearGame(); freePlay.reset() }}
        />
      </div>

      {/* Main panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Chess board */}
        <div className="w-1/2 border-r border-gray-700 flex flex-col">
          <div className="px-3 py-1.5 text-xs text-gray-400 uppercase tracking-wide border-b border-gray-800 flex items-center gap-2">
            Board
            {pgn.game && (
              <span className="text-yellow-500 text-xs normal-case font-normal">
                · PGN{pgn.game.forkIndex !== null ? ' (variation)' : ''}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <ChessBoard
              fen={activeFen}
              onMove={handleMove}
              orientation={fieldOptions.playerSide === 'b' ? 'black' : 'white'}
            />
          </div>
        </div>

        {/* Right: 3D Field */}
        <div className="w-1/2 flex flex-col">
          <div className="px-3 py-1.5 text-xs text-gray-400 uppercase tracking-wide border-b border-gray-800">
            3D Influence Field
          </div>
          <div className="flex-1 overflow-hidden relative">
            <ChessField3D
              fields={fields}
              playerSide={fieldOptions.playerSide ?? 'w'}
            />
          </div>
          <FieldControls options={fieldOptions} onChange={setFieldOptions} />
        </div>
      </div>

      {/* Bottom: move navigator (PGN mode) */}
      {pgn.game && (
        <div className="border-t border-gray-700 bg-gray-900" style={{ height: 160 }}>
          <MoveNavigator
            game={pgn.game}
            currentIndex={pgn.currentIndex}
            onGoTo={handleGoTo}
            onNext={handleGoNext}
            onPrev={handleGoPrev}
            onStart={() => pgn.goStart()}
            onEnd={() => pgn.goEnd()}
            onClear={pgn.clearGame}
          />
        </div>
      )}
    </div>
  )
}
