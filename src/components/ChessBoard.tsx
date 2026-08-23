import { Chessboard } from 'react-chessboard'
import type { Square } from 'chess.js'

const BOARD_SIZE = 440

interface Props {
  fen: string
  onMove: (move: string) => boolean
  orientation: 'white' | 'black'
}

export function ChessBoard({ fen, onMove, orientation }: Props) {
  function handlePieceDrop(sourceSquare: Square, targetSquare: Square): boolean {
    return onMove(`${sourceSquare}${targetSquare}`)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-6">
        <Chessboard
          id="main-board"
          position={fen}
          boardWidth={BOARD_SIZE}
          boardOrientation={orientation}
          onPieceDrop={handlePieceDrop}
          customBoardStyle={{
            borderRadius: '4px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          }}
        />
      </div>
    </div>
  )
}
