import type { FieldMode } from '@/chess/combinedField'

export interface FieldViewOptions {
  mode: FieldMode
  attackWeight: number
  turnExpansion: boolean
  turnExpansionWeight: number
  playerSide: 'w' | 'b'
}

export const DEFAULT_VIEW_OPTIONS: FieldViewOptions = {
  mode: 'combined',
  attackWeight: 1.0,
  turnExpansion: true,
  turnExpansionWeight: 0.5,
  playerSide: 'w',
}

interface Props {
  options: FieldViewOptions
  onChange: (next: FieldViewOptions) => void
}

export function FieldControls({ options, onChange }: Props) {
  function set<K extends keyof FieldViewOptions>(key: K, value: FieldViewOptions[K]) {
    onChange({ ...options, [key]: value })
  }

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2 bg-gray-900 border-t border-gray-700 text-xs">
      {/* Player side */}
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500">You are:</span>
        <button
          onClick={() => set('playerSide', 'w')}
          className={`px-2 py-0.5 rounded transition-colors ${
            options.playerSide === 'w' ? 'bg-white text-gray-900 font-bold' : 'bg-gray-800 text-gray-400'
          }`}
        >
          White
        </button>
        <button
          onClick={() => set('playerSide', 'b')}
          className={`px-2 py-0.5 rounded transition-colors ${
            options.playerSide === 'b' ? 'bg-gray-700 text-white font-bold' : 'bg-gray-800 text-gray-400'
          }`}
        >
          Black
        </button>
      </div>

      {/* Attack Radiation toggle + weight */}
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={options.turnExpansion}
          onChange={(e) => set('turnExpansion', e.target.checked)}
          className="accent-green-400"
        />
        <span className="text-gray-400">Radiation</span>
      </label>

      {options.turnExpansion && (
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Strength:</span>
          <input
            type="range"
            min={0.1}
            max={1.0}
            step={0.1}
            value={options.turnExpansionWeight ?? 0.4}
            onChange={(e) => set('turnExpansionWeight', parseFloat(e.target.value))}
            className="w-20 accent-green-400"
          />
          <span className="text-gray-300 font-mono w-8">{(options.turnExpansionWeight ?? 0.4).toFixed(1)}</span>
        </div>
      )}

      {/* Interaction weighting is always active — baked into the attack field */}
    </div>
  )
}
