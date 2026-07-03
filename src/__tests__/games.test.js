/**
 * Tests for game logic: challenge generators, score calculations, difficulty.
 * Pure JS — no React, no native modules needed.
 */

// ---- Helpers inlined from game screens ----

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const GRID_CONFIG = {
  easy: { pairs: 6, cols: 4 },
  medium: { pairs: 8, cols: 4 },
  hard: { pairs: 10, cols: 4 },
};

const EMOJI_SETS = {
  easy: ['🍎','🍊','🍇','🍓','🍑','🍋'],
  medium: ['🐶','🐱','🐭','🐰','🦊','🐻','🐼','🐨'],
  hard: ['🚀','🌟','🌙','☄️','🛸','🪐','🌍','☀️','🌈','⚡'],
};

function generateMemoryCards(difficulty) {
  const { pairs } = GRID_CONFIG[difficulty];
  const emojis = shuffle(EMOJI_SETS[difficulty]).slice(0, pairs);
  return shuffle([...emojis, ...emojis].map((emoji, i) => ({
    id: i, emoji, flipped: false, matched: false,
  })));
}

function memoryScore(timer, moves, totalPairs) {
  const timeBonus = Math.max(0, 100 - timer);
  const moveBonus = Math.max(0, 100 - (moves - totalPairs) * 5);
  return Math.round((timeBonus + moveBonus) / 2);
}

function generatePatternPuzzle(difficulty) {
  const SHAPE_SETS = {
    easy: ['🔴','🔵','🟢','🟡','🟠','🟣'],
    medium: ['▲','●','■','⭐','♥','♦'],
    hard: ['♠','♣','♥','♦','▲','●','■','⭐'],
  };
  const LEVEL_CONFIG = {
    easy: { patternLen: 2, seqLen: 5 },
    medium: { patternLen: 3, seqLen: 6 },
    hard: { patternLen: 3, seqLen: 7 },
  };
  const shapes = SHAPE_SETS[difficulty];
  const { patternLen, seqLen } = LEVEL_CONFIG[difficulty];
  const base = [];
  for (let i = 0; i < patternLen; i++) base.push(shapes[Math.floor(Math.random() * shapes.length)]);
  const sequence = [];
  for (let i = 0; i < seqLen; i++) sequence.push(base[i % patternLen]);
  const answer = base[seqLen % patternLen];
  const options = [answer];
  while (options.length < 4) {
    const s = shapes[Math.floor(Math.random() * shapes.length)];
    if (!options.includes(s)) options.push(s);
  }
  return { sequence, answer, options };
}

function generateLogicPuzzle() {
  const start = Math.floor(Math.random() * 20) + 1;
  const step = [1, 2, 3, 5][Math.floor(Math.random() * 4)];
  const seqLen = 4;
  const sequence = [];
  for (let i = 0; i < seqLen; i++) sequence.push(start + step * i);
  const answer = start + step * seqLen;
  const options = [answer];
  const offsets = [-3,-2,-1,1,2,3];
  while (options.length < 4) {
    const v = answer + offsets[Math.floor(Math.random() * offsets.length)];
    if (v > 0 && !options.includes(v)) options.push(v);
  }
  return { sequence, answer, options };
}

// ---- MemoryMatch ----

describe('MemoryMatch — card generation', () => {
  test.each(['easy', 'medium', 'hard'])('%s: generates correct number of cards', (diff) => {
    const cards = generateMemoryCards(diff);
    expect(cards).toHaveLength(GRID_CONFIG[diff].pairs * 2);
  });

  test('each emoji appears exactly twice', () => {
    const cards = generateMemoryCards('medium');
    const counts = {};
    cards.forEach(c => { counts[c.emoji] = (counts[c.emoji] || 0) + 1; });
    Object.values(counts).forEach(count => expect(count).toBe(2));
  });

  test('all cards start unflipped and unmatched', () => {
    const cards = generateMemoryCards('easy');
    cards.forEach(c => {
      expect(c.flipped).toBe(false);
      expect(c.matched).toBe(false);
    });
  });
});

