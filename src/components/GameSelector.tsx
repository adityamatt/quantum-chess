import { SAMPLE_GAMES } from '@/chess/sampleGames'

interface Props {
  onSelect: (pgn: string) => void
}

export function GameSelector({ onSelect }: Props) {
  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const idx = parseInt(e.target.value)
    if (!isNaN(idx) && SAMPLE_GAMES[idx]) {
      onSelect(SAMPLE_GAMES[idx].pgn)
    }
    // Reset select to placeholder
    e.target.value = ''
  }

  // Group games by category
  const categories = [...new Set(SAMPLE_GAMES.map((g) => g.category))]

  return (
    <select
      onChange={handleChange}
      defaultValue=""
      className="text-xs px-2 py-1 bg-gray-800 border border-gray-600 rounded text-gray-200 focus:outline-none focus:border-blue-500 max-w-[180px]"
    >
      <option value="" disabled>
        📚 Sample Games…
      </option>
      {categories.map((cat) => (
        <optgroup key={cat} label={cat}>
          {SAMPLE_GAMES.map((game, idx) =>
            game.category === cat ? (
              <option key={idx} value={idx}>
                {game.name}
              </option>
            ) : null,
          )}
        </optgroup>
      ))}
    </select>
  )
}
