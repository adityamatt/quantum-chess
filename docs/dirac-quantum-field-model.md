# Chess Quantum Field Model — Dirac Formulation

*Applying the principles of Quantum Mechanics (Dirac, 1930) to chess influence field visualization.*

## 1. The Analogy

Dirac's formulation of quantum mechanics distinguishes between the **state** (what exists), the **observable** (what you can measure), and the **act of measurement** (which collapses superposition into a definite outcome).

| Dirac QM | Chess Field |
|---|---|
| State vector \|ψ⟩ | Current board position |
| Observable (Hermitian operator Â) | The influence field (attack topology) |
| Measurement / observation | Making a move (the turn) |
| Superposition of eigenstates | Before the turn: all legal moves coexist |
| Wavefunction collapse | After the turn: one move is chosen |
| Potential energy V̂ | Attack field when it is NOT your turn |
| Kinetic energy T̂ | Movement disruption when it IS your turn |
| Hamiltonian Ĥ = T̂ + V̂ | Full turn field = potential + kinetic disruption |
| Distance (in propagator) | Number of moves, NOT number of squares |
| Planck's constant ℏ | Decay factor λ (governs field granularity) |
| Probability amplitude \|⟨x\|ψ⟩\|² | Influence weight of each possible move |

## 2. The Two Regimes

### 2.1 Potential V̂ — "Not Your Turn" (Static Field)

When it is not the active player's turn, the board exhibits a **static potential field**. Each piece projects influence along its attack directions with spatial decay:

$$V(r, f) = \sum_{p} \sigma_p \cdot A_p \cdot \lambda^{d(p, r, f)}$$

Where:
- $\sigma_p = -1$ (white) or $+1$ (black)
- $A_p$ = piece value (P=1, N=3, B=3, R=5, Q=9, K=4)
- $d(p, r, f)$ = square distance along the piece's ray to $(r,f)$
- $\lambda$ = decay rate per square (default 0.5)

This is the wave field model already documented. It represents **where pieces COULD act** — the latent threat topology.

**Key property**: Distance here is measured in **squares** (spatial), because without a turn, the piece hasn't moved — it's the standing wave pattern.

### 2.2 Kinetic T̂ — "Your Turn" (Observation/Collapse)

When it IS the active player's turn, they will make exactly one move. Before that move is chosen, the position exists in a **superposition of all possible futures**. Each legal move is an eigenstate.

**Critical insight from Dirac**: The distance metric changes. In the kinetic regime, distance = **number of moves**, not squares. A rook (R) on a1 can reach a8 in one move — therefore a8 is at distance 1 from the rook, identical to a2. The spatial distance (7 squares vs 1 square) is irrelevant to the kinetic operator.

For a piece $p$ with legal moves $M(p) = \{m_1, m_2, \ldots, m_n\}$:

$$T_p = \text{all squares reachable in 1 move are at distance 1}$$
$$T_p^{(2)} = \text{all squares reachable in 2 moves are at distance 2}$$

The kinetic wave from piece $p$ at depth $d$ moves:

$$K_p(target, d) = \sigma_p \cdot A_p \cdot \lambda^d$$

Where $d$ is the **move count** to reach that target (minimum legal moves required).

### 2.3 The Full Hamiltonian Ĥ = T̂ + V̂

The turn field combines both:

$$\Phi(r, f) = V(r, f) + \alpha \cdot T(r, f)$$

Where $\alpha$ controls the weight of kinetic disruption relative to the standing potential.

## 3. Observation (The Turn) in Detail

### 3.1 Superposition Before Collapse

Before the active player moves, the field shows the **expected value** across all possible moves — the superposition. For each legal move $m$:

1. **Remove** piece from source square → subtract its V̂ contribution from source
2. **Place** piece on destination → add its V̂ contribution from destination  
3. If capture → remove captured piece's entire V̂ contribution
4. Compute the resulting potential field $V_m$

The **observation field** (superposition) is:

$$\Phi_{obs}(r, f) = \sum_{m \in \text{legal moves}} w(m) \cdot V_m(r, f)$$

### 3.2 Move Weights (Probability Amplitudes)

In QM, each eigenstate has a probability amplitude. For chess:

**Uniform weighting** (maximum uncertainty — no preference):
$$w(m) = \frac{1}{|\text{legal moves}|}$$

This shows "if all moves are equally likely, what does the expected field look like?" — raw potential disruption without evaluation.

**Value-weighted** (captures and threats are more probable):
$$w(m) = \frac{\text{gain}(m)}{\sum_{m'} \text{gain}(m')}$$

Where $\text{gain}(m)$ = material gained + threats created.

**Recommended**: Start with uniform weighting. It's assumption-free and shows pure disruption potential.

### 3.3 The Disruption Field ΔΦ

More useful than the absolute post-move field is the **change** — what moves disrupt:

