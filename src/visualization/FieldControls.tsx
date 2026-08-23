import type { FieldMode } from '@/chess/combinedField'

export interface FieldViewOptions {
  mode: FieldMode
  attackWeight: number
  showGradient: boolean
  showWireframe: boolean
  turnExpansion: boolean
  turnExpansionWeight: number
  discreteHeight: boolean
  playerSide: 'w' | 'b'
  interactionWeighted: boolean
}

export const DEFAULT_VIEW_OPTIONS: FieldViewOptions = {
  mode: 'combined',
  attackWeight: 1.0,
  showGradient: false,
  showWireframe: false,
  turnExpansion: true,
  turnExpansionWeight: 0.5,
  discreteHeight: true,
  playerSide: 'w',
  interactionWeighted: false,
}

interface Props {
  options: FieldViewOptions
  onChange: (next: FieldViewOptions) => void
}

const MODES: { key: FieldMode; label: string }[] = [
  { key: 'piece', label: 'Piece' },
  { key: 'attack', label: 'Attack' },
  { key: 'combined', label: 'Combined' },
]

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

      {/* Mode tabs */}
      <div className="flex items-center gap-1">
        <span className="text-gray-500 mr-1">Field:</span>
        {MODES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => set('mode', key)}
            className={`px-3 py-1 rounded transition-colors ${
              options.mode === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Attack weight slider (only shown when combined) */}
      {options.mode === 'combined' && (
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Attack wt:</span>
          <input
            type="range"
            min={0}
            max={3}
            step={0.1}
            value={options.attackWeight}
            onChange={(e) => set('attackWeight', parseFloat(e.target.value))}
            className="w-20 accent-blue-500"
          />
          <span className="text-gray-300 font-mono w-8">{options.attackWeight.toFixed(1)}</span>
        </div>
      )}

      {/* Turn Expansion toggle + weight */}
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={options.turnExpansion}
          onChange={(e) => set('turnExpansion', e.target.checked)}
          className="accent-green-400"
        />
        <span className="text-gray-400">Turn Expansion</span>
      </label>

      {options.turnExpansion && (
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Future wt:</span>
          <input
            type="range"
            min={0.1}
            max={1.0}
            step={0.1}
            value={options.turnExpansionWeight ?? 0.5}
            onChange={(e) => set('turnExpansionWeight', parseFloat(e.target.value))}
            className="w-20 accent-green-400"
          />
          <span className="text-gray-300 font-mono w-8">{(options.turnExpansionWeight ?? 0.5).toFixed(1)}</span>
        </div>
      )}

      {/* Other toggles */}
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={options.interactionWeighted ?? false}
          onChange={(e) => set('interactionWeighted', e.target.checked)}
          className="accent-orange-400"
        />
        <span className="text-gray-400">Interaction Wt.</span>
      </label>

      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={options.discreteHeight}
          onChange={(e) => set('discreteHeight', e.target.checked)}
          className="accent-purple-400"
        />
        <span className="text-gray-400">Discrete</span>
      </label>

      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={options.showGradient}
          onChange={(e) => set('showGradient', e.target.checked)}
          className="accent-yellow-400"
        />
        <span className="text-gray-400">Gradient</span>
      </label>

      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={options.showWireframe}
          onChange={(e) => set('showWireframe', e.target.checked)}
          className="accent-gray-400"
        />
        <span className="text-gray-400">Wireframe</span>
      </label>
    </div>
  )
}
