export interface SampleGame {
  name: string
  category: string
  description: string
  pgn: string
}

export const SAMPLE_GAMES: SampleGame[] = [
  // ── Scholar's Mate ─────────────────────────────────────────────────────────
  {
    name: "Scholar's Mate",
    category: 'Traps',
    description: 'White mates in 4 moves targeting f7',
    pgn: '1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7#',
  },
  // ── Fool's Mate ────────────────────────────────────────────────────────────
  {
    name: "Fool's Mate",
    category: 'Traps',
    description: 'Fastest possible checkmate (2 moves)',
    pgn: '1. f3 e5 2. g4 Qh4#',
  },
  // ── Fried Liver Attack ─────────────────────────────────────────────────────
  {
    name: 'Fried Liver Attack',
    category: 'Traps',
    description: 'Knight sacrifice on f7 to expose the king',
    pgn: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. Ng5 d5 5. exd5 Nxd5 6. Nxf7 Kxf7 7. Qf3+ Ke6 8. Nc3 Nb4 9. O-O c6 10. d4',
  },
  // ── Legal's Mate ───────────────────────────────────────────────────────────
  {
    name: "Legal's Mate",
    category: 'Traps',
    description: 'Queen sacrifice into knight+bishop checkmate',
    pgn: '1. e4 e5 2. Nf3 d6 3. Bc4 Bg4 4. Nc3 g6 5. Nxe5 Bxd1 6. Bxf7+ Ke7 7. Nd5#',
  },
  // ── Blackburne Shilling Gambit ─────────────────────────────────────────────
  {
    name: 'Blackburne Shilling Gambit',
    category: 'Traps',
    description: 'Black traps White into losing the queen',
    pgn: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nd4 4. Nxe5 Qg5 5. Nxf7 Qxg2 6. Rf1 Qxe4+ 7. Be2 Nf3#',
  },
  // ── Opera Game (Morphy) ────────────────────────────────────────────────────
  {
    name: 'Opera Game (Morphy)',
    category: 'Classics',
    description: "Morphy's famous attacking masterpiece (1858)",
    pgn: '1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8#',
  },
  // ── Immortal Game (Anderssen) ──────────────────────────────────────────────
  {
    name: 'Immortal Game (Anderssen)',
    category: 'Classics',
    description: 'Multiple piece sacrifices for a king hunt (1851)',
    pgn: '1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7#',
  },
  // ── Evergreen Game (Anderssen) ─────────────────────────────────────────────
  {
    name: 'Evergreen Game',
    category: 'Classics',
    description: 'Anderssen sacrifices queen for a spectacular mate (1852)',
    pgn: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O d3 8. Qb3 Qf6 9. e5 Qg6 10. Re1 Nge7 11. Ba3 b5 12. Qxb5 Rb8 13. Qa4 Bb6 14. Nbd2 Bb7 15. Ne4 Qf5 16. Bxd3 Qh5 17. Nf6+ gxf6 18. exf6 Rg8 19. Rad1 Qxf3 20. Rxe7+ Nxe7 21. Qxd7+ Kxd7 22. Bf5+ Ke8 23. Bd7+ Kf8 24. Bxe7#',
  },
  // ── Italian Game Trap ──────────────────────────────────────────────────────
  {
    name: 'Italian Game Trap',
    category: 'Traps',
    description: 'Black falls for a fork winning the queen',
    pgn: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nd4 4. Nxe5 Qg5 5. Nxf7 Qxg2 6. Rf1 Qxe4+ 7. Be2 Nf3#',
  },
  // ── Berlin Defense ─────────────────────────────────────────────────────────
  {
    name: 'Berlin Defense',
    category: 'Openings',
    description: 'The "Berlin Wall" — solid defense that neutralizes White\'s initiative',
    pgn: '1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. O-O Nxe4 5. d4 Nd6 6. Bxc6 dxc6 7. dxe5 Nf5 8. Qxd8+ Kxd8 9. Nc3 Ke8 10. h3 Be7 11. Bg5 h6 12. Bxe7 Nxe7 13. Rad1 Be6 14. Nd4 Rd8',
  },
]