$$\Delta\Phi(r, f) = \Phi_{obs}(r, f) - V(r, f)$$

Squares where $|\Delta\Phi|$ is large are **observation-sensitive** — they change dramatically depending on what move is made. These are the tactical hotspots.

## 4. Distance = Moves (The Key Approximation)

### 4.1 Why Square Distance Is Wrong for the Turn

In the potential regime (not your turn), decay per square is physically correct — a bishop 5 squares away exerts less immediate pressure than one 2 squares away because more blocking opportunities exist.

But when it IS your turn, the rook doesn't care about intermediate squares — it teleports to any square on its file/rank in exactly 1 move. The "distance" that matters is:

| Piece | Distance to any reachable square |
|---|---|
| R (Rook) | 1 move to any square on same rank/file (if unblocked) |
| B (Bishop) | 1 move to any square on same diagonal (if unblocked) |
| Q (Queen) | 1 move to any square on rank/file/diagonal (if unblocked) |
| N (Knight) | 1 move to any L-jump square (always unblocked) |
| K (King) | 1 move to any adjacent square |
| P (Pawn) | 1 move forward (1 or 2 from start), 1 move diagonal-capture |

### 4.2 Multi-Move Distance (Depth > 1)

At depth 2: "If I move here, then opponent moves, then I move again — what can I reach?"

$$\text{distance}(p, target) = \min \text{ moves for } p \text{ to reach } target$$

For depth-2 turn field:
- All squares reachable in 1 move → distance 1, weight $\lambda^1$
- All squares reachable in 2 moves (but not 1) → distance 2, weight $\lambda^2$

This is expensive to compute exactly (requires game tree search), so we approximate:

**Depth-1 approximation** (recommended for real-time):
- Only consider the active player's legal moves from current position
- Each move = distance 1, uniform decay $\lambda^1$

**Depth-2 approximation** (optional):
- For each legal move, compute opponent's legal responses
- For each opponent response, compute active player's legal re-responses
- Squares reachable only at depth 2 get decay $\lambda^2$

### 4.3 The Dirac Approximation

In full QM, the propagator $\langle x' | e^{-iĤt/ℏ} | x \rangle$ gives the amplitude for a particle to travel from $x$ to $x'$ in time $t$. We approximate this as:

$$G(source, target, d) = \lambda^d \quad \text{if } target \text{ is reachable in } d \text{ moves}$$

