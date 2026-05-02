import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { getItem, setItem, KEYS } from '../../storage';
import GameHeader from '../../components/GameHeader';
import ResultScreen from '../../components/ResultScreen';
import { colors, spacing, radius, shadow } from '../../theme';

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

async function getDifficulty() {
  const age = (await getItem(KEYS.AGE_GROUP)) || 'middle';
  const stats = (await getItem(KEYS.GAME_ATTENTION)) || {};
  const winRate = (stats.wins || 0) / Math.max(stats.gamesPlayed || 1, 1);
  if (age === 'young') return 'easy';
  if (age === 'older') return winRate > 0.6 ? 'hard' : 'medium';
  return winRate > 0.7 ? 'hard' : winRate > 0.4 ? 'medium' : 'easy';
}

export default function AttentionSpot({ navigation }) {
  const [ready, setReady] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [round, setRound] = useState(0);
  const [data, setData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [totalTime, setTotalTime] = useState(0);

  useEffect(() => {
    (async () => {
      const diff = await getDifficulty();
      setDifficulty(diff);
      setData(generateRound(diff));
      setTimeLeft(LEVELS[diff].timeLimit);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready || gameOver || feedback) return;
    if (timeLeft <= 0) { nextRound(false); return; }
    const t = setTimeout(() => { setTimeLeft(tl => tl - 1); setTotalTime(tt => tt + 1); }, 1000);
    return () => clearTimeout(t);
  }, [timeLeft, gameOver, feedback, ready]);

  const config = ready ? LEVELS[difficulty] : LEVELS.medium;

  const handleClick = (idx) => {
    if (feedback || gameOver) return;
    const isCorrect = idx === data.oddIndex;
    setFeedback({ idx, correct: isCorrect });
    if (isCorrect) {
      const bonus = Math.round((timeLeft / config.timeLimit) * 20);
      setScore(s => s + 10 + bonus);
      setCorrect(c => c + 1);
    }
    setTimeout(() => nextRound(isCorrect), 600);
  };

  const nextRound = () => {
    if (round + 1 >= config.rounds) {
      setGameOver(true);
      saveResult();
      return;
    }
    setRound(r => r + 1);
    setData(generateRound(difficulty));
    setTimeLeft(config.timeLimit);
    setFeedback(null);
  };

  const saveResult = async () => {
    const stats = (await getItem(KEYS.GAME_ATTENTION)) || {};
    await setItem(KEYS.GAME_ATTENTION, {
      gamesPlayed: (stats.gamesPlayed || 0) + 1,
      wins: (stats.wins || 0) + (correct >= config.rounds * 0.6 ? 1 : 0),
      bestScore: Math.max(stats.bestScore || 0, score),
      totalScore: (stats.totalScore || 0) + score,
      lastPlayed: new Date().toISOString(),
    });
  };

  const restart = async () => {
    const diff = await getDifficulty();
    setDifficulty(diff);
    setData(generateRound(diff));
    setTimeLeft(LEVELS[diff].timeLimit);
    setScore(0); setCorrect(0); setFeedback(null); setGameOver(false); setTotalTime(0); setRound(0);
  };

  if (!ready || !data) return null;

  if (gameOver) {
    const pct = correct / config.rounds;
    const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : 1;
    return (
      <ResultScreen
        icon="👁️"
        title="Sharp Eyes!"
        stars={stars}
        stats={[{ label: 'Score', value: score }, { label: 'Correct', value: `${correct}/${config.rounds}` }, { label: 'Time', value: `${totalTime}s` }]}
        onPlayAgain={restart}
        onBack={() => navigation.goBack()}
      />
    );
  }

  const timerColor = timeLeft <= 3 ? colors.red : timeLeft <= 5 ? colors.amber : colors.primary;
  const cellSize = Math.min(60, (320 - config.cols * 6) / config.cols);

  return (
    <SafeAreaView style={styles.safe}>
      <GameHeader
        left={<Text style={[styles.timer, { color: timerColor }]}>⏱️ {timeLeft}s</Text>}
        center={`Round ${round + 1}/${config.rounds}`}
        right={<Text style={styles.scoreText}>🎯 {score}</Text>}
        showBack={false}
      />
      <View style={styles.container}>
        <Text style={styles.prompt}>Find the odd one out!</Text>
        <View style={[styles.grid, { maxWidth: config.cols * (cellSize + 8) }]}>
          {data.grid.map((emoji, i) => (
            <TouchableOpacity
              key={`${round}-${i}`}
              style={[
                styles.cell,
                { width: cellSize, height: cellSize },
                feedback && i === data.oddIndex && styles.cellCorrect,
                feedback && i === feedback.idx && !feedback.correct && styles.cellWrong,
              ]}
              onPress={() => handleClick(i)}
              activeOpacity={0.8}
            >
              <Text style={[styles.cellEmoji, { fontSize: cellSize * 0.5 }]}>{emoji}</Text>
            </TouchableOpacity>
          ))}
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
  prompt: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: spacing.lg, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  cell: { margin: 3, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', ...shadow.sm },
  cellCorrect: { borderColor: colors.green, backgroundColor: '#F0FDF4' },
  cellWrong: { borderColor: colors.red, backgroundColor: '#FEF2F2' },
  cellEmoji: {},
  timer: { fontSize: 15, fontWeight: '800' },
  scoreText: { fontSize: 14, fontWeight: '800', color: colors.primary },
  progressBg: { width: '100%', height: 8, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden', marginTop: spacing.lg },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.full },
});
