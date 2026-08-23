# Chess Attack Dependency Graph Explorer

## Goal

Build a local Vite + React + TypeScript application to explore chess positions as dynamic attack/support dependency graphs.

Core hypothesis: a chess position is fundamentally a **graph of relationships**, not just pieces on squares. Every move is a **graph transformation** `G(t) → G(t+1)`. This app makes those transformations visually inspectable so structural patterns — forks, pins, overloads — can be observed emerging from graph topology rather than being manually encoded.

---

## Tech Stack

| Concern | Library | Weekly Downloads (approx) |
|---|---|---|
| Build | Vite + React + TypeScript | — |
| Chess logic | `chess.js` | ~2.5M/week |
| Board rendering | `react-chessboard` | ~90K/week |
| Graph visualization | `@xyflow/react` (React Flow v12) | ~700K/week |
| Styling | Tailwind CSS | — |

**Do not** add Stockfish, engine wrappers, or tactics classifiers in the MVP.

---

## Layout

```
+------------------------------+------------------------------+
|                              |                              |
|         CHESS BOARD          |       DEPENDENCY GRAPH       |
|                              |                              |
|   react-chessboard           |   @xyflow/react              |
|   + SVG attack overlay       |   nodes: pieces + squares    |
|                              |   edges: attack/support/     |
|                              |          block/xray          |
+------------------------------+------------------------------+
|                                                             |
|                    MOVE DELTA PANEL                         |
|   Position A ──── move ───→ Position B                      |
|   + created edges   - removed edges   = preserved edges    |
+-------------------------------------------------------------+
```

- Left panel: chessboard with interactive SVG overlay for attack lines
- Right panel: `@xyflow/react` graph — pieces and squares as nodes, relationships as edges
- Bottom panel: graph delta after each move (diff view)
- Board and graph are **bidirectionally linked**: selecting a piece/square highlights the equivalent nodes/edges in both panels

---

## Data Model

### Nodes

```ts
type PieceNode = {
  type: "piece";
  id: string;        // e.g. "wp-e2" (white pawn on e2)
  square: string;    // "e2"
  piece: "P" | "N" | "B" | "R" | "Q" | "K";
  color: "white" | "black";
};

type SquareNode = {
  type: "square";
  id: string;        // e.g. "sq-f7"
  square: string;    // "f7"
};

type GraphNode = PieceNode | SquareNode;
```

### Edges

```ts
type EdgeType = "attack" | "support" | "block" | "xray";

type GraphEdge = {
  id: string;
  from: string;      // node id
  to: string;        // node id
  type: EdgeType;
};
```

### Edge Semantics

| Type | Meaning |
|---|---|
| `attack` | Piece attacks an enemy piece or empty square |
| `support` | Piece attacks a square occupied by a friendly piece |
| `block` | A piece terminates a sliding ray, preventing further reach |
| `xray` | A sliding piece has a latent line through a blocker to a square/piece behind it |

### Sliding Ray Model

For bishop, rook, and queen: return the **full ray**, not just legal squares.

```ts
type RaySquare = {
  square: string;
  status: "direct" | "occupied-friendly" | "occupied-enemy" | "latent";
};

type RayResult = {
  pieceId: string;
  direction: Direction;
  squares: RaySquare[];
  blocker?: string;   // piece id of the blocker, if any
};
```

This is required for xray visualization.

---

## Graph Construction API

Pure functions, no React dependencies.

```ts
// Parse FEN into a position object (wraps chess.js)
function parseFen(fen: string): Position;

// Apply a move string (e.g. "e2e4") and return new position
function applyMove(position: Position, move: string): Position;

// Build the full attack/support/block/xray graph for a position
function buildAttackGraph(position: Position): AttackGraph;

// Get all rays for a sliding piece
function getSlidingRay(position: Position, piece: Piece, direction: Direction): RayResult;

// Compute the diff between two graphs
function diffGraphs(before: AttackGraph, after: AttackGraph): GraphDelta;

// Extract a subgraph rooted at a target node up to a given depth
function getDependencies(graph: AttackGraph, targetNodeId: string, depth: number): AttackGraph;
```

```ts
type GraphDelta = {
  createdEdges: GraphEdge[];
  removedEdges: GraphEdge[];
  preservedEdges: GraphEdge[];
};
```