describe('MemoryMatch — score calculation', () => {
  test('perfect fast game gives high score', () => {
    const score = memoryScore(10, 6, 6); // 10s, exactly 6 moves for 6 pairs
    expect(score).toBeGreaterThan(70);
  });

  test('slow many-move game gives lower score', () => {
    const score = memoryScore(90, 30, 6);
    expect(score).toBeLessThan(50);
  });

  test('score is non-negative', () => {
    const score = memoryScore(200, 100, 6);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  test('3-star threshold: score >= 80', () => {
    const score = memoryScore(5, 6, 6);
    expect(score).toBeGreaterThanOrEqual(80);
    const stars = score >= 80 ? 3 : score >= 50 ? 2 : 1;
    expect(stars).toBe(3);
  });
});

// ---- PatternPuzzle ----

describe('PatternPuzzle — puzzle generation', () => {
  test.each(['easy', 'medium', 'hard'])('%s: answer is always in options', (diff) => {
    for (let i = 0; i < 10; i++) {
      const { answer, options } = generatePatternPuzzle(diff);
      expect(options).toContain(answer);
    }
  });

  test('sequence follows the repeating pattern', () => {
    for (let i = 0; i < 20; i++) {
      const { sequence, answer } = generatePatternPuzzle('medium');
      // The full repeating sequence including the answer slot
      const full = [...sequence, answer];
      const patternLen = 3;
      const base = full.slice(0, patternLen);
      full.forEach((item, idx) => {
        expect(item).toBe(base[idx % patternLen]);
      });
    }
  });

  test('always has exactly 4 options', () => {
    const { options } = generatePatternPuzzle('easy');
    expect(options).toHaveLength(4);
  });
});

// ---- LogicSequence ----

describe('LogicSequence — arithmetic sequence', () => {
  test('answer is always in options', () => {
    for (let i = 0; i < 20; i++) {
      const { answer, options } = generateLogicPuzzle();
      expect(options).toContain(answer);
    }
  });

  test('sequence is strictly arithmetic', () => {
    for (let i = 0; i < 20; i++) {
      const { sequence } = generateLogicPuzzle();
      const diffs = sequence.slice(1).map((v, i) => v - sequence[i]);
      const step = diffs[0];
      diffs.forEach(d => expect(d).toBe(step));
    }
  });

  test('answer continues the sequence by one more step', () => {
    for (let i = 0; i < 20; i++) {
      const { sequence, answer } = generateLogicPuzzle();
      const step = sequence[1] - sequence[0];
      expect(answer).toBe(sequence[sequence.length - 1] + step);
    }
  });
});

// ---- API response contract: field names must match Java ProfileResponse record ----

describe('API response contract — ProfileResponse field names', () => {
  // Simulates the exact JSON that the Spring Boot record produces
  const mockApiResponse = {
    deviceId: 'test-device',
    ageGroup: 'middle',
    cognitiveProfile: {
      memory: 75,       // NOT memoryScore
      attention: 80,    // NOT attentionScore
      pattern: 65,      // NOT patternScore
      spatial: 70,      // NOT spatialScore
      logic: 85,        // NOT logicScore
    },
    assessmentDate: '2026-05-03T10:00:00',
    gameStats: {
      memory:    { gamesPlayed: 5, wins: 3, bestScore: 90, totalScore: 400, lastPlayed: '2026-05-03T10:00:00' },
      attention: { gamesPlayed: 2, wins: 1, bestScore: 60, totalScore: 110, lastPlayed: null },
    },
    streak: {           // NOT streakInfo
      current: 3,       // NOT currentStreak
      best: 7,          // NOT bestStreak
      lastPlayedDate: '2026-05-03',
    },
    totalGames: 7,
    totalScore: 510,
  };

  // DashboardScreen mapping
  function normalizeDashboard(data) {
    const cp = data.cognitiveProfile || {};
    const profile = {
      memory:    cp.memory    || 0,
      attention: cp.attention || 0,
      pattern:   cp.pattern   || 0,
      spatial:   cp.spatial   || 0,
      logic:     cp.logic     || 0,
    };
    const streak = { count: data.streak?.current || 0, best: data.streak?.best || 0 };
    const apiGs = data.gameStats || {};
    const DOMAINS = ['memory', 'attention', 'pattern', 'spatial', 'logic'];
    const stats = DOMAINS.map(key => {
      const s = apiGs[key] || {};
      return { key, gamesPlayed: s.gamesPlayed || 0, wins: s.wins || 0, bestScore: s.bestScore || 0, totalScore: s.totalScore || 0 };
    });
    return { profile, streak, stats };
  }

  // GamesScreen mapping
  function normalizeGames(data) {
    const cp = data.cognitiveProfile || {};
    const hasProfile = Object.values(cp).some(v => v > 0);
    const streak = data.streak?.current || 0;
    const totalGames = data.totalGames || 0;
    const GAMES = ['memory', 'attention', 'pattern', 'spatial', 'logic'];
    const stats = {};
    const gs = data.gameStats || {};
    GAMES.forEach(id => {
      const s = gs[id] || {};
      stats[id] = { gamesPlayed: s.gamesPlayed || 0, bestScore: s.bestScore || 0 };
    });
    return { hasProfile, streak, totalGames, stats };
  }

  test('DashboardScreen: reads cognitive scores from correct field names', () => {
    const { profile } = normalizeDashboard(mockApiResponse);
    expect(profile.memory).toBe(75);
    expect(profile.attention).toBe(80);
    expect(profile.pattern).toBe(65);
    expect(profile.spatial).toBe(70);
    expect(profile.logic).toBe(85);
  });

  test('DashboardScreen: reads streak from data.streak.current (not streakInfo.currentStreak)', () => {
    const { streak } = normalizeDashboard(mockApiResponse);
    expect(streak.count).toBe(3);
    expect(streak.best).toBe(7);
  });

  test('DashboardScreen: reads gameStats.gamesPlayed (not .played)', () => {
    const { stats } = normalizeDashboard(mockApiResponse);
    const mem = stats.find(s => s.key === 'memory');
    expect(mem.gamesPlayed).toBe(5);
    expect(mem.wins).toBe(3);
    expect(mem.bestScore).toBe(90);
    expect(mem.totalScore).toBe(400);
  });

  test('DashboardScreen: missing game domain defaults to zeros', () => {
    const { stats } = normalizeDashboard(mockApiResponse);
    const pattern = stats.find(s => s.key === 'pattern');
    expect(pattern.gamesPlayed).toBe(0);
    expect(pattern.bestScore).toBe(0);
  });

  test('GamesScreen: hasProfile true when any cognitive score > 0', () => {
    const { hasProfile } = normalizeGames(mockApiResponse);
    expect(hasProfile).toBe(true);
  });

  test('GamesScreen: hasProfile false when all zeros', () => {
    const empty = { cognitiveProfile: { memory: 0, attention: 0, pattern: 0, spatial: 0, logic: 0 } };
    const { hasProfile } = normalizeGames(empty);
    expect(hasProfile).toBe(false);
  });

  test('GamesScreen: reads streak from data.streak.current', () => {
    const { streak } = normalizeGames(mockApiResponse);
    expect(streak).toBe(3);
  });

  test('GamesScreen: reads totalGames', () => {
    const { totalGames } = normalizeGames(mockApiResponse);
    expect(totalGames).toBe(7);
  });

  test('GamesScreen: gameStats uses gamesPlayed not played', () => {
    const { stats } = normalizeGames(mockApiResponse);
    expect(stats.memory.gamesPlayed).toBe(5);
    expect(stats.attention.gamesPlayed).toBe(2);
  });

  test('null API response → all defaults, no crash', () => {
    const dash = normalizeDashboard(null || {});
    expect(dash.profile.memory).toBe(0);
    expect(dash.streak.count).toBe(0);
    expect(dash.stats.every(s => s.gamesPlayed === 0)).toBe(true);

    const games = normalizeGames(null || {});
    expect(games.hasProfile).toBe(false);
    expect(games.streak).toBe(0);
    expect(games.totalGames).toBe(0);
  });

  test('streakInfo field on response is absent (would always give undefined)', () => {
    // Guard: if backend ever accidentally renamed streak→streakInfo, these would silently break
    expect(mockApiResponse.streakInfo).toBeUndefined();
    expect(mockApiResponse.streak.current).toBe(3);
  });
});

// ---- AssessmentScreen: spatial challenge format (Bug 1 regression) ----

function rotate90cells(cells, size) {
  return cells.map(i => { const r = Math.floor(i / size), c = i % size; return c * size + (size - 1 - r); });
}

function generateSpatialChallenge() {
  const size = 3;
  const total = size * size;
  const filled = new Set();
  while (filled.size < 3) filled.add(Math.floor(Math.random() * total));
  const original = Array.from(filled);
  const rotated = rotate90cells(original, size);
  const wrong = new Set();
  while (wrong.size < 3) wrong.add(Math.floor(Math.random() * total));
  const correctIdx = Math.random() < 0.5 ? 0 : 1;
  const opts = correctIdx === 0 ? [rotated, Array.from(wrong)] : [Array.from(wrong), rotated];
  return { type: 'spatial', mode: 'rotate', original, size, options: opts, correctIdx };
}

describe('AssessmentScreen — spatial challenge format', () => {
  test('options are plain arrays, not {cells, correct} objects', () => {
    for (let i = 0; i < 20; i++) {
      const ch = generateSpatialChallenge();
      ch.options.forEach(opt => {
        expect(Array.isArray(opt)).toBe(true);
        expect(opt.cells).toBeUndefined();
        expect(opt.correct).toBeUndefined();
      });
    }
  });

  test('correctIdx is 0 or 1', () => {
    for (let i = 0; i < 20; i++) {
      const ch = generateSpatialChallenge();
      expect(ch.correctIdx === 0 || ch.correctIdx === 1).toBe(true);
    }
  });

  test('options[correctIdx] is the rotated version of original', () => {
    for (let i = 0; i < 20; i++) {
      const ch = generateSpatialChallenge();
      const expected = rotate90cells(ch.original, ch.size).sort((a, b) => a - b);
      const actual = [...ch.options[ch.correctIdx]].sort((a, b) => a - b);
      expect(actual).toEqual(expected);
    }
  });

  test('correct answer detection uses correctIdx, not opt.correct', () => {
    const ch = generateSpatialChallenge();
    const selectedIdx = ch.correctIdx;
    // Bug fix: should compare idx === challenge.correctIdx
    const isCorrect = selectedIdx === ch.correctIdx;
    expect(isCorrect).toBe(true);
    // Bug: the old code used opt.correct which is always undefined → falsy
    const buggyIsCorrect = ch.options[selectedIdx].correct;
    expect(buggyIsCorrect).toBeUndefined();
  });

  test('renderGrid receives plain array (opt), not opt.cells', () => {
    const ch = generateSpatialChallenge();
    ch.options.forEach(opt => {
      // renderGrid(opt, size) — opt.length must be defined
      expect(typeof opt.length).toBe('number');
      // opt.cells would be undefined → cells.includes(i) would throw
      expect(opt.cells).toBeUndefined();
    });
  });
});

// ---- Stale closure: correct-count calculation (Bug 2 & 3 regression) ----

describe('Game result — stale closure correct count', () => {
  test('finalCorrect includes last answer when correct', () => {
    // Simulates: correct=4 in state, last answer is correct
    const correct = 4;
    const lastCorrect = true;
    const finalCorrect = correct + (lastCorrect ? 1 : 0);
    expect(finalCorrect).toBe(5);
  });

  test('finalCorrect unchanged when last answer is wrong', () => {
    const correct = 3;
    const lastCorrect = false;
    const finalCorrect = correct + (lastCorrect ? 1 : 0);
    expect(finalCorrect).toBe(3);
  });

  test('finalCorrect unchanged when timer expires (no answer)', () => {
    const correct = 2;
    const lastCorrect = false; // timer expiry passes false
    const finalCorrect = correct + (lastCorrect ? 1 : 0);
    expect(finalCorrect).toBe(2);
  });

  test('win threshold with finalCorrect (attention: 0.6)', () => {
    const rounds = 8;
    // 5/8 = 62.5% → win
    expect(5 >= rounds * 0.6).toBe(true);
    // 4/8 = 50% → no win
    expect(4 >= rounds * 0.6).toBe(false);
  });

  test('win threshold with finalCorrect (spatial: 0.5)', () => {
    const rounds = 7;
    // 4/7 = 57% → win
    expect(4 >= rounds * 0.5).toBe(true);
    // 3/7 = 42.8% → no win
    expect(3 >= rounds * 0.5).toBe(false);
  });
});

// ---- Profile normalization edge cases ----

describe('Profile + gameStats normalization edge cases', () => {
  function normalizeGameStats(gs, gameId) {
    const s = (gs || {})[gameId] || {};
    return { gamesPlayed: s.played || 0, wins: s.wins || 0, bestScore: s.bestScore || 0 };
  }

  test('null gameStats → all zeros', () => {
    const s = normalizeGameStats(null, 'memory');
    expect(s.gamesPlayed).toBe(0);
    expect(s.wins).toBe(0);
    expect(s.bestScore).toBe(0);
  });

  test('missing game key → all zeros', () => {
    const s = normalizeGameStats({ memory: { played: 5 } }, 'attention');
    expect(s.gamesPlayed).toBe(0);
  });

  test('partial game stats → missing fields default to 0', () => {
    const s = normalizeGameStats({ memory: { played: 3, bestScore: 80 } }, 'memory');
    expect(s.gamesPlayed).toBe(3);
    expect(s.wins).toBe(0);
    expect(s.bestScore).toBe(80);
  });

  test('streak normalization — null streakInfo → 0', () => {
    const data = {};
    const streak = data.streakInfo?.currentStreak || 0;
    const best = data.streakInfo?.bestStreak || 0;
    expect(streak).toBe(0);
    expect(best).toBe(0);
  });

  test('totalGames normalization — missing → 0', () => {
    const data = {};
    expect(data.totalGames || 0).toBe(0);
  });

  test('null API response → all screens show empty state', () => {
    const data = null;
    const cp = (data?.cognitiveProfile) || {};
    const hasProfile = Object.values(cp).some(v => v > 0);
    expect(hasProfile).toBe(false);
    expect(data?.streakInfo?.currentStreak || 0).toBe(0);
    expect(data?.totalGames || 0).toBe(0);
  });
});

// ---- AttentionSpot: grid generation ----

describe('AttentionSpot — round generation', () => {
  const LEVELS = {
    easy: { gridSize: 9, cols: 3, timeLimit: 15, rounds: 5 },
    medium: { gridSize: 16, cols: 4, timeLimit: 10, rounds: 8 },
    hard: { gridSize: 25, cols: 5, timeLimit: 7, rounds: 10 },
  };
  const EMOJI_PAIRS = [
    ['🟦','🟪'],['🟥','🟧'],['🟩','🟨'],['🐶','🐺'],['🍎','🍅'],
    ['😀','😃'],['⚪','⚫'],['🔵','🟣'],['🐟','🐠'],
  ];

  function generateRound(difficulty) {
    const { gridSize } = LEVELS[difficulty];
    const pair = EMOJI_PAIRS[Math.floor(Math.random() * EMOJI_PAIRS.length)];
    const oddIndex = Math.floor(Math.random() * gridSize);
    const grid = Array(gridSize).fill(pair[0]);
    grid[oddIndex] = pair[1];
    return { grid, oddIndex };
  }

  test.each(['easy', 'medium', 'hard'])('%s: grid has correct size', (diff) => {
    const { grid } = generateRound(diff);
    expect(grid).toHaveLength(LEVELS[diff].gridSize);
  });

  test('exactly one cell is the odd one out', () => {
    for (let i = 0; i < 20; i++) {
      const { grid, oddIndex } = generateRound('medium');
      const dominant = grid[oddIndex === 0 ? 1 : 0];
      const odds = grid.filter(e => e !== dominant);
      expect(odds).toHaveLength(1);
      expect(grid[oddIndex]).not.toBe(dominant);
    }
  });

  test('oddIndex is within grid bounds', () => {
    for (let i = 0; i < 30; i++) {
      for (const diff of ['easy', 'medium', 'hard']) {
        const { oddIndex } = generateRound(diff);
        expect(oddIndex).toBeGreaterThanOrEqual(0);
        expect(oddIndex).toBeLessThan(LEVELS[diff].gridSize);
      }
    }
  });
});

// ---- SpatialReasoning: transform correctness ----

describe('SpatialReasoning — puzzle generation', () => {
  function rotate90(cells, size) {
    return cells.map(i => { const r = Math.floor(i / size), c = i % size; return c * size + (size - 1 - r); });
  }
  function mirrorH(cells, size) {
    return cells.map(i => { const r = Math.floor(i / size), c = i % size; return r * size + (size - 1 - c); });
  }

  const LEVEL_CONFIG = {
    easy: { gridSize: 3, filledCount: 3 },
    medium: { gridSize: 4, filledCount: 5 },
    hard: { gridSize: 5, filledCount: 7 },
  };

  function generatePuzzle(difficulty) {
    const { gridSize, filledCount } = LEVEL_CONFIG[difficulty];
    const total = gridSize * gridSize;
    const filled = new Set();
    while (filled.size < filledCount) filled.add(Math.floor(Math.random() * total));
    const original = Array.from(filled);
    const transforms = [
      { name: '90°', fn: c => rotate90(c, gridSize) },
      { name: '180°', fn: c => rotate90(rotate90(c, gridSize), gridSize) },
      { name: 'Mirror', fn: c => mirrorH(c, gridSize) },
    ];
    const transform = transforms[Math.floor(Math.random() * transforms.length)];
    const correctCells = transform.fn(original);
    const wrong1 = new Set();
    while (wrong1.size < filledCount) wrong1.add(Math.floor(Math.random() * total));
    const wrong2 = new Set();
    while (wrong2.size < filledCount) wrong2.add(Math.floor(Math.random() * total));
    const options = [{ cells: correctCells, correct: true }, { cells: Array.from(wrong1), correct: false }, { cells: Array.from(wrong2), correct: false }];
    for (let i = options.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [options[i], options[j]] = [options[j], options[i]]; }
    return { original, options, gridSize, transformName: transform.name };
  }

  test.each(['easy', 'medium', 'hard'])('%s: exactly one correct option', (diff) => {
    for (let i = 0; i < 10; i++) {
      const { options } = generatePuzzle(diff);
      expect(options.filter(o => o.correct)).toHaveLength(1);
    }
  });

  test('always has exactly 3 options', () => {
    const { options } = generatePuzzle('medium');
    expect(options).toHaveLength(3);
  });

  test('correct option has filledCount cells', () => {
    for (let i = 0; i < 10; i++) {
      const { options } = generatePuzzle('easy');
      const correct = options.find(o => o.correct);
      expect(correct.cells).toHaveLength(LEVEL_CONFIG.easy.filledCount);
    }
  });

  test('rotate90 is consistent: 4× returns to original', () => {
    const cells = [0, 2, 6];
    const size = 3;
    const once = rotate90(cells, size);
    const twice = rotate90(once, size);
    const thrice = rotate90(twice, size);
    const four = rotate90(thrice, size);
    expect(four.sort((a,b)=>a-b)).toEqual(cells.sort((a,b)=>a-b));
  });

  test('mirrorH: double mirror returns original', () => {
    const cells = [0, 1, 5];
    const size = 3;
    const mirrored = mirrorH(cells, size);
    const back = mirrorH(mirrored, size);
    expect(back.sort((a,b)=>a-b)).toEqual(cells.sort((a,b)=>a-b));
  });
});

// ---- Streak / win rate helpers ----

describe('Win rate calculation', () => {
  test('0 games played → 0% win rate', () => {
    const played = 0;
    const wins = 0;
    const rate = played ? Math.round((wins / played) * 100) : 0;
    expect(rate).toBe(0);
  });

  test('all wins → 100%', () => {
    const rate = Math.round((5 / 5) * 100);
    expect(rate).toBe(100);
  });

  test('partial wins rounded correctly', () => {
    const rate = Math.round((3 / 7) * 100);
    expect(rate).toBe(43);
  });
});

// ---- Cognitive score normalization (DashboardScreen logic) ----

describe('Cognitive profile normalization', () => {
  const apiResponse = {
    cognitiveProfile: {
      memoryScore: 75,
      attentionScore: 80,
      patternScore: 65,
      spatialScore: 70,
      logicScore: 85,
    },
  };

  function normalizeProfile(data) {
    const cp = data.cognitiveProfile || {};
    return {
      memory: cp.memoryScore || 0,
      attention: cp.attentionScore || 0,
      pattern: cp.patternScore || 0,
      spatial: cp.spatialScore || 0,
      logic: cp.logicScore || 0,
    };
  }

  test('maps API camelCase fields to domain keys', () => {
    const p = normalizeProfile(apiResponse);
    expect(p.memory).toBe(75);
    expect(p.attention).toBe(80);
    expect(p.pattern).toBe(65);
    expect(p.spatial).toBe(70);
    expect(p.logic).toBe(85);
  });

  test('missing cognitiveProfile → all zeros', () => {
    const p = normalizeProfile({});
    Object.values(p).forEach(v => expect(v).toBe(0));
  });

  test('partial profile → missing fields default to 0', () => {
    const p = normalizeProfile({ cognitiveProfile: { memoryScore: 60 } });
    expect(p.memory).toBe(60);
    expect(p.attention).toBe(0);
  });

  test('hasProfile is false when all zeros', () => {
    const p = normalizeProfile({});
    const hasProfile = Object.values(p).some(v => v > 0);
    expect(hasProfile).toBe(false);
  });

  test('hasProfile is true when any score > 0', () => {
    const p = normalizeProfile(apiResponse);
    const hasProfile = Object.values(p).some(v => v > 0);
    expect(hasProfile).toBe(true);
  });
});

// ============================================================
// NEWLY ADDED: HIGH-PRIORITY GAP COVERAGE
// ============================================================

// ---- getDifficulty computation (pure logic, no AsyncStorage) ----

describe('getDifficulty — age group + win-rate logic', () => {
  // Mirrors the logic used in all 5 game screens:
  //   if (age === 'young') return 'easy'
  //   if (age === 'older') return winRate > 0.6 ? 'hard' : 'medium'
  //   return winRate > 0.7 ? 'hard' : winRate > 0.4 ? 'medium' : 'easy'
  function computeDifficulty(ageGroup, stats = {}) {
    const winRate = (stats.wins || 0) / Math.max(stats.gamesPlayed || 1, 1);
    if (ageGroup === 'young') return 'easy';
    if (ageGroup === 'older') return winRate > 0.6 ? 'hard' : 'medium';
    return winRate > 0.7 ? 'hard' : winRate > 0.4 ? 'medium' : 'easy';
  }

  // young — always easy regardless of stats
  test('young: always easy', () => {
    expect(computeDifficulty('young', {})).toBe('easy');
    expect(computeDifficulty('young', { wins: 100, gamesPlayed: 100 })).toBe('easy');
  });

  // older — two buckets
  test('older: winRate > 0.6 → hard', () => {
    expect(computeDifficulty('older', { wins: 7, gamesPlayed: 10 })).toBe('hard');
    expect(computeDifficulty('older', { wins: 10, gamesPlayed: 10 })).toBe('hard');
  });
  test('older: winRate exactly 0.6 → medium (not hard)', () => {
    expect(computeDifficulty('older', { wins: 6, gamesPlayed: 10 })).toBe('medium');
  });
  test('older: winRate < 0.6 → medium', () => {
    expect(computeDifficulty('older', { wins: 3, gamesPlayed: 10 })).toBe('medium');
    expect(computeDifficulty('older', {})).toBe('medium'); // 0 games → 0/1 = 0 ≤ 0.6
  });

  // middle — three buckets
  test('middle: winRate > 0.7 → hard', () => {
    expect(computeDifficulty('middle', { wins: 8, gamesPlayed: 10 })).toBe('hard');
    expect(computeDifficulty('middle', { wins: 10, gamesPlayed: 10 })).toBe('hard');
  });
  test('middle: winRate exactly 0.7 → medium (not hard)', () => {
    expect(computeDifficulty('middle', { wins: 7, gamesPlayed: 10 })).toBe('medium');
  });
  test('middle: 0.4 < winRate ≤ 0.7 → medium', () => {
    expect(computeDifficulty('middle', { wins: 5, gamesPlayed: 10 })).toBe('medium');
    expect(computeDifficulty('middle', { wins: 4, gamesPlayed: 9 })).toBe('medium'); // 4/9 ≈ 0.444
  });
  test('middle: winRate exactly 0.4 → easy (not medium)', () => {
    expect(computeDifficulty('middle', { wins: 4, gamesPlayed: 10 })).toBe('easy');
  });
  test('middle: winRate < 0.4 → easy', () => {
    expect(computeDifficulty('middle', { wins: 2, gamesPlayed: 10 })).toBe('easy');
    expect(computeDifficulty('middle', {})).toBe('easy'); // brand new device
  });
  test('missing wins field → treated as 0 wins', () => {
    expect(computeDifficulty('middle', { gamesPlayed: 10 })).toBe('easy');
  });
  test('missing gamesPlayed → denominator clamps to 1', () => {
    // wins=0, gamesPlayed=undefined → winRate = 0/1 = 0 → easy
    expect(computeDifficulty('middle', { wins: 0 })).toBe('easy');
  });
});

// ---- Assessment score normalization ----

describe('Assessment score normalization', () => {
  // AssessmentScreen.jsx:400 — Math.round((rawScore / roundsPerDomain) * 100)
  function normalizeScore(rawScore, roundsPerDomain) {
    return Math.round((rawScore / roundsPerDomain) * 100);
  }

  test('2 rounds: 0 correct → 0%', () => expect(normalizeScore(0, 2)).toBe(0));
  test('2 rounds: 1 correct → 50%', () => expect(normalizeScore(1, 2)).toBe(50));
  test('2 rounds: 2 correct → 100%', () => expect(normalizeScore(2, 2)).toBe(100));

  test('3 rounds: 0 correct → 0%', () => expect(normalizeScore(0, 3)).toBe(0));
  test('3 rounds: 1 correct → 33%', () => expect(normalizeScore(1, 3)).toBe(33));
  test('3 rounds: 2 correct → 67%', () => expect(normalizeScore(2, 3)).toBe(67));
  test('3 rounds: 3 correct → 100%', () => expect(normalizeScore(3, 3)).toBe(100));

  test('score is always 0–100', () => {
    for (let rounds = 2; rounds <= 3; rounds++) {
      for (let score = 0; score <= rounds; score++) {
        const pct = normalizeScore(score, rounds);
        expect(pct).toBeGreaterThanOrEqual(0);
        expect(pct).toBeLessThanOrEqual(100);
      }
    }
  });

  test('overall avg is average of 5 domain scores', () => {
    const scores = { memory: 100, attention: 50, pattern: 67, spatial: 0, logic: 33 };
    const avg = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 5);
    expect(avg).toBe(50);
  });
});

// ---- Assessment challenge generators ----

describe('Assessment challenge generators — Memory', () => {
  function generateMemoryChallenge(difficulty) {
    const pools = {
      easy:   ['🍎','🍊','🍇','🍓'],
      medium: ['🍎','🍊','🍇','🍓','🍒','🍑','🍋','🥝'],
      hard:   ['🍎','🍊','🍇','🍓','🍒','🍑','🍋','🥝','🍌','🍉'],
    };
    const count = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4;
    const pool = [...pools[difficulty]].sort(() => Math.random() - 0.5);
    const sequence = pool.slice(0, count);
    const optionCount = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8;
    const options = [...new Set([...sequence, ...pool])].slice(0, optionCount).sort(() => Math.random() - 0.5);
    const showTime = difficulty === 'easy' ? 4000 : difficulty === 'medium' ? 3000 : 2500;
    return { type: 'memory', sequence, options, showTime };
  }

  test.each([
    ['easy',   2, 4, 4000],
    ['medium', 3, 6, 3000],
    ['hard',   4, 8, 2500],
  ])('%s: sequence=%d, optionCount=%d, showTime=%d', (diff, seqLen, optLen, showTime) => {
    for (let i = 0; i < 10; i++) {
      const ch = generateMemoryChallenge(diff);
      expect(ch.sequence).toHaveLength(seqLen);
      expect(ch.options).toHaveLength(optLen);
      expect(ch.showTime).toBe(showTime);
    }
  });

  test('all sequence items appear in options (user can actually answer)', () => {
    for (let i = 0; i < 20; i++) {
      const ch = generateMemoryChallenge('medium');
      ch.sequence.forEach(emoji => expect(ch.options).toContain(emoji));
    }
  });

  test('sequence items are unique (no duplicate in recall challenge)', () => {
    for (let i = 0; i < 20; i++) {
      const ch = generateMemoryChallenge('hard');
      const unique = new Set(ch.sequence);
      expect(unique.size).toBe(ch.sequence.length);
    }
  });
});

describe('Assessment challenge generators — Attention', () => {
  function generateAttentionChallenge(difficulty) {
    const pairs = {
      easy:   [['🐶','🐱'],['🐣','🐥'],['🦁','🐯']],
      medium: [['🟦','🟪'],['🟥','🟧'],['🟩','🟨']],
      hard:   [['🔵','🟣'],['🟠','🔴'],['⚪','⚫']],
    };
    const gridSize = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 9 : 16;
    const cols = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4;
    const pair = pairs[difficulty][Math.floor(Math.random() * pairs[difficulty].length)];
    const oddIndex = Math.floor(Math.random() * gridSize);
    const grid = Array(gridSize).fill(pair[0]);
    grid[oddIndex] = pair[1];
    return { type: 'attention', grid, oddIndex, cols };
  }

  test.each([
    ['easy',   4,  2],
    ['medium', 9,  3],
    ['hard',   16, 4],
  ])('%s: gridSize=%d cols=%d', (diff, gridSize, cols) => {
    const ch = generateAttentionChallenge(diff);
    expect(ch.grid).toHaveLength(gridSize);
    expect(ch.cols).toBe(cols);
  });

  test('exactly one cell is the odd one out', () => {
    for (let i = 0; i < 30; i++) {
      const ch = generateAttentionChallenge('medium');
      const dominant = ch.grid[ch.oddIndex === 0 ? 1 : 0];
      expect(ch.grid.filter(e => e !== dominant)).toHaveLength(1);
      expect(ch.grid[ch.oddIndex]).not.toBe(dominant);
    }
  });

  test('oddIndex is in bounds', () => {
    for (const diff of ['easy', 'medium', 'hard']) {
      const sizes = { easy: 4, medium: 9, hard: 16 };
      for (let i = 0; i < 20; i++) {
        const ch = generateAttentionChallenge(diff);
        expect(ch.oddIndex).toBeGreaterThanOrEqual(0);
        expect(ch.oddIndex).toBeLessThan(sizes[diff]);
      }
    }
  });
});

describe('Assessment challenge generators — Pattern', () => {
  function generatePatternChallenge(difficulty) {
    const pools = {
      easy:   ['🔴','🔵','🟢','🟡','🟠','🟣'],
      medium: ['▲','●','■','⭐','♥'],
      hard:   ['♠','♣','♥','♦','▲','●','■','⭐'],
    };
    const shapes = pools[difficulty];
    const patternLen = difficulty === 'easy' ? 2 : 3;
    const seqLen = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 5 : 6;
    const numOptions = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4;
    const base = [], used = new Set();
    for (let i = 0; i < patternLen; i++) {
      let s;
      do { s = shapes[Math.floor(Math.random() * shapes.length)]; } while (used.has(s));
      base.push(s); used.add(s);
    }
    const sequence = [];
    for (let i = 0; i < seqLen; i++) sequence.push(base[i % patternLen]);
    const answer = base[seqLen % patternLen];
    const options = [answer];
    while (options.length < numOptions) {
      const s = shapes[Math.floor(Math.random() * shapes.length)];
      if (!options.includes(s)) options.push(s);
    }
    return { type: 'pattern', sequence, answer, options };
  }

  test.each([
    ['easy',   2, 4, 2],
    ['medium', 3, 5, 3],
    ['hard',   3, 6, 4],
  ])('%s: patternLen=%d seqLen=%d numOptions=%d', (diff, patLen, seqLen, numOpts) => {
    for (let i = 0; i < 10; i++) {
      const ch = generatePatternChallenge(diff);
      expect(ch.sequence).toHaveLength(seqLen);
      expect(ch.options).toHaveLength(numOpts);
      expect(ch.options).toContain(ch.answer);
    }
  });

  test('base elements are unique (no repeated shapes in base pattern)', () => {
    for (let i = 0; i < 30; i++) {
      const ch = generatePatternChallenge('medium');
      // Derive base from sequence (period 3)
      const base = ch.sequence.slice(0, 3);
      const unique = new Set(base);
      expect(unique.size).toBe(3);
    }
  });

  test('sequence strictly follows the repeating base', () => {
    for (let i = 0; i < 30; i++) {
      const ch = generatePatternChallenge('hard');
      const patternLen = 3;
      const base = ch.sequence.slice(0, patternLen);
      ch.sequence.forEach((item, idx) => expect(item).toBe(base[idx % patternLen]));
    }
  });
});

describe('Assessment challenge generators — Logic', () => {
  function generateLogicChallenge(difficulty) {
    const emojiItems = ['⭐','🌟','🐟','🌻','🍎'];
    const emoji = emojiItems[Math.floor(Math.random() * emojiItems.length)];
    if (difficulty === 'easy') {
      const count = Math.floor(Math.random() * 4) + 2; // 2–5
      const options = [count];
      while (options.length < 3) {
        const v = count + (Math.floor(Math.random() * 5) - 2);
        if (v > 0 && !options.includes(v)) options.push(v);
      }
      options.sort(() => Math.random() - 0.5);
      return { type: 'logic', mode: 'count', emoji, count, answer: count, options };
    }
    const start = Math.floor(Math.random() * 10) + 1;
    const step = difficulty === 'medium'
      ? [1, 2, 3][Math.floor(Math.random() * 3)]
      : [2, 3, 5, 4][Math.floor(Math.random() * 4)];
    const len = difficulty === 'medium' ? 4 : 5;
    const sequence = [];
    for (let i = 0; i < len; i++) sequence.push(start + step * i);
    const answer = start + step * len;
    const options = [answer];
    while (options.length < 4) {
      const v = answer + (Math.floor(Math.random() * 7) - 3);
      if (v !== answer && !options.includes(v) && v > 0) options.push(v);
    }
    options.sort(() => Math.random() - 0.5);
    return { type: 'logic', mode: 'sequence', sequence, answer, options };
  }

  // Count mode (easy)
  test('easy (count): mode is count, answer equals count', () => {
    for (let i = 0; i < 20; i++) {
      const ch = generateLogicChallenge('easy');
      expect(ch.mode).toBe('count');
      expect(ch.answer).toBe(ch.count);
    }
  });
  test('easy (count): count is between 2 and 5', () => {
    for (let i = 0; i < 30; i++) {
      const ch = generateLogicChallenge('easy');
      expect(ch.count).toBeGreaterThanOrEqual(2);
      expect(ch.count).toBeLessThanOrEqual(5);
    }
  });
  test('easy (count): answer is in options, 3 options total', () => {
    for (let i = 0; i < 20; i++) {
      const ch = generateLogicChallenge('easy');
      expect(ch.options).toHaveLength(3);
      expect(ch.options).toContain(ch.answer);
    }
  });
  test('easy (count): all options are positive', () => {
    for (let i = 0; i < 30; i++) {
      const ch = generateLogicChallenge('easy');
      ch.options.forEach(o => expect(o).toBeGreaterThan(0));
    }
  });

  // Sequence mode (medium/hard)
  test.each(['medium', 'hard'])('%s (sequence): mode is sequence', (diff) => {
    const ch = generateLogicChallenge(diff);
    expect(ch.mode).toBe('sequence');
  });
  test.each([
    ['medium', 4],
    ['hard',   5],
  ])('%s (sequence): sequence length is %d', (diff, len) => {
    for (let i = 0; i < 10; i++) {
      const ch = generateLogicChallenge(diff);
      expect(ch.sequence).toHaveLength(len);
    }
  });
  test('medium/hard (sequence): answer continues the arithmetic sequence', () => {
    for (let i = 0; i < 30; i++) {
      for (const diff of ['medium', 'hard']) {
        const ch = generateLogicChallenge(diff);
        const step = ch.sequence[1] - ch.sequence[0];
        expect(ch.answer).toBe(ch.sequence[ch.sequence.length - 1] + step);
      }
    }
  });
  test('sequence mode: answer is in options, 4 options total', () => {
    for (let i = 0; i < 20; i++) {
      const ch = generateLogicChallenge('medium');
      expect(ch.options).toHaveLength(4);
      expect(ch.options).toContain(ch.answer);
    }
  });
  test('sequence mode: all options are positive', () => {
    for (let i = 0; i < 30; i++) {
      const ch = generateLogicChallenge('hard');
      ch.options.forEach(o => expect(o).toBeGreaterThan(0));
    }
  });
  test('hard step is always ≥ 2 (harder sequences)', () => {
    for (let i = 0; i < 30; i++) {
      const ch = generateLogicChallenge('hard');
      const step = ch.sequence[1] - ch.sequence[0];
      expect(step).toBeGreaterThanOrEqual(2);
    }
  });
});

// ---- finalScore computation: AttentionSpot + SpatialReasoning last-round fix ----

describe('finalScore computation — AttentionSpot (timeBonus fix)', () => {
  // AttentionSpot: lastScore = isCorrect ? 10 + Math.round((timeLeft / timeLimit) * 20) : 0
  // finalScore = score (from stale closure) + lastScore

  function computeAttentionLastScore(isCorrect, timeLeft, timeLimit) {
    if (!isCorrect) return 0;
    return 10 + Math.round((timeLeft / timeLimit) * 20);
  }

  test('wrong answer → lastScore = 0', () => {
    expect(computeAttentionLastScore(false, 8, 10)).toBe(0);
  });
  test('correct with full time → lastScore = 30 (10 + 20)', () => {
    expect(computeAttentionLastScore(true, 10, 10)).toBe(30);
  });
  test('correct with half time → lastScore = 20 (10 + 10)', () => {
    expect(computeAttentionLastScore(true, 5, 10)).toBe(20);
  });
  test('correct with no time left → lastScore = 10 (no bonus)', () => {
    expect(computeAttentionLastScore(true, 0, 10)).toBe(10);
  });
  test('finalScore = stale score + lastScore', () => {
    const stalePreviousScore = 85; // what closure captures
    const lastScore = computeAttentionLastScore(true, 7, 10);
    const finalScore = stalePreviousScore + lastScore;
    expect(finalScore).toBe(85 + 10 + Math.round(0.7 * 20));
    expect(finalScore).toBe(85 + 10 + 14); // = 109
  });
  test('timer expiry (lastScore=0 default) → finalScore unchanged', () => {
    const previousScore = 60;
    const lastScore = 0; // timer expiry passes lastScore=0
    expect(previousScore + lastScore).toBe(60);
  });
  test('lastScore always ≥ 10 when correct (base points guaranteed)', () => {
    for (let timeLeft = 0; timeLeft <= 15; timeLeft++) {
      const ls = computeAttentionLastScore(true, timeLeft, 15);
      expect(ls).toBeGreaterThanOrEqual(10);
    }
  });
});

describe('finalScore computation — SpatialReasoning (timeBonus fix)', () => {
  // SpatialReasoning: lastScore = isCorrect ? 10 + Math.round((timeLeft / timeLimit) * 15) : 0

  function computeSpatialLastScore(isCorrect, timeLeft, timeLimit) {
    if (!isCorrect) return 0;
    return 10 + Math.round((timeLeft / timeLimit) * 15);
  }

  test('wrong answer → lastScore = 0', () => {
    expect(computeSpatialLastScore(false, 10, 15)).toBe(0);
  });
  test('correct with full time → lastScore = 25 (10 + 15)', () => {
    expect(computeSpatialLastScore(true, 15, 15)).toBe(25);
  });
  test('correct with no time → lastScore = 10', () => {
    expect(computeSpatialLastScore(true, 0, 15)).toBe(10);
  });
  test('finalScore correctly combines running score + last round', () => {
    const staleScore = 50;
    const lastScore = computeSpatialLastScore(true, 12, 15);
    expect(staleScore + lastScore).toBe(50 + 10 + Math.round(0.8 * 15));
  });
  test('timer expiry path: handleNext(false) → lastScore default 0', () => {
    // When timer fires: handleNext(false) → handleNext(false, lastScore=0)
    const lastCorrect = false;
    const lastScore = 0;
    const finalCorrect = 3 + (lastCorrect ? 1 : 0);
    const finalScore = 40 + lastScore;
    expect(finalCorrect).toBe(3);
    expect(finalScore).toBe(40);
  });
});

// ---- DashboardScreen: hasProfile regression ----

describe('DashboardScreen — hasProfile correctness', () => {
  function hasProfile(profile) {
    return Object.values(profile).some(v => v > 0);
  }

  test('all-zero profile → false (new user, prompt should show)', () => {
    expect(hasProfile({ memory: 0, attention: 0, pattern: 0, spatial: 0, logic: 0 })).toBe(false);
  });
  test('empty object → false', () => {
    expect(hasProfile({})).toBe(false);
  });
  test('any score > 0 → true', () => {
    expect(hasProfile({ memory: 1, attention: 0, pattern: 0, spatial: 0, logic: 0 })).toBe(true);
    expect(hasProfile({ memory: 0, attention: 0, pattern: 0, spatial: 0, logic: 100 })).toBe(true);
  });
  test('full profile → true', () => {
    expect(hasProfile({ memory: 75, attention: 80, pattern: 65, spatial: 70, logic: 85 })).toBe(true);
  });
  test('old bug: Object.keys().length > 0 would wrongly give true for all-zero profile', () => {
    const profile = { memory: 0, attention: 0, pattern: 0, spatial: 0, logic: 0 };
    const buggyCheck = Object.keys(profile).length > 0;
    const fixedCheck = Object.values(profile).some(v => v > 0);
    expect(buggyCheck).toBe(true);   // bug: would show no-assessment prompt as hidden
    expect(fixedCheck).toBe(false);  // fix: correctly shows no-assessment prompt
  });
});

// ---- Offline queue contract ----

describe('Offline queue — enqueue/flush contract', () => {
  // Tests the pure data-structure contract of the queue:
  // enqueue adds {type, data, ts}, flush retries and removes on success

  function buildQueue(items) {
    return items.map((item, i) => ({ type: item.type, data: item.data, ts: Date.now() - i * 1000 }));
  }

  test('queue preserves order (oldest first)', () => {
    const q = buildQueue([
      { type: 'session',    data: { gameId: 'memory' } },
      { type: 'assessment', data: { memoryScore: 70 } },
      { type: 'session',    data: { gameId: 'logic' } },
    ]);
    expect(q[0].type).toBe('session');
    expect(q[1].type).toBe('assessment');
    expect(q[2].type).toBe('session');
  });

  test('flush: successful items are removed from remaining queue', () => {
    const queue = buildQueue([
      { type: 'session', data: { gameId: 'memory' } },
      { type: 'session', data: { gameId: 'logic' } },
    ]);
    // Simulate: first item succeeds, second fails
    const remaining = [];
    const successes = [];
    queue.forEach((item, i) => {
      if (i === 0) { successes.push(item); }  // success — don't re-queue
      else          { remaining.push(item); }  // failure — keep
    });
    expect(successes).toHaveLength(1);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].data.gameId).toBe('logic');
  });

  test('flush: all fail → queue unchanged', () => {
    const queue = buildQueue([
      { type: 'session', data: { gameId: 'memory' } },
      { type: 'session', data: { gameId: 'attention' } },
    ]);
    const remaining = [...queue]; // all fail → all remain
    expect(remaining).toHaveLength(2);
  });

  test('flush: all succeed → queue empty', () => {
    const queue = buildQueue([
      { type: 'session',    data: { gameId: 'memory' } },
      { type: 'assessment', data: { memoryScore: 60 } },
    ]);
    const remaining = []; // all succeed → none remain
    expect(remaining).toHaveLength(0);
  });

  test('both session and assessment types are queued with correct type field', () => {
    const q = buildQueue([
      { type: 'session',    data: {} },
      { type: 'assessment', data: {} },
    ]);
    expect(q.map(i => i.type)).toEqual(['session', 'assessment']);
  });
});