This is "approximate" because:
- We discretize: moves are integers, not continuous time
- We ignore interference between paths (a square reachable via multiple move sequences doesn't get enhanced — we take the min-distance path)
- We truncate at finite depth

These approximations make it computable in real-time while preserving the essential physics: **things reachable sooner disrupt more**.

## 5. Practical Computation

### 5.1 Algorithm: Turn Field (Depth 1)

```
Input: position, active player (whose turn it is), decay λ
Output: turnField[8][8] — the disruption field

1. Compute baseField = V̂(position)  // static wave field

2. For each legal move m of active player:
   a. Apply m to get position'
   b. Compute postField = V̂(position')
   c. deltaField[m] = postField - baseField

3. turnField = baseField + (1/|moves|) × Σ deltaField[m]
   // OR: turnField = baseField + max_over_m(deltaField[m])  // optimistic
```

### 5.2 Algorithm: Move-Distance Field (Alternative)

Instead of computing full post-move attack fields, directly compute the kinetic contribution:

```
Input: position, active player, decay λ
Output: kineticField[8][8]

For each piece p of active player:
  For each legal move m of p:
    destination = m.to
    kineticField[destination] += σ_p × A_p × λ^1
    // The piece arrives here in 1 move, contributing its full amplitude × decay^1
```

This is cheaper (no full field recomputation per move) and shows: "where can the active player put pressure in 1 move?"

### 5.3 Combining Potential + Kinetic

```
finalField[sq] = V(sq) + α × K(sq)

// α (alpha) = turn-weight, controls how much the "future move"
// disruption adds to the standing field. Default: 0.5
```

## 6. Visual Interpretation

| What you see | What it means |
|---|---|
| Bright blue square with no piece | White can arrive there strongly in 1 move |
| Bright red square with no piece | Black can arrive there strongly in 1 move |
| Square that changes from neutral to bright with turn ON | High disruption potential — tactical target |
| Piece surrounded by opposite color | Under siege — move-distance pressure converging |
| King square deepening in color with turn ON | The active player can increase pressure on the king next turn |

## 7. Connection to Existing Implementation

| Component | Role in Dirac Model |
|---|---|
| `attackField.ts` (current) | Approximation of V̂ — counts only (no decay) |
| `attackRadiation.ts` (current) | Approximation of one-hop T̂ — projects attacks forward |
| Wave field (white paper) | Proper V̂ with decay per square |
| **Turn field (this paper)** | Proper T̂ with decay per move |

The wave field model (prior white paper) implements V̂. This paper defines T̂ and how to combine them.

**The "Radiation" toggle in the UI maps to**: Ĥ = V̂ only (OFF) vs. Ĥ = V̂ + αT̂ (ON).

## 8. Example: Rook on e1

Consider a white rook (R) on e1 with the e-file open:

**Potential V̂ (Radiation OFF)**:
- e2 gets amplitude $5 × 0.5^1 = 2.5$ (blue)
- e3 gets amplitude $5 × 0.5^2 = 1.25$
- e4 gets amplitude $5 × 0.5^3 = 0.625$
- ...decays to near-zero by e7

**Kinetic T̂ (Radiation ON, move-distance mode)**:
- e2, e3, e4, e5, e6, e7, e8 ALL get $5 × 0.5^1 = 2.5$ (equal distance = 1 move)
- a1, b1, c1, d1, f1, g1, h1 all get $5 × 0.5^1 = 2.5$

**Combined Ĥ**:
- Near squares (e2, e3): high V̂ + high T̂ = very strong
- Far squares (e7, e8): low V̂ + high T̂ = significantly boosted
- The whole file lights up uniformly in the kinetic layer

This is correct physics: the rook truly does threaten e8 as much as e2 when it's the rook's turn to move. The potential (without turn) correctly shows nearby squares under more pressure (because more blocking can happen in the future), but the kinetic (with turn) correctly shows all reachable squares at equal threat.

## 9. Parameters

| Parameter | Symbol | Default | Range | Meaning |
|---|---|---|---|---|
| Spatial decay | λ | 0.5 | 0.1–0.9 | Wave decay per square (V̂) |
| Move decay | λ_m | 0.5 | 0.1–0.9 | Wave decay per move (T̂) |
| Turn weight | α | 0.5 | 0.0–1.0 | How much T̂ adds to V̂ |
| Depth | d | 1 | 1–3 | How many moves deep to project |

**Note**: λ and λ_m can be the same parameter for simplicity (single "Decay" slider). The conceptual distinction is what the distance unit means (squares vs moves), not necessarily a different numerical value.

## 10. Standard Chess Notation Reference

| Symbol | Piece | Value | Movement |
|---|---|---|---|
| K | King | 4 (source) / ∞ (target) | 1 square any direction |
| Q | Queen | 9 | Any direction, unlimited |
| R | Rook | 5 | Orthogonal, unlimited |
| B | Bishop | 3 | Diagonal, unlimited |
| N | Knight | 3 | L-shape (2+1), jumps |
| P (or none) | Pawn | 1 | Forward 1 (2 from start), captures diagonal |

**Squares**: file (a–h) + rank (1–8). e.g., e4, Nf3, Qxd7, O-O.

## 11. Summary

The chess field is modeled as a quantum system with two operators:

1. **V̂ (Potential)**: The standing wave pattern — spatial influence with per-square decay. Shows where pieces project pressure RIGHT NOW.

2. **T̂ (Kinetic)**: The movement disruption — all squares reachable in 1 move are at equal distance. Shows what changes when a move is made.

3. **Ĥ = V̂ + αT̂**: The full field — standing pressure plus movement potential. When the "Radiation" (turn projection) toggle is ON, you see the Hamiltonian.

The Dirac approximation: distance = moves (not squares) in the kinetic operator. This is approximate because we truncate at finite depth and ignore path interference, but it captures the essential physics that makes "the next move pop out" — a rook's entire file lights up when it's ready to move, not just the nearest squares.

## 12. Adaptive Depth with A* Heuristic Pruning

### 12.1 The Computational Problem

In nature, every point in space computes its own field evolution in parallel — there's no branching factor. We simulate sequentially, hitting combinatorial explosion:
- Depth 1: ~30 positions
- Depth 2: ~900 positions
- Depth 3: ~27,000 positions
- Depth 5: ~24 million positions

### 12.2 The Feynman Path Integral Analogy

In QM's path integral formulation, every possible path contributes to the propagator, but paths far from the classical path interfere destructively and cancel. The "classical path" in chess = forcing tactical lines (checks, captures, threats). Quiet moves = off-classical paths contributing negligibly.

Our heuristic mimics this natural cancellation: prune low-amplitude branches that have no tactical significance.

### 12.3 The Expansion Heuristic

For a move `m` landing on square `s` at depth `d`:

```
expand(m, s, d) = amplitude(m, d) × relevance(s) ≥ τ
```

**amplitude(m, d)** = `pieceValue(mover) × λ^d`

**relevance(s)** = `w₁ × proximity(s) + w₂ × underAttack(s) + w₃ × targetValue(s)`

Where:

**proximity(s)** — distance to opponent pieces (king weighted 50×):
```
proximity(s) = min(1.0, (Σ weight_p / (chebyshev(s, p) + 1)) / 20)
```

**underAttack(s)** — friendly piece needing support:
```
underAttack(s) = min(1.0, max(0, enemyAttackers - friendlyDefenders) × friendlyValue / 9)
```

**targetValue(s)** — opponent piece worth capturing:
```
targetValue(s) = opponentPieceValue / 9  (or 0 if empty)
```

### 12.4 Parameters

| Symbol | Name | Default | Role |
|---|---|---|---|
| d_max | Max depth | 5 | Hard propagation cutoff |
| λ | Decay | 0.5 | Amplitude falloff per hop |
| τ | Threshold | 0.3 | Min expand score to propagate |
| ε | Epsilon | 0.05 | Min perceptible amplitude |
| w₁ | Proximity weight | 0.5 | — |
| w₂ | Under-attack weight | 0.3 | — |
| w₃ | Target weight | 0.2 | — |

### 12.5 Termination Conditions

1. `d ≥ d_max` — hard depth cap
2. Square is opponent king — reached target, max signal applied
3. `amplitude < ε` — signal below perceptual threshold
4. `expand(m, s, d) < τ` — branch not relevant enough

### 12.6 Expected Behavior

| Scenario | Expansion depth |
|---|---|
| Queen aimed at exposed king | 4-5 (proximity drives expansion) |
| Knight fork threat | 3-4 (target value on both targets) |
| Pawn push to quiet square | 1 only (pruned immediately) |
| Rook defending own queen under attack | 3 (underAttack drives expansion) |
| Bishop on quiet diagonal, no targets | 1-2 (low relevance everywhere) |

## 13. Implemented Model: Sequence-Based Minimax

*Sections 1–11 describe the theoretical framework. This section documents what is actually implemented.*

### 13.1 V̂ — Actual Implementation

The potential field V̂ is implemented as a **simple attacker count** (not the spatial-decay wave model described in sections 2–6):

```
V̂[sq] = blackAttackers(sq) - whiteAttackers(sq)
```

King exception: on king squares, only enemy attackers count (friendly defenders are ignored because the king cannot be traded).

### 13.2 T̂ — Actual Implementation (Sequence-Based Minimax)

The kinetic operator T̂ uses a **sequence-based minimax** search, not the simple "all legal moves at equal distance" model from section 2.2. It models how players actually think:

1. **Pick candidates**: Top 10 moves sorted by immediate threat (checks first, then captures by MVV-LVA, then king proximity)
2. **Alpha-beta search**: For each candidate, find the best line using minimax with alpha-beta pruning
3. **Evaluate**: `netGain = evaluate(finalPosition) - evaluate(startPosition)`
4. **Project**: Map the evaluation back along the sequence path with decay

```typescript
for each candidateMove:
  line = alphaBeta(postMove, depth-1, -∞, +∞, false)
  netGain = line.eval - baseEval
  for (i, step) in fullSequence:
    field[step.to] += netGain × λ^(i+1)
```

### 13.3 Evaluation Function

```
evaluate(position, player) = materialBalance + kingZonePressure + checkBonus
```

- Material: sum of own piece values - sum of opponent piece values
- King zone: +0.5 per attacker on squares adjacent to opponent king
- Check: +3 if opponent is in check
- Checkmate: ±100

### 13.4 Threat-Based Amplitude

A move's field contribution is not just `moverValue × λ^d`. It's:

```
effectiveValue = max(moverValue, totalThreatenedOpponentMaterial)
amplitude = effectiveValue × λ^depth
```

This makes sacrifices and forks visually dominant — a knight sacrifice that forks Q+R radiates at amplitude 14, not 3.

### 13.5 Parameters (UI Controls)

| Symbol | UI Label | Default | What it controls |
|---|---|---|---|
| α | α slider | 0.5 | Weight of T̂ kinetic vs V̂ potential |
| λ | λ slider | 0.5 | Decay per depth in sequence projection |
| — | Observation (T̂) | ON | Whether T̂ is computed at all |

### 13.6 Divergence from Pure Dirac Model

| Theoretical (sections 2–6) | Implemented |
|---|---|
| V̂ = spatial decay wave along attack rays | V̂ = simple attacker count (no decay) |
| T̂ = all legal moves at equal distance | T̂ = minimax search, sequence evaluation projected back |
| Distance = moves (all equidistant) | Depth = search depth, decay weights deeper moves less |
| Superposition = independent accumulation | Minimax = opponent's best response reduces signal |
| No evaluation function needed | Alpha-beta uses material + king pressure evaluation |

The theoretical model (sections 2–6) remains the aspiration. The implemented model trades physical elegance for **correctness of tactical visualization** — sacrifices, forks, and checkmates show up because the minimax evaluation captures their true value.