---

## Board Interaction

Clicking a square `f7`:
- highlights all pieces attacking `f7` (attack edges)
- highlights all pieces supporting the piece on `f7` (support edges)
- highlights latent/xray attacks toward `f7`
- highlights blockers on those rays

Clicking an attack line on the board → highlights the equivalent graph edge in the right panel.

Clicking a graph node/edge → highlights the corresponding square(s) or line on the board.

---

## Target Square Mode

A panel input lets the user freeze a target square (e.g. `h7`) and configure graph depth (1–4+).

At depth 1: only nodes directly connected to the target.
At depth N: recursively expand the dependency subgraph.

This enables inspection like:

```
King (target)
 ├── escape square
 │    ├── attackers of that square
 │    └── defenders
 ├── checking line
 │    ├── attacker
 │    └── blocker
 └── capture option
      └── defender chain
```

---

## Move Delta Panel

After each move, compute and display:

```
Move: d2 → d4

Created:
  + Bishop c1 → e3  (attack)
  + Bishop c1 → f4  (attack)
  + Bishop c1 → g5  (attack)
  + Bishop c1 → h6  (attack)

Removed:
  - Pawn d2 → c3    (attack)
  - Pawn d2 → e3    (attack)

Dependency change:
  - Pawn d2 no longer blocks Bishop c1 ray
```

This is a first-class feature, not a debug panel.

---

## Attack Overlay Toggles

SVG overlay on the board with per-category toggles:

```
[ ] White attacks
[ ] Black attacks
[ ] Support relationships
[ ] X-rays / latent attacks
[ ] Blockers
[ ] Selected square only
[ ] Changed edges only (post-move)
```

Do not render all edges simultaneously by default — it becomes unreadable. Default to "selected square only".

---

## Graph View

Node appearance:

```
Piece node:       [ ♘ Ng5 ]  (color-coded by side)
Square node:      [ h7 ]     (neutral)
```

Edge appearance (color-coded by type):

```
attack  →  red arrow
support →  green arrow
block   →  grey dashed
xray    →  blue dashed
```

Selected nodes/edges are highlighted in both panels simultaneously.

---

## Project Structure

```
src/
  chess/
    types.ts          # Position, Piece, Direction, GraphNode, GraphEdge, GraphDelta
    position.ts       # parseFen, applyMove (chess.js wrappers)
    attacks.ts        # direct attacks per piece type
    rays.ts           # sliding ray computation
    blockers.ts       # block/xray derivation
    graph.ts          # buildAttackGraph
    graphDelta.ts     # diffGraphs
    traversal.ts      # getDependencies (DFS subgraph)

  components/
    ChessBoard.tsx          # react-chessboard + SVG overlay
    AttackOverlay.tsx       # SVG layer for attack/support/xray lines
    DependencyGraph.tsx     # @xyflow/react graph panel
    MoveDelta.tsx           # bottom delta panel
    TargetSquarePanel.tsx   # target square selector + depth control
    FenInput.tsx            # FEN string input
    OverlayToggles.tsx      # attack overlay checkboxes

  hooks/
    useChessPosition.ts     # position state + move application
    useAttackGraph.ts       # graph computed from position
    useGraphDelta.ts        # delta computed on move
    useSelection.ts         # shared selection state (square / node / edge)

  App.tsx
  main.tsx
```

Keep all `chess/` logic free of React. Components only consume graph data — they do not compute it.

---

## MVP Scope

Build only:

1. Direct attacks
2. Support relationships
3. Block relationships (sliding pieces)
4. X-ray / latent attacks (sliding pieces)
5. Graph delta after a move
6. Target-square dependency exploration (depth 1–4)
7. Board ↔ graph bidirectional selection

Do **not** build in MVP:

- Stockfish / engine integration
- Tactics classification (pin, fork detection)
- Move sequence timeline
- Position import from PGN
- Derived edge types: `pin`, `overload`, `deflection`

---

## Design Principle

Do not ask: *What pieces do I have?*

Ask: *What relationships currently exist?*

Then: *What relationships would this move create or destroy?*

Eventually: *What sequence of graph transformations produces the target condition?*

The application exists to test whether common chess ideas (forks, pins, batteries, mating nets) emerge naturally as recurring graph structures — rather than being manually encoded.
