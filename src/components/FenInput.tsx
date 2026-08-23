import { useState } from 'react'

interface Props {
  currentFen: string
  onLoad: (fen: string) => void
  onReset: () => void
}

export function FenInput({ currentFen, onLoad, onReset }: Props) {
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (value.trim()) onLoad(value.trim())
    setValue('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 px-3 py-2 bg-gray-900 border-b border-gray-700"
    >
      <span className="text-xs text-gray-400 font-mono shrink-0">FEN</span>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={currentFen}
        className="flex-1 text-xs font-mono bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
      />
      <button
        type="submit"
        className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-white"
      >
        Load
      </button>
      <button
        type="button"
        onClick={onReset}
        className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-200"
      >
        Reset
      </button>
    </form>
  )
}
