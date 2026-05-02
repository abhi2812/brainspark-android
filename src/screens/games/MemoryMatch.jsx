import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Animated } from 'react-native';
import { getItem, setItem, KEYS } from '../../storage';
import { saveSession } from '../../api/brainspark';
import GameHeader from '../../components/GameHeader';
import ResultScreen from '../../components/ResultScreen';
import { colors, spacing, radius, shadow } from '../../theme';

const EMOJI_SETS = {
  easy: ['🍎','🍊','🍇','🍓','🍑','🍋'],
  medium: ['🐶','🐱','🐭','🐰','🦊','🐻','🐼','🐨'],
  hard: ['🚀','🌟','🌙','☄️','🛸','🪐','🌍','☀️','🌈','⚡'],
};
const GRID_CONFIG = {
  easy: { pairs: 6, cols: 4 },
  medium: { pairs: 8, cols: 4 },
  hard: { pairs: 10, cols: 4 },
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

async function getDifficulty() {
  const age = (await getItem(KEYS.AGE_GROUP)) || 'middle';
  const stats = (await getItem(KEYS.GAME_MEMORY)) || {};
  const level = stats.level || 1;
  if (age === 'young') return level <= 2 ? 'easy' : 'medium';
  if (age === 'older') return level <= 1 ? 'medium' : 'hard';
  return level <= 1 ? 'easy' : level <= 2 ? 'medium' : 'hard';
}

function generateCards(difficulty) {
  const { pairs } = GRID_CONFIG[difficulty];
  const emojis = shuffle(EMOJI_SETS[difficulty]).slice(0, pairs);
  return shuffle([...emojis, ...emojis].map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false })));
}

function FlipCard({ card, onPress, cellSize }) {
  const anim = useRef(new Animated.Value(card.flipped || card.matched ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: card.flipped || card.matched ? 1 : 0, duration: 250, useNativeDriver: true }).start();
  }, [card.flipped, card.matched]);

  const frontRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={{ width: cellSize, height: cellSize }}>
      <Animated.View style={[styles.cardFace, { width: cellSize, height: cellSize, transform: [{ rotateY: frontRotate }], zIndex: card.flipped || card.matched ? 0 : 1 }]}>
        <Text style={styles.cardBack}>🧠</Text>
      </Animated.View>
      <Animated.View style={[styles.cardFace, styles.cardFront, { width: cellSize, height: cellSize, transform: [{ rotateY: backRotate }], backgroundColor: card.matched ? '#F0FDF4' : colors.card, borderColor: card.matched ? colors.green : colors.border }]}>
        <Text style={[styles.cardEmoji, { fontSize: cellSize * 0.4 }]}>{card.emoji}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function MemoryMatch({ navigation }) {
  const [ready, setReady] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    (async () => {
      const diff = await getDifficulty();
      setDifficulty(diff);
      setCards(generateCards(diff));
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready || gameOver) return;
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [ready, gameOver]);

  const totalPairs = ready ? GRID_CONFIG[difficulty].pairs : 0;

  useEffect(() => {
    if (ready && matches > 0 && matches === totalPairs) {
      setGameOver(true);
      saveResult();
    }
  }, [matches, totalPairs, ready]);

  const getScore = () => {
    const timeBonus = Math.max(0, 100 - timer);
    const moveBonus = Math.max(0, 100 - (moves - totalPairs) * 5);
    return Math.round((timeBonus + moveBonus) / 2);
  };

  const saveResult = async () => {
    const score = getScore();
    const stats = (await getItem(KEYS.GAME_MEMORY)) || {};
    await setItem(KEYS.GAME_MEMORY, {
      gamesPlayed: (stats.gamesPlayed || 0) + 1,
      wins: (stats.wins || 0) + 1,
      bestScore: Math.max(stats.bestScore || 0, score),
      bestTime: Math.min(stats.bestTime ?? Infinity, timer),
      bestMoves: Math.min(stats.bestMoves ?? Infinity, moves),
      totalScore: (stats.totalScore || 0) + score,
      level: Math.min((stats.level || 1) + (score > 70 ? 1 : 0), 3),
      lastPlayed: new Date().toISOString(),
    });
    saveSession({ gameId: 'memory', difficulty, score, correctAnswers: matches, totalRounds: totalPairs, durationSeconds: timer, win: true });
  };

  const handleCardPress = useCallback((idx) => {
    if (locked || cards[idx].flipped || cards[idx].matched || flipped.length >= 2) return;
    const newCards = cards.map((c, i) => i === idx ? { ...c, flipped: true } : c);
    const newFlipped = [...flipped, idx];
    setCards(newCards);
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setLocked(true);
      const [a, b] = newFlipped;
      if (newCards[a].emoji === newCards[b].emoji) {
        setTimeout(() => {
          setCards(prev => prev.map((c, i) => i === a || i === b ? { ...c, matched: true } : c));
          setMatches(m => m + 1);
          setFlipped([]);
          setLocked(false);
        }, 400);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map((c, i) => i === a || i === b ? { ...c, flipped: false } : c));
          setFlipped([]);
          setLocked(false);
        }, 800);
      }
    }
  }, [cards, flipped, locked]);

  const restart = async () => {
    const diff = await getDifficulty();
    setDifficulty(diff);
    setCards(generateCards(diff));
    setFlipped([]); setMoves(0); setMatches(0); setTimer(0); setGameOver(false); setLocked(false);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (!ready) return null;

  if (gameOver) {
    const score = getScore();
    const stars = score >= 80 ? 3 : score >= 50 ? 2 : 1;
    return (
      <ResultScreen
        icon="🎉"
        title="Great Memory!"
        stars={stars}
        stats={[{ label: 'Score', value: score }, { label: 'Moves', value: moves }, { label: 'Time', value: formatTime(timer) }]}
        onPlayAgain={restart}
        onBack={() => navigation.goBack()}
      />
    );
  }

  const cols = GRID_CONFIG[difficulty].cols;
  const cellSize = Math.min(72, (320 - cols * 8) / cols);

  return (
    <SafeAreaView style={styles.safe}>
      <GameHeader
        left={<Text style={styles.statText}>⏱️ {formatTime(timer)}</Text>}
        center={`🧩 ${matches}/${totalPairs}`}
        right={<Text style={styles.statText}>Moves: {moves}</Text>}
        showBack={false}
      />
      <View style={styles.container}>
        <View style={[styles.grid, { maxWidth: cols * (cellSize + 8) }]}>
          {cards.map((card, i) => (
            <View key={card.id} style={{ margin: 4 }}>
              <FlipCard card={card} onPress={() => handleCardPress(i)} cellSize={cellSize} />
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.restartBtn} onPress={restart}>
          <Text style={styles.restartBtnText}>Restart</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' },
  cardFace: {
    position: 'absolute', backfaceVisibility: 'hidden',
    borderRadius: radius.lg, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary,
    ...shadow.sm,
  },
  cardFront: { backgroundColor: colors.card },
  cardBack: { fontSize: 28 },
  cardEmoji: {},
  statText: { fontSize: 13, fontWeight: '700', color: colors.text },
  restartBtn: { marginTop: spacing.lg, backgroundColor: colors.bg, borderRadius: radius.full, paddingVertical: 10, paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: colors.border },
  restartBtnText: { fontWeight: '700', color: colors.text },
});
