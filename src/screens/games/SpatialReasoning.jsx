import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getItem, setItem, KEYS } from '../../storage';
import { saveSession } from '../../api/brainspark';
import GameHeader from '../../components/GameHeader';
import ResultScreen from '../../components/ResultScreen';
import { GAMES } from '../../constants';
import { colors, spacing, radius, shadow } from '../../theme';

const LEVEL_CONFIG = {
  easy: { gridSize: 3, filledCount: 3, rounds: 5, timeLimit: 20 },
  medium: { gridSize: 4, filledCount: 5, rounds: 7, timeLimit: 15 },
  hard: { gridSize: 5, filledCount: 7, rounds: 10, timeLimit: 12 },
};

function rotate90(cells, size) {
  return cells.map(i => { const r = Math.floor(i / size), c = i % size; return c * size + (size - 1 - r); });
}
function mirrorH(cells, size) {
  return cells.map(i => { const r = Math.floor(i / size), c = i % size; return r * size + (size - 1 - c); });
}

function cellsMatch(a, b) {
  return [...a].sort((x, y) => x - y).join(',') === [...b].sort((x, y) => x - y).join(',');
}

function makeWrongOption(total, filledCount, ...exclude) {
  let arr;
  do {
    const s = new Set();
    while (s.size < filledCount) s.add(Math.floor(Math.random() * total));
    arr = Array.from(s);
  } while (exclude.some(e => cellsMatch(arr, e)));
  return arr;
}

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
  const wrong1 = makeWrongOption(total, filledCount, correctCells);
  const wrong2 = makeWrongOption(total, filledCount, correctCells, wrong1);
  const options = [{ cells: correctCells, correct: true }, { cells: wrong1, correct: false }, { cells: wrong2, correct: false }];
  for (let i = options.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [options[i], options[j]] = [options[j], options[i]]; }
  return { original, options, gridSize, transformName: transform.name };
}

async function getDifficulty() {
  const age = (await getItem(KEYS.AGE_GROUP)) || 'middle';
  const stats = (await getItem(KEYS.GAME_SPATIAL)) || {};
  const winRate = (stats.wins || 0) / Math.max(stats.gamesPlayed || 1, 1);
  if (age === 'young') return 'easy';
  if (age === 'older') return winRate > 0.6 ? 'hard' : 'medium';
  return winRate > 0.7 ? 'hard' : winRate > 0.4 ? 'medium' : 'easy';
}

function MiniGrid({ cells, size, cellSize, highlight, dim }) {
  return (
    <View style={[styles.miniGrid, dim && { opacity: 0.4 }, { width: size * (cellSize + 3) + 8 }]}>
      {Array(size * size).fill(0).map((_, i) => (
        <View key={i} style={[styles.miniCell, { width: cellSize, height: cellSize, backgroundColor: cells.includes(i) ? (highlight ? colors.green : colors.primary) : colors.border }]} />
      ))}
    </View>
  );
}

