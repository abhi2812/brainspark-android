import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { getItem, setItem, KEYS } from '../../storage';
import GameHeader from '../../components/GameHeader';
import ResultScreen from '../../components/ResultScreen';
import { colors, spacing, radius, shadow } from '../../theme';

const LEVEL_CONFIG = {
  easy: { rounds: 5, seqLen: 4 },
  medium: { rounds: 7, seqLen: 5 },
  hard: { rounds: 10, seqLen: 6 },
};

function generatePuzzle(difficulty) {
  const { seqLen } = LEVEL_CONFIG[difficulty];
  const puzzleType = Math.random();
  let sequence, answer;
  if (puzzleType < 0.4) {
    const start = Math.floor(Math.random() * 20) + 1;
    const step = difficulty === 'easy' ? [1,2,3,5][Math.floor(Math.random()*4)] : [2,3,4,5,6,7][Math.floor(Math.random()*6)];
    sequence = []; for (let i = 0; i < seqLen; i++) sequence.push(start + step * i); answer = start + step * seqLen;
  } else if (puzzleType < 0.65) {
    const start = Math.floor(Math.random() * 5) + 1, mult = [2,3][Math.floor(Math.random()*2)];
    sequence = [start]; for (let i = 1; i < seqLen; i++) sequence.push(sequence[i-1]*mult); answer = sequence[seqLen-1]*mult;
  } else if (puzzleType < 0.85) {
    const start = Math.floor(Math.random()*10)+1, a=[1,2,3][Math.floor(Math.random()*3)], b=[2,3,5][Math.floor(Math.random()*3)];
    sequence = [start]; for (let i=1;i<seqLen;i++) sequence.push(sequence[i-1]+(i%2===1?a:b)); answer = sequence[seqLen-1]+(seqLen%2===1?a:b);
  } else {
    const a = Math.floor(Math.random()*5)+1, b = Math.floor(Math.random()*5)+1;
    sequence = [a,b]; for (let i=2;i<seqLen;i++) sequence.push(sequence[i-1]+sequence[i-2]); answer = sequence[seqLen-1]+sequence[seqLen-2];
  }
  const options = [answer];
  const offsets = [-3,-2,-1,1,2,3,5,-5];
  while (options.length < 4) { const v = answer + offsets[Math.floor(Math.random()*offsets.length)]; if (v>0 && !options.includes(v)) options.push(v); }
  for (let i=options.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[options[i],options[j]]=[options[j],options[i]];}
  return { sequence, answer, options };
}

async function getDifficulty() {
  const age = (await getItem(KEYS.AGE_GROUP)) || 'middle';
  const stats = (await getItem(KEYS.GAME_LOGIC)) || {};
  const winRate = (stats.wins||0) / Math.max(stats.gamesPlayed||1,1);
  if (age === 'young') return 'easy';
  if (age === 'older') return winRate > 0.6 ? 'hard' : 'medium';
  return winRate > 0.7 ? 'hard' : winRate > 0.4 ? 'medium' : 'easy';
}

export default function LogicSequence({ navigation }) {
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
    const t = setInterval(() => setTimer(s => s+1), 1000);
    return () => clearInterval(t);
  }, [ready, gameOver]);

  const config = ready ? LEVEL_CONFIG[difficulty] : LEVEL_CONFIG.medium;

  const handleSelect = (option) => {
    if (selected !== null) return;
    setSelected(option);
    const isCorrect = option === puzzle.answer;
    if (isCorrect) { setScore(s => s+15); setCorrect(c => c+1); }
    setTimeout(() => {
      if (round+1 >= config.rounds) { setGameOver(true); saveResult(isCorrect); return; }
      setRound(r => r+1);
      setPuzzle(generatePuzzle(difficulty));
      setSelected(null);
    }, 800);
  };

  const saveResult = async (lastCorrect) => {
    const finalCorrect = correct + (lastCorrect ? 1 : 0);
    const stats = (await getItem(KEYS.GAME_LOGIC)) || {};
    await setItem(KEYS.GAME_LOGIC, {
      gamesPlayed: (stats.gamesPlayed||0)+1,
      wins: (stats.wins||0) + (finalCorrect >= config.rounds*0.6 ? 1 : 0),
      bestScore: Math.max(stats.bestScore||0, score+(lastCorrect?15:0)),
      totalScore: (stats.totalScore||0)+score+(lastCorrect?15:0),
      lastPlayed: new Date().toISOString(),
    });
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
        icon="⚙️"
        title="Logic Pro!"
        stars={stars}
        stats={[{ label: 'Score', value: score }, { label: 'Correct', value: `${correct}/${config.rounds}` }, { label: 'Time', value: `${timer}s` }]}
        onPlayAgain={restart}
        onBack={() => navigation.goBack()}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <GameHeader
        left={<Text style={styles.timerText}>⏱️ {timer}s</Text>}
        center={`Round ${round+1}/${config.rounds}`}
        right={<Text style={styles.scoreText}>🎯 {score}</Text>}
        showBack={false}
      />
      <View style={styles.container}>
        <Text style={styles.prompt}>What number comes next?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sequenceRow}>
          {puzzle.sequence.map((n, i) => (
            <React.Fragment key={i}>
              <View style={styles.numBox}><Text style={styles.numText}>{n}</Text></View>
              {i < puzzle.sequence.length - 1 && <Text style={styles.arrow}>→</Text>}
            </React.Fragment>
          ))}
          <Text style={styles.arrow}>→</Text>
          <View style={[styles.numBox, styles.numBoxDashed]}><Text style={[styles.numText, { color: colors.primary }]}>?</Text></View>
        </ScrollView>
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
          <View style={[styles.progressFill, { width: `${(round/config.rounds)*100}%` }]} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  prompt: { fontSize: 18, fontWeight: '800', color: colors.textMuted, marginBottom: spacing.lg, textAlign: 'center' },
  sequenceRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, marginBottom: spacing.xl },
  numBox: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', ...shadow.sm },
  numBoxDashed: { borderStyle: 'dashed', borderColor: colors.primary },
  numText: { fontSize: 20, fontWeight: '900', color: colors.text },
  arrow: { fontSize: 18, color: colors.textMuted, marginHorizontal: 6 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center', marginBottom: spacing.xl },
  option: { width: 76, height: 76, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', ...shadow.sm },
  optionCorrect: { borderColor: colors.green, backgroundColor: '#F0FDF4' },
  optionWrong: { borderColor: colors.red, backgroundColor: '#FEF2F2' },
  optionText: { fontSize: 22, fontWeight: '900', color: colors.text },
  timerText: { fontSize: 14, fontWeight: '700', color: colors.text },
  scoreText: { fontSize: 14, fontWeight: '800', color: colors.primary },
  progressBg: { width: '100%', height: 8, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.green, borderRadius: radius.full },
});
