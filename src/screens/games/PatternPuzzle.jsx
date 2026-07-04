import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getItem, setItem, KEYS } from '../../storage';
import { saveSession } from '../../api/timmble';
import GameHeader from '../../components/GameHeader';
import ResultScreen from '../../components/ResultScreen';
import { GAMES } from '../../constants';
import { colors, spacing, radius, shadow } from '../../theme';

const SHAPE_SETS = {
  easy: ['🔴','🔵','🟢','🟡','🟠','🟣'],
  medium: ['▲','●','■','⭐','♥','♦'],
  hard: ['♠','♣','♥','♦','▲','●','■','⭐'],
};
const LEVEL_CONFIG = {
  easy: { patternLen: 2, seqLen: 5, rounds: 5 },
  medium: { patternLen: 3, seqLen: 6, rounds: 7 },
  hard: { patternLen: 3, seqLen: 7, rounds: 10 },
};

function generatePuzzle(difficulty) {
  const shapes = SHAPE_SETS[difficulty];
  const { patternLen, seqLen } = LEVEL_CONFIG[difficulty];
  const base = [];
  for (let i = 0; i < patternLen; i++) base.push(shapes[Math.floor(Math.random() * shapes.length)]);
  const sequence = [];
  for (let i = 0; i < seqLen; i++) sequence.push(base[i % patternLen]);
  const answer = base[seqLen % patternLen];
  const options = [answer];
  while (options.length < 4) { const s = shapes[Math.floor(Math.random() * shapes.length)]; if (!options.includes(s)) options.push(s); }
  for (let i = options.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [options[i], options[j]] = [options[j], options[i]]; }
  return { sequence, answer, options };
}

async function getDifficulty() {
  const age = (await getItem(KEYS.AGE_GROUP)) || 'middle';
  const stats = (await getItem(KEYS.GAME_PATTERN)) || {};
  const winRate = (stats.wins || 0) / Math.max(stats.gamesPlayed || 1, 1);
  if (age === 'young') return 'easy';
  if (age === 'older') return winRate > 0.6 ? 'hard' : 'medium';
  return winRate > 0.7 ? 'hard' : winRate > 0.4 ? 'medium' : 'easy';
}

export default function PatternPuzzle({ navigation }) {
  const [ready, setReady] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [round, setRound] = useState(0);
  const [puzzle, setPuzzle] = useState(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [selected, setSelected] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    (async () => {
      const diff = await getDifficulty();
      setDifficulty(diff);
      setPuzzle(generatePuzzle(diff));
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready || gameOver) return;
    const t = setInterval(() => setTimer(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [ready, gameOver]);

  const config = ready ? LEVEL_CONFIG[difficulty] : LEVEL_CONFIG.medium;

  const handleSelect = (option) => {
    if (selected !== null) return;
    setSelected(option);
    const isCorrect = option === puzzle.answer;
    if (isCorrect) { setScore(s => s + 15); setCorrect(c => c + 1); }
    setTimeout(() => {
      if (round + 1 >= config.rounds) { setGameOver(true); saveResult(isCorrect); return; }
      setRound(r => r + 1);
      setPuzzle(generatePuzzle(difficulty));
      setSelected(null);
    }, 800);
  };

  const saveResult = async (lastCorrect) => {
    const finalCorrect = correct + (lastCorrect ? 1 : 0);
    const finalScore = score + (lastCorrect ? 15 : 0);
    const win = finalCorrect >= config.rounds * 0.6;
    const stats = (await getItem(KEYS.GAME_PATTERN)) || {};
    await setItem(KEYS.GAME_PATTERN, {
      gamesPlayed: (stats.gamesPlayed || 0) + 1,
      wins: (stats.wins || 0) + (win ? 1 : 0),
      bestScore: Math.max(stats.bestScore || 0, finalScore),
      totalScore: (stats.totalScore || 0) + finalScore,
      lastPlayed: new Date().toISOString(),
    });
    saveSession({ gameId: 'pattern', difficulty, score: finalScore, correctAnswers: finalCorrect, totalRounds: config.rounds, durationSeconds: timer, win });
  };

  const restart = async () => {
    const diff = await getDifficulty();
    setDifficulty(diff);
    setPuzzle(generatePuzzle(diff));
    setRound(0); setScore(0); setCorrect(0); setSelected(null); setGameOver(false); setTimer(0);
  };

  if (!ready || !puzzle) return null;

  if (gameOver) {
    const pct = correct / config.rounds;
    const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : 1;
    return (
      <ResultScreen
        icon="🔍"
        title="Pattern Master!"
        stars={stars}
        stats={[{ label: 'Score', value: score }, { label: 'Correct', value: `${correct}/${config.rounds}` }, { label: 'Time', value: `${timer}s` }]}
        onPlayAgain={restart}
        onNextGame={() => { const g = GAMES[Math.floor(Math.random() * GAMES.length)]; navigation.replace('Game', { gameId: g.id }); }}
        onBack={() => navigation.goBack()}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <GameHeader
        left={<Text style={styles.timerText}>⏱️ {timer}s</Text>}
        center={`Round ${round + 1}/${config.rounds}`}
        right={<Text style={styles.scoreText}>🎯 {score}</Text>}
        showBack={false}
      />
      <View style={styles.container}>
        <Text style={styles.prompt}>What comes next in the pattern?</Text>
        <View style={styles.sequence}>
          {puzzle.sequence.map((s, i) => (
            <View key={i} style={styles.seqItem}><Text style={styles.seqText}>{s}</Text></View>
          ))}
          <View style={[styles.seqItem, styles.seqBlank]}><Text style={styles.seqText}>?</Text></View>
        </View>
        <View style={styles.options}>
          {puzzle.options.map((o, i) => {
            const isCorrect = selected !== null && o === puzzle.answer;
            const isWrong = selected !== null && o === selected && o !== puzzle.answer;
            return (
              <TouchableOpacity key={i} style={[styles.option, isCorrect && styles.optionCorrect, isWrong && styles.optionWrong]} onPress={() => handleSelect(o)}>
                <Text style={styles.optionText}>{o}</Text>
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
  prompt: { fontSize: 18, fontWeight: '800', color: colors.textMuted, marginBottom: spacing.lg, textAlign: 'center' },
  sequence: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: spacing.xl },
  seqItem: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', ...shadow.sm },
  seqBlank: { borderStyle: 'dashed', borderColor: colors.primary },
  seqText: { fontSize: 26 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center', marginBottom: spacing.xl },
  option: { width: 72, height: 72, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', ...shadow.sm },
  optionCorrect: { borderColor: colors.green, backgroundColor: '#F0FDF4' },
  optionWrong: { borderColor: colors.red, backgroundColor: '#FEF2F2' },
  optionText: { fontSize: 28 },
  timerText: { fontSize: 14, fontWeight: '700', color: colors.text },
  scoreText: { fontSize: 14, fontWeight: '800', color: colors.primary },
  progressBg: { width: '100%', height: 8, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.secondary, borderRadius: radius.full },
});