export default function SpatialReasoning({ navigation }) {
  const [ready, setReady] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [round, setRound] = useState(0);
  const [puzzle, setPuzzle] = useState(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [selected, setSelected] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [totalTime, setTotalTime] = useState(0);

  useEffect(() => {
    (async () => {
      const diff = await getDifficulty();
      setDifficulty(diff);
      setPuzzle(generatePuzzle(diff));
      setTimeLeft(LEVEL_CONFIG[diff].timeLimit);
      setReady(true);
    })();
  }, []);

  const config = ready ? LEVEL_CONFIG[difficulty] : LEVEL_CONFIG.medium;

  useEffect(() => {
    if (!ready || gameOver || selected !== null) return;
    if (timeLeft <= 0) { handleNext(false); return; }
    const t = setTimeout(() => { setTimeLeft(tl => tl - 1); setTotalTime(tt => tt + 1); }, 1000);
    return () => clearTimeout(t);
  }, [timeLeft, gameOver, selected, ready]);

  const handleSelect = (idx) => {
    if (selected !== null || gameOver) return;
    setSelected(idx);
    const isCorrect = puzzle.options[idx].correct;
    let lastScore = 0;
    if (isCorrect) { const bonus = Math.round((timeLeft / config.timeLimit) * 15); lastScore = 10 + bonus; setScore(s => s + lastScore); setCorrect(c => c + 1); }
    setTimeout(() => handleNext(isCorrect, lastScore), 800);
  };

  const handleNext = (lastCorrect, lastScore = 0) => {
    if (round + 1 >= config.rounds) { setGameOver(true); saveResult(lastCorrect, lastScore); return; }
    setRound(r => r + 1);
    setPuzzle(generatePuzzle(difficulty));
    setSelected(null);
    setTimeLeft(config.timeLimit);
  };

  const saveResult = async (lastCorrect, lastScore = 0) => {
    const finalCorrect = correct + (lastCorrect ? 1 : 0);
    const finalScore = score + lastScore;
    const win = finalCorrect >= config.rounds * 0.5;
    const stats = (await getItem(KEYS.GAME_SPATIAL)) || {};
    await setItem(KEYS.GAME_SPATIAL, {
      gamesPlayed: (stats.gamesPlayed || 0) + 1,
      wins: (stats.wins || 0) + (win ? 1 : 0),
      bestScore: Math.max(stats.bestScore || 0, finalScore),
      totalScore: (stats.totalScore || 0) + finalScore,
      lastPlayed: new Date().toISOString(),
    });
    saveSession({ gameId: 'spatial', difficulty, score: finalScore, correctAnswers: finalCorrect, totalRounds: config.rounds, durationSeconds: totalTime, win });
  };

  const restart = async () => {
    const diff = await getDifficulty();
    setDifficulty(diff);
    setPuzzle(generatePuzzle(diff));
    setTimeLeft(LEVEL_CONFIG[diff].timeLimit);
    setRound(0); setScore(0); setCorrect(0); setSelected(null); setGameOver(false); setTotalTime(0);
  };

  if (!ready || !puzzle) return null;

  if (gameOver) {
    const pct = correct / config.rounds;
    const stars = pct >= 0.85 ? 3 : pct >= 0.6 ? 2 : 1;
    return (
      <ResultScreen
        icon="🗺️"
        title="Spatial Genius!"
        stars={stars}
        stats={[{ label: 'Score', value: score }, { label: 'Correct', value: `${correct}/${config.rounds}` }, { label: 'Time', value: `${totalTime}s` }]}
        onPlayAgain={restart}
        onNextGame={() => { const g = GAMES[Math.floor(Math.random() * GAMES.length)]; navigation.replace('Game', { gameId: g.id }); }}
        onBack={() => navigation.goBack()}
      />
    );
  }

  const timerColor = timeLeft <= 3 ? colors.red : timeLeft <= 5 ? colors.amber : colors.primary;
  const cellSize = Math.max(20, Math.min(32, 120 / puzzle.gridSize));

  return (
    <SafeAreaView style={styles.safe}>
      <GameHeader
        left={<Text style={[styles.timerText, { color: timerColor }]}>⏱️ {timeLeft}s</Text>}
        center={`Round ${round + 1}/${config.rounds}`}
        right={<Text style={styles.scoreText}>🎯 {score}</Text>}
        showBack={false}
      />
      <View style={styles.container}>
        <Text style={styles.prompt}>Find the {puzzle.transformName} transformation</Text>
        <Text style={styles.label}>ORIGINAL</Text>
        <View style={{ marginBottom: spacing.lg }}>
          <MiniGrid cells={puzzle.original} size={puzzle.gridSize} cellSize={cellSize} />
        </View>
        <View style={styles.options}>
          {puzzle.options.map((opt, i) => {
            const isCorrect = selected !== null && opt.correct;
            const isWrong = selected !== null && i === selected && !opt.correct;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.optionWrap, isCorrect && styles.optionCorrect, isWrong && styles.optionWrong]}
                onPress={() => handleSelect(i)}
                activeOpacity={0.8}
              >
                <Text style={styles.optionLabel}>Option {i + 1}</Text>
                <MiniGrid cells={opt.cells} size={puzzle.gridSize} cellSize={cellSize} highlight={isCorrect} />
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${(round / config.rounds) * 100}%` }]} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  prompt: { fontSize: 18, fontWeight: '800', color: colors.textMuted, marginBottom: spacing.sm, textAlign: 'center' },
  label: { fontSize: 11, fontWeight: '700', color: colors.textLight, letterSpacing: 1, marginBottom: 8 },
  miniGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.border, borderRadius: radius.md, padding: 4, gap: 3, alignSelf: 'center' },
  miniCell: { borderRadius: 4, margin: 1.5 },
  options: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap', justifyContent: 'center', marginBottom: spacing.lg },
  optionWrap: { padding: spacing.sm, borderRadius: radius.lg, borderWidth: 3, borderColor: 'transparent', alignItems: 'center' },
  optionCorrect: { borderColor: colors.green, backgroundColor: '#F0FDF4' },
  optionWrong: { borderColor: colors.red, backgroundColor: '#FEF2F2' },
  optionLabel: { fontSize: 11, fontWeight: '700', color: colors.textLight, marginBottom: 6 },
  timerText: { fontSize: 14, fontWeight: '800' },
  scoreText: { fontSize: 14, fontWeight: '800', color: colors.primary },
  progressBg: { width: '100%', height: 8, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.amber, borderRadius: radius.full },
});
