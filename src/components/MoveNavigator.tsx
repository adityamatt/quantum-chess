import { useEffect, useRef, useState, useCallback } from 'react'
import type { PgnGame } from '@/hooks/usePgnGame'

interface Props {
  game: PgnGame
  currentIndex: number
  onGoTo: (index: number) => void
  onPrev: () => void
  onNext: () => void
  onStart: () => void
  onEnd: () => void
  onClear: () => void
}

export function MoveNavigator({
  game,
  currentIndex,
  onGoTo,
  onPrev,
  onNext,
  onStart,
  onEnd,
  onClear,
}: Props) {
  const activeRef = useRef<HTMLButtonElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [interval, setInterval] = useState(1500) // ms between moves

  // Auto-advance when playing
  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      if (currentIndex >= game.moves.length - 1) {
        setPlaying(false)
      } else {
        onNext()
      }
    }, interval)
    return () => window.clearInterval(timer)
  }, [playing, interval, currentIndex, game.moves.length, onNext])

  // Stop playing when user navigates manually
  const wrappedOnGoTo = useCallback((idx: number) => {
    setPlaying(false)
    onGoTo(idx)
  }, [onGoTo])

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') { e.preventDefault(); onNext() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); onPrev() }
      if (e.key === 'Home') { e.preventDefault(); onStart() }
      if (e.key === 'End') { e.preventDefault(); onEnd() }
      if (e.key === ' ') { e.preventDefault(); setPlaying((p) => !p) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onNext, onPrev, onStart, onEnd])

  // Auto-scroll active move into view
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [currentIndex])

  const { White, Black, Event, Date: gameDate } = game.headers

  // Group moves into pairs for display
  const pairs: { moveNum: number; white: typeof game.moves[0]; black?: typeof game.moves[0] }[] = []
  for (let i = 0; i < game.moves.length; i += 2) {
    pairs.push({
      moveNum: game.moves[i].moveNumber,
      white: game.moves[i],
      black: game.moves[i + 1],
    })
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 border-t border-gray-700">
      {/* Game header */}
      <div className="px-3 py-2 border-b border-gray-800 flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          {(White || Black) && (
            <p className="text-xs text-gray-200 font-medium truncate">
              {White ?? '?'} vs {Black ?? '?'}
            </p>
          )}
          {(Event || gameDate) && (
            <p className="text-xs text-gray-500 truncate">
              {[Event, gameDate].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <button
          onClick={onClear}
          className="text-xs text-gray-500 hover:text-red-400 shrink-0"
          title="Close game"
        >
          ✕
        </button>
      </div>

      {/* Move list */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        <div className="flex flex-wrap gap-0.5">
          {pairs.map(({ moveNum, white, black }) => (
            <span key={moveNum} className="flex items-center gap-0.5">
              <span className="text-gray-600 text-xs font-mono px-1">{moveNum}.</span>
              <button
                ref={white.index === currentIndex ? activeRef : null}
                onClick={() => wrappedOnGoTo(white.index)}
                className={`text-xs font-mono px-1.5 py-0.5 rounded transition-colors ${
                  white.index === currentIndex
                    ? 'bg-blue-600 text-white'
                    : white.isVariation
                      ? 'text-green-400 hover:bg-gray-700'
                      : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                {white.san}
              </button>
              {black && (
                <button
                  ref={black.index === currentIndex ? activeRef : null}
                  onClick={() => wrappedOnGoTo(black.index)}
                  className={`text-xs font-mono px-1.5 py-0.5 rounded transition-colors ${
                    black.index === currentIndex
                      ? 'bg-blue-600 text-white'
                      : black.isVariation
                        ? 'text-green-400 hover:bg-gray-700'
                        : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {black.san}
                </button>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 px-3 py-2 border-t border-gray-800">
        <NavBtn onClick={onStart} title="Start (Home)">⏮</NavBtn>
        <NavBtn onClick={onPrev} title="Previous (←)">◀</NavBtn>
        <PlayButton
          playing={playing}
          onToggle={() => setPlaying((p) => !p)}
        />
        <NavBtn onClick={onNext} title="Next (→)">▶</NavBtn>
        <NavBtn onClick={onEnd} title="End (End)">⏭</NavBtn>
        <span className="text-xs text-gray-500 font-mono w-16 text-center">
          {currentIndex + 1} / {game.moves.length}
        </span>
        <div className="flex items-center gap-1.5 ml-3">
          <span className="text-xs text-gray-500">Speed:</span>
          <input
            type="range"
            min={500}
            max={4000}
            step={100}
            value={interval}
            onChange={(e) => setInterval(parseInt(e.target.value))}
            className="w-20 accent-blue-500"
          />
          <span className="text-xs text-gray-400 font-mono w-10">{(interval / 1000).toFixed(1)}s</span>
        </div>
      </div>
    </div>
  )
}

function NavBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-8 h-7 flex items-center justify-center text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
    >
      {children}
    </button>
  )
}

function PlayButton({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={playing ? 'Pause (Space)' : 'Play (Space)'}
      className={`w-9 h-7 flex items-center justify-center text-sm rounded transition-colors ${
        playing
          ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
          : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
      }`}
    >
      {playing ? '⏸' : '▶'}
    </button>
  )
}
