# Chess Quantum Field Visualizer

A 3D chess influence field visualization that models piece interactions as quantum wave mechanics — applying principles from Dirac's *The Principles of Quantum Mechanics* (1930) to make tactical patterns visually emergent.

## The Idea

In quantum mechanics, a particle's behavior is governed by two operators:
- **Potential V̂** — the static field it sits in
- **Kinetic T̂** — its capacity to move and disrupt that field

We apply the same decomposition to chess:

| Mode | Physics | What it shows |
|---|---|---|
| **Potential** (Radiation OFF) | V̂ — standing wave | Where pieces project pressure now (per-square decay) |
| **Observation** (Radiation ON) | Ĥ = V̂ + αT̂ | Standing pressure + movement disruption (per-move decay) |

The goal: anyone should be able to glance at the 3D field and see where the action is — like seeing a cat in a photo without scanning pixel by pixel.

## Piece Notation & Values

Standard algebraic notation throughout:

| Symbol | Piece | Wave Amplitude | Movement |
|---|---|---|---|
| **K** | King | 4 (source) | 1 square, any direction |
| **Q** | Queen | 9 | Rank, file, or diagonal — unlimited |
| **R** | Rook | 5 | Rank or file — unlimited |
| **B** | Bishop | 3 | Diagonal — unlimited |
| **N** | Knight | 3 | L-shape (2+1), jumps over pieces |
| **P** | Pawn | 1 | Forward 1 (2 from start), captures diagonal |

Squares: file letter (a–h) + rank number (1–8). Example: **e4**, **Nf3**, **Qxd7**, **O-O**.

## The Model

### Potential V̂ — Static Wave Field

Each piece emits a wave along its attack directions:

```
Wave(piece p, target square) = sign(p) × value(p) × λ^distance_in_squares
```

- **sign**: white = −1 (blue), black = +1 (red)
- **λ** (decay): 0.5 default — influence halves per square of travel
- **Blocking**: waves stop at occupied squares (real board, not empty)
- **Superposition**: all waves sum on each square — same side reinforces, opposite cancels
- **King exception**: on K's square, only enemy waves count (K can't be traded)

### Kinetic T̂ — Turn Disruption (Observation)

When it IS the active player's turn, **distance = moves, not squares**:

```
Kinetic(piece p, target) = sign(p) × value(p) × λ^moves_to_reach
```

A rook on a1 is **1 move** from a8 — same distance as a2. The entire reachable line lights up uniformly. This is the Dirac approximation: what matters is reachability in discrete time steps, not spatial separation.

### Combined Ĥ = V̂ + αT̂

```
Field[square] = Potential[square] + α × Kinetic[square]
```

α (turn weight) controls how much future-move disruption adds to the standing field.

## Visualization

- **Block height** = piece material value (taller = more valuable piece)
- **Block color** = wave field value (blue = white pressure, red = black pressure)
- **Top center 25%** = piece ownership (gold = white, dark = black)
- **Color mapping** = symmetric log normalization (prevents Q from drowning out P)

## Controls

| Control | What it does |
|---|---|
| **You are: White / Black** | Flips board orientation + camera |
| **☑ Radiation** | Toggles T̂ (turn projection) ON/OFF |
| **Strength** slider | α — weight of kinetic layer (0.1–1.0) |
| **Decay** slider | λ — spatial decay rate (0.1–0.9) |

## Key Visual Patterns

| Pattern | What it means |
|---|---|
| Deep blue zone | White dominates — multiple white waves converge |
| Deep red zone | Black dominates — constructive black interference |
| Neutral/white square | Contested — waves cancel (destructive interference) |
| Piece block turning enemy color | Under attack and under-defended |
| Whole file/diagonal lighting up (Radiation ON) | A R/B/Q can reach all those squares in 1 move |
| K square deep enemy color | King is in danger — checkmate signature |

## Architecture

```
src/
├── chess/
│   ├── attackField.ts          # V̂ approximation (attacker count, king exception)
│   ├── attackRadiation.ts      # T̂ approximation (one-hop projection, real board blocking)
│   ├── interactionWeights.ts   # Piece-type interaction matrix
│   └── waveField.ts            # (planned) Full V̂ with decay
├── hooks/
│   └── useChessFields.ts       # Field computation orchestrator
├── visualization/
│   ├── ChessField3D.tsx        # Three.js 3D scene
│   ├── DiscreteBlocks.tsx      # BoxGeometry cuboids per square
│   └── FieldControls.tsx       # UI controls
└── App.tsx                     # Layout + 2D board + PGN
```

## Documentation

- [`docs/wave-field-model.md`](docs/wave-field-model.md) — Wave superposition model (V̂)
- [`docs/dirac-quantum-field-model.md`](docs/dirac-quantum-field-model.md) — Dirac QM formulation (V̂ + T̂)

## Stack

Vite • React • TypeScript • Tailwind • chess.js • react-chessboard • Three.js • @react-three/fiber • @react-three/drei

## Running

```bash
npm install
npm run dev
```

## The Approximation

This model is an *approximation* of Dirac's equation applied to a discrete, deterministic system:

1. **Discrete time** — moves are integers, not continuous
2. **No path interference** — a square reachable via multiple routes doesn't get amplitude enhancement (we take min-distance)
3. **Finite depth** — truncated at depth 1–3 (full game tree is intractable)
4. **Deterministic collapse** — in QM, collapse is probabilistic; in chess, the player *chooses*

Despite these approximations, the model preserves the essential physics: superposition before measurement, collapse upon action, and the distinction between spatial potential and temporal kinetics.
