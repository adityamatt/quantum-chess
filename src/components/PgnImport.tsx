import { useState } from 'react'

interface Props {
  onLoad: (pgn: string) => void
  error: string | null
}

export function PgnImport({ onLoad, error }: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')

  function handleLoad() {
    if (text.trim()) {
      onLoad(text.trim())
      setOpen(false)
      setText('')
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 border border-gray-600"
      >
        Import PGN
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-[560px] flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-100">Import PGN</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-300 text-lg leading-none"
              >
                ×
              </button>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={'[Event "Example"]\n[White "Kasparov"]\n[Black "Deep Blue"]\n\n1. e4 e5 2. Nf3 Nc6 ...'}
              className="w-full h-52 bg-gray-800 border border-gray-700 rounded p-3 text-xs font-mono text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-blue-500"
              autoFocus
            />

            {error && (
              <p className="text-xs text-red-400 font-mono">{error}</p>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setOpen(false)}
                className="text-xs px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleLoad}
                disabled={!text.trim()}
                className="text-xs px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded text-white"
              >
                Load Game
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
