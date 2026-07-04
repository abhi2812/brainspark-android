import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated,  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getString, KEYS } from '../storage';
import { saveAssessment, invalidateProfileCache } from '../api/timmble';
import { DOMAINS } from '../constants';
import { colors, spacing, radius, shadow } from '../theme';

// ---- Challenge generators (ported from web, pure JS - unchanged) ----
function generateMemoryChallenge(difficulty) {
  const pools = {
    easy: ['🍎','🍊','🍇','🍓'],
    medium: ['🍎','🍊','🍇','🍓','🍒','🍑','🍋','🥝'],
    hard: ['🍎','🍊','🍇','🍓','🍒','🍑','🍋','🥝','🍌','🍉'],
  };
  const count = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4;
  const pool = [...pools[difficulty]].sort(() => Math.random() - 0.5);
  const sequence = pool.slice(0, count);
  const optionCount = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8;
  const options = [...new Set([...sequence, ...pool])].slice(0, optionCount).sort(() => Math.random() - 0.5);
  const showTime = difficulty === 'easy' ? 4000 : difficulty === 'medium' ? 3000 : 2500;
  return { type: 'memory', sequence, options, showTime };
}

function generateAttentionChallenge(difficulty) {
  const pairs = {
    easy: [['🐶','🐱'],['🐣','🐥'],['🦁','🐯']],
    medium: [['🟦','🟪'],['🟥','🟧'],['🟩','🟨']],
    hard: [['🔵','🟣'],['🟠','🔴'],['⚪','⚫']],
  };
  const gridSize = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 9 : 16;
  const cols = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4;
  const pair = pairs[difficulty][Math.floor(Math.random() * pairs[difficulty].length)];
  const oddIndex = Math.floor(Math.random() * gridSize);
  const grid = Array(gridSize).fill(pair[0]);
  grid[oddIndex] = pair[1];
  return { type: 'attention', grid, oddIndex, cols };
}

function generatePatternChallenge(difficulty) {
  const pools = {
    easy: ['🔴','🔵','🟢','🟡','🟠','🟣'],
    medium: ['▲','●','■','⭐','♥'],
    hard: ['♠','♣','♥','♦','▲','●','■','⭐'],
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
  options.sort(() => Math.random() - 0.5);
  return { type: 'pattern', sequence, answer, options };
}

function generateSpatialChallenge(difficulty) {
  const items = ['🏠','🌳','🚗','🌈','⭐','🌞','🌻','🦋'];
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  const target = shuffled[0];
  const options = [target, shuffled[1], shuffled[2]].sort(() => Math.random() - 0.5);
  if (difficulty === 'easy') return { type: 'spatial', mode: 'match', target, options, answer: target };
  const size = difficulty === 'medium' ? 3 : 4;
  const filledCount = difficulty === 'medium' ? 3 : 5;
  const filled = new Set();
  while (filled.size < filledCount) filled.add(Math.floor(Math.random() * size * size));
  const original = Array.from(filled);
  const rotated = original.map(i => { const r = Math.floor(i / size), c = i % size; return c * size + (size - 1 - r); });
  const wrong = new Set();
  while (wrong.size < filledCount) wrong.add(Math.floor(Math.random() * size * size));
  const correctIdx = Math.random() < 0.5 ? 0 : 1;
  const opts = correctIdx === 0 ? [rotated, Array.from(wrong)] : [Array.from(wrong), rotated];
  return { type: 'spatial', mode: 'rotate', original, size, options: opts, correctIdx };
}

function generateLogicChallenge(difficulty) {
  const emojiItems = ['⭐','🌟','🐟','🌻','🍎'];
  const emoji = emojiItems[Math.floor(Math.random() * emojiItems.length)];
  if (difficulty === 'easy') {
    const count = Math.floor(Math.random() * 4) + 2;
    const options = [count];
    while (options.length < 3) { const v = count + (Math.floor(Math.random() * 5) - 2); if (v > 0 && !options.includes(v)) options.push(v); }
    options.sort(() => Math.random() - 0.5);
    return { type: 'logic', mode: 'count', emoji, count, answer: count, options };
  }
  const start = Math.floor(Math.random() * 10) + 1;
  const step = difficulty === 'medium' ? [1, 2, 3][Math.floor(Math.random() * 3)] : [2, 3, 5, 4][Math.floor(Math.random() * 4)];
  const len = difficulty === 'medium' ? 4 : 5;
  const sequence = [];
  for (let i = 0; i < len; i++) sequence.push(start + step * i);
  const answer = start + step * len;
  const options = [answer];
  while (options.length < 4) { const v = answer + (Math.floor(Math.random() * 7) - 3); if (v !== answer && !options.includes(v) && v > 0) options.push(v); }
  options.sort(() => Math.random() - 0.5);
  return { type: 'logic', mode: 'sequence', sequence, answer, options };
}

const GENERATORS = {
  memory: generateMemoryChallenge,
  attention: generateAttentionChallenge,
  pattern: generatePatternChallenge,
  spatial: generateSpatialChallenge,
  logic: generateLogicChallenge,
};

// ---- Round renderers ----
function MemoryRound({ challenge, onAnswer }) {
  const [phase, setPhase] = useState('show');
  const [selected, setSelected] = useState([]);
  const timerWidth = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(timerWidth, { toValue: 0, duration: challenge.showTime, useNativeDriver: false }).start();
    const t = setTimeout(() => setPhase('recall'), challenge.showTime);
    return () => clearTimeout(t);
  }, []);

  const handleSelect = (emoji) => {
    if (phase !== 'recall') return;
    const next = [...selected, emoji];
    setSelected(next);
    if (next.length === challenge.sequence.length) {
      const correct = next.every((e, i) => e === challenge.sequence[i]);
      setTimeout(() => onAnswer(correct ? 1 : 0), 300);
    }
  };

  if (phase === 'show') {
    return (
      <View style={styles.roundContainer}>
        <Text style={styles.roundPrompt}>👀 Remember these!</Text>
        <View style={styles.sequenceRow}>
          {challenge.sequence.map((e, i) => (
            <View key={i} style={styles.seqItem}><Text style={styles.seqEmoji}>{e}</Text></View>
          ))}
        </View>
        <View style={styles.timerBg}>
          <Animated.View style={[styles.timerFill, { width: timerWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.roundContainer}>
      <Text style={styles.roundPrompt}>Tap them in order! ({selected.length}/{challenge.sequence.length})</Text>
      <View style={styles.sequenceRow}>
        {challenge.sequence.map((_, i) => (
          <View key={i} style={[styles.seqItem, styles.seqBlank]}>
            <Text style={styles.seqEmoji}>{selected[i] || '?'}</Text>
          </View>
        ))}
      </View>
      <View style={styles.optionsGrid}>
        {challenge.options.map((e, i) => (
          <TouchableOpacity key={i} style={styles.optionBtn} onPress={() => handleSelect(e)}>
            <Text style={styles.optionEmoji}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function AttentionRound({ challenge, onAnswer }) {
  const [clicked, setClicked] = useState(null);
  const handleClick = (idx) => {
    if (clicked !== null) return;
    setClicked(idx);
    setTimeout(() => onAnswer(idx === challenge.oddIndex ? 1 : 0), 400);
  };
  const numCols = challenge.cols;
  return (
    <View style={styles.roundContainer}>
      <Text style={styles.roundPrompt}>👁️ Find the different one!</Text>
      <View style={[styles.attentionGrid, { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', maxWidth: numCols * 70 }]}>
        {challenge.grid.map((emoji, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.attentionItem,
              clicked !== null && i === challenge.oddIndex && styles.attentionCorrect,
              clicked !== null && i === clicked && clicked !== challenge.oddIndex && styles.attentionWrong,
            ]}
            onPress={() => handleClick(i)}
          >
            <Text style={styles.attentionEmoji}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function PatternRound({ challenge, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const handleSelect = (option) => {
    if (selected !== null) return;
    setSelected(option);
    setTimeout(() => onAnswer(option === challenge.answer ? 1 : 0), 500);
  };
  return (
    <View style={styles.roundContainer}>
      <Text style={styles.roundPrompt}>🔍 What comes next?</Text>
      <View style={styles.sequenceRow}>
        {challenge.sequence.map((s, i) => (
          <View key={i} style={styles.seqItem}><Text style={styles.seqEmoji}>{s}</Text></View>
        ))}
        <View style={[styles.seqItem, styles.seqBlank]}><Text style={styles.seqEmoji}>?</Text></View>
      </View>
      <View style={styles.optionsGrid}>
        {challenge.options.map((o, i) => {
          const isCorrect = selected !== null && o === challenge.answer;
          const isWrong = selected !== null && o === selected && o !== challenge.answer;
          return (
            <TouchableOpacity
              key={i}
              style={[styles.optionBtn, isCorrect && styles.optionCorrect, isWrong && styles.optionWrong]}
              onPress={() => handleSelect(o)}
            >
              <Text style={styles.optionEmoji}>{o}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function SpatialRound({ challenge, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const handleSelect = (value, idx) => {
    if (selected !== null) return;
    setSelected(idx);
    const correct = challenge.mode === 'match' ? value === challenge.answer : idx === challenge.correctIdx;
    setTimeout(() => onAnswer(correct ? 1 : 0), 500);
  };

  if (challenge.mode === 'match') {
    return (
      <View style={styles.roundContainer}>
        <Text style={styles.roundPrompt}>🗺️ Which one is the same?</Text>
        <View style={styles.targetBox}><Text style={styles.targetEmoji}>{challenge.target}</Text></View>
        <View style={styles.optionsGrid}>
          {challenge.options.map((o, i) => {
            const isCorrect = selected !== null && o === challenge.answer;
            const isWrong = selected !== null && i === selected && o !== challenge.answer;
            return (
              <TouchableOpacity key={i} style={[styles.optionBtn, isCorrect && styles.optionCorrect, isWrong && styles.optionWrong]} onPress={() => handleSelect(o, i)}>
                <Text style={styles.optionEmoji}>{o}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  const renderGrid = (cells, size, isCorrect, isWrong) => (
    <View style={[styles.miniGrid, isCorrect && styles.gridCorrect, isWrong && styles.gridWrong, { flexDirection: 'row', flexWrap: 'wrap', width: size * 34 }]}>
      {Array(size * size).fill(0).map((_, i) => (
        <View key={i} style={[styles.miniCell, { backgroundColor: cells.includes(i) ? colors.primary : colors.border }]} />
      ))}
    </View>
  );

  return (
    <View style={styles.roundContainer}>
      <Text style={styles.roundPrompt}>🗺️ Find the rotated version</Text>
      <Text style={styles.subLabel}>ORIGINAL</Text>
      <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
        {renderGrid(challenge.original, challenge.size, false, false)}
      </View>
      <View style={styles.gridOptions}>
        {challenge.options.map((opt, i) => {
          const isCorrect = selected !== null && i === challenge.correctIdx;
          const isWrong = selected !== null && i === selected && i !== challenge.correctIdx;
          return (
            <TouchableOpacity key={i} onPress={() => handleSelect(null, i)} activeOpacity={0.8}>
              <Text style={styles.optionLabel}>Option {i + 1}</Text>
              {renderGrid(opt, challenge.size, isCorrect, isWrong)}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function LogicRound({ challenge, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const handleSelect = (option) => {
    if (selected !== null) return;
    setSelected(option);
    setTimeout(() => onAnswer(option === challenge.answer ? 1 : 0), 500);
  };

  if (challenge.mode === 'count') {
    return (
      <View style={styles.roundContainer}>
        <Text style={styles.roundPrompt}>⚙️ How many do you see?</Text>
        <Text style={styles.countEmojis}>{Array(challenge.count).fill(challenge.emoji).join(' ')}</Text>
        <View style={styles.optionsGrid}>
          {challenge.options.map((o, i) => {
            const isCorrect = selected !== null && o === challenge.answer;
            const isWrong = selected !== null && o === selected && o !== challenge.answer;
            return (
              <TouchableOpacity key={i} style={[styles.optionBtn, styles.numOption, isCorrect && styles.optionCorrect, isWrong && styles.optionWrong]} onPress={() => handleSelect(o)}>
                <Text style={styles.numText}>{o}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.roundContainer}>
      <Text style={styles.roundPrompt}>⚙️ What number comes next?</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sequenceRow}>
        {challenge.sequence.map((n, i) => (
          <React.Fragment key={i}>
            <View style={styles.numBox}><Text style={styles.numBoxText}>{n}</Text></View>
            {i < challenge.sequence.length - 1 && <Text style={styles.arrow}>→</Text>}
          </React.Fragment>
        ))}
        <Text style={styles.arrow}>→</Text>
        <View style={[styles.numBox, styles.numBoxDashed]}><Text style={[styles.numBoxText, { color: colors.primary }]}>?</Text></View>
      </ScrollView>
      <View style={styles.optionsGrid}>
        {challenge.options.map((o, i) => {
          const isCorrect = selected !== null && o === challenge.answer;
          const isWrong = selected !== null && o === selected && o !== challenge.answer;
          return (
            <TouchableOpacity key={i} style={[styles.optionBtn, styles.numOption, isCorrect && styles.optionCorrect, isWrong && styles.optionWrong]} onPress={() => handleSelect(o)}>
              <Text style={styles.numText}>{o}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const ROUND_RENDERERS = { memory: MemoryRound, attention: AttentionRound, pattern: PatternRound, spatial: SpatialRound, logic: LogicRound };

// ---- Main Assessment Screen ----
export default function AssessmentScreen({ navigation }) {
  const [ready, setReady] = useState(false);
  const [ageGroup, setAgeGroup] = useState('middle');
  const [difficulty, setDifficulty] = useState('medium');
  const [roundsPerDomain, setRoundsPerDomain] = useState(3);
  const [phase, setPhase] = useState('intro');
  const [currentDomain, setCurrentDomain] = useState(0);
  const [roundInDomain, setRoundInDomain] = useState(0);
  const [scores, setScores] = useState({ memory: 0, attention: 0, pattern: 0, spatial: 0, logic: 0 });
  const [challenge, setChallenge] = useState(null);
  const [roundKey, setRoundKey] = useState(0);
  const [profile, setProfile] = useState({});

  useEffect(() => {
    (async () => {
      const ag = (await getString(KEYS.AGE_GROUP)) || 'middle';
      setAgeGroup(ag);
      const diff = ag === 'young' ? 'easy' : ag === 'middle' ? 'medium' : 'hard';
      setDifficulty(diff);
      setRoundsPerDomain(ag === 'young' ? 2 : 3);
      setChallenge(GENERATORS[DOMAINS[0].key](diff));
      setReady(true);
    })();
  }, []);

  if (!ready) return null;

  const totalRounds = DOMAINS.length * roundsPerDomain;
  const completedRounds = currentDomain * roundsPerDomain + roundInDomain;

  const handleAnswer = async (score) => {
    const domain = DOMAINS[currentDomain];
    const newScores = { ...scores, [domain.key]: scores[domain.key] + score };
    setScores(newScores);

    const isLastRound = roundInDomain + 1 >= roundsPerDomain;
    const isLastDomain = currentDomain + 1 >= DOMAINS.length;

    if (isLastRound && isLastDomain) {
      const p = {};
      DOMAINS.forEach(d => { p[d.key] = Math.round((newScores[d.key] / roundsPerDomain) * 100); });
      saveAssessment({
        memoryScore: p.memory,
        attentionScore: p.attention,
        patternScore: p.pattern,
        spatialScore: p.spatial,
        logicScore: p.logic,
      }); // fire-and-forget; queued if offline
      invalidateProfileCache(); // bust cache now so Dashboard fetches fresh when user navigates there
      setProfile(p);
      setPhase('result');
    } else if (isLastRound) {
      const nextDomain = currentDomain + 1;
      setChallenge(GENERATORS[DOMAINS[nextDomain].key](difficulty));
      setCurrentDomain(nextDomain);
      setRoundInDomain(0);
      setRoundKey(k => k + 1);
    } else {
      setChallenge(GENERATORS[domain.key](difficulty));
      setRoundInDomain(r => r + 1);
      setRoundKey(k => k + 1);
    }
  };

  // ---- Intro ----
  if (phase === 'intro') {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.introContainer}>
          <Text style={styles.introIcon}>🎯</Text>
          <Text style={styles.introTitle}>Warm-Up Challenge</Text>
          <Text style={styles.introDesc}>
            {ageGroup === 'young'
              ? 'Fun little puzzles to get started! Only takes 3 minutes.'
              : `A few quick mini-games across 5 skill areas. Takes about ${ageGroup === 'middle' ? '4' : '5'} minutes.`}
          </Text>
          <View style={styles.domainList}>
            {DOMAINS.map(d => (
              <View key={d.key} style={styles.domainRow}>
                <Text style={styles.domainIcon}>{d.icon}</Text>
                <Text style={[styles.domainName2, { color: d.color }]}>{d.name}</Text>
                <Text style={styles.domainRounds}>{roundsPerDomain} rounds</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => { setChallenge(GENERATORS[DOMAINS[0].key](difficulty)); setRoundKey(k => k + 1); setPhase('playing'); }}
          >
            <Text style={styles.startBtnText}>{ageGroup === 'young' ? "Let's Play!" : 'Start Warm-Up'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---- Result ----
  if (phase === 'result') {
    const values = Object.values(profile);
    const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.introContainer}>
          <Text style={styles.introIcon}>🎉</Text>
          <Text style={styles.introTitle}>{ageGroup === 'young' ? 'Great Job!' : 'Warm-Up Complete!'}</Text>
          <View style={styles.resultGrid}>
            {DOMAINS.map(d => (
              <View key={d.key} style={styles.resultCard}>
                <Text style={styles.resultCardIcon}>{d.icon}</Text>
                <Text style={[styles.resultCardValue, { color: d.color }]}>{profile[d.key] || 0}%</Text>
                <Text style={styles.resultCardLabel}>{d.name}</Text>
              </View>
            ))}
          </View>
          <View style={styles.avgCard}>
            <Text style={styles.avgValue}>{avg}%</Text>
            <Text style={styles.avgLabel}>Overall Score</Text>
          </View>
          <TouchableOpacity style={styles.startBtn} onPress={() => navigation.navigate('Main', { screen: 'Games' })}>
            <Text style={styles.startBtnText}>Start Playing Games</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn2} onPress={() => navigation.navigate('Main', { screen: 'Dashboard' })}>
            <Text style={styles.secondaryBtn2Text}>View Dashboard</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---- Playing ----
  const domain = DOMAINS[currentDomain];
  const Renderer = ROUND_RENDERERS[domain.key];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Domain steps */}
      <View style={styles.stepsBar}>
        {DOMAINS.map((d, i) => (
          <React.Fragment key={d.key}>
            <View style={[styles.stepDot, i === currentDomain && styles.stepDotActive, i < currentDomain && styles.stepDotDone]}>
              <Text style={styles.stepDotText}>{i < currentDomain ? '✓' : d.icon}</Text>
            </View>
            {i < DOMAINS.length - 1 && (
              <View style={[styles.stepLine, i < currentDomain && styles.stepLineDone]} />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Domain header */}
      <View style={styles.domainHeader}>
        <Text style={styles.domainHeaderIcon}>{domain.icon}</Text>
        <Text style={[styles.domainHeaderName, { color: domain.color }]}>
          {domain.name} · Round {roundInDomain + 1}/{roundsPerDomain}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.playingContainer}>
        <View style={styles.challengeCard}>
          <Renderer key={roundKey} challenge={challenge} onAnswer={handleAnswer} />
        </View>
        {/* Overall progress */}
        <View style={styles.timerBg}>
          <View style={[styles.timerFill, { width: `${(completedRounds / totalRounds) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{completedRounds}/{totalRounds} rounds</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  introContainer: { flexGrow: 1, padding: spacing.xl, alignItems: 'center' },
  introIcon: { fontSize: 64, marginBottom: spacing.md },
  introTitle: { fontSize: 28, fontWeight: '900', color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
  introDesc: { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: spacing.lg },
  domainList: { width: '100%', marginBottom: spacing.xl, gap: spacing.sm },
  domainRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  domainIcon: { fontSize: 22 },
  domainName2: { flex: 1, fontWeight: '700', fontSize: 15 },
  domainRounds: { fontSize: 13, color: colors.textLight },
  startBtn: { backgroundColor: colors.primary, borderRadius: radius.full, paddingVertical: 16, paddingHorizontal: spacing.xl, width: '100%', alignItems: 'center', marginBottom: spacing.sm },
  startBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  secondaryBtn2: { backgroundColor: colors.card, borderRadius: radius.full, paddingVertical: 16, paddingHorizontal: spacing.xl, width: '100%', alignItems: 'center', borderWidth: 2, borderColor: colors.border },
  secondaryBtn2Text: { color: colors.text, fontWeight: '700', fontSize: 16 },
  resultGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg, justifyContent: 'center' },
  resultCard: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.md, alignItems: 'center', minWidth: 90, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  resultCardIcon: { fontSize: 24, marginBottom: 4 },
  resultCardValue: { fontSize: 22, fontWeight: '900' },
  resultCardLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', marginTop: 2 },
  avgCard: { backgroundColor: colors.primaryLight, borderRadius: radius.xl, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.xl, borderWidth: 1, borderColor: '#C7D2FE' },
  avgValue: { fontSize: 36, fontWeight: '900', color: colors.primary },
  avgLabel: { fontSize: 14, color: colors.primary, fontWeight: '700' },
  stepsBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  stepDot: { width: 36, height: 36, borderRadius: radius.full, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: colors.primary },
  stepDotDone: { backgroundColor: colors.green },
  stepDotText: { fontSize: 16 },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.border, marginHorizontal: 4 },
  stepLineDone: { backgroundColor: colors.green },
  domainHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  domainHeaderIcon: { fontSize: 24 },
  domainHeaderName: { fontSize: 16, fontWeight: '800' },
  playingContainer: { flexGrow: 1, padding: spacing.md },
  challengeCard: { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  timerBg: { height: 8, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden', marginBottom: 6 },
  timerFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.full },
  progressText: { fontSize: 12, color: colors.textLight, textAlign: 'center' },
  roundContainer: { gap: spacing.md, alignItems: 'center' },
  roundPrompt: { fontSize: 16, fontWeight: '800', color: colors.text, textAlign: 'center' },
  sequenceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
  seqItem: { width: 64, height: 64, borderRadius: radius.lg, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#C7D2FE' },
  seqBlank: { backgroundColor: colors.border, borderStyle: 'dashed' },
  seqEmoji: { fontSize: 28 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  optionBtn: { width: 64, height: 64, borderRadius: radius.lg, backgroundColor: colors.bg, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  optionEmoji: { fontSize: 28 },
  optionCorrect: { borderColor: colors.green, backgroundColor: '#F0FDF4' },
  optionWrong: { borderColor: colors.red, backgroundColor: '#FEF2F2' },
  attentionGrid: { gap: 4 },
  attentionItem: { width: 64, height: 64, margin: 3, borderRadius: radius.lg, backgroundColor: colors.bg, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  attentionCorrect: { borderColor: colors.green, backgroundColor: '#F0FDF4' },
  attentionWrong: { borderColor: colors.red, backgroundColor: '#FEF2F2' },
  attentionEmoji: { fontSize: 28 },
  targetBox: { backgroundColor: '#EEF2FF', borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md },
  targetEmoji: { fontSize: 48 },
  miniGrid: { padding: 4, backgroundColor: colors.border, borderRadius: radius.md, gap: 2 },
  gridCorrect: { borderWidth: 3, borderColor: colors.green },
  gridWrong: { borderWidth: 3, borderColor: colors.red },
  miniCell: { width: 28, height: 28, borderRadius: 4, margin: 2 },
  gridOptions: { flexDirection: 'row', gap: spacing.lg, flexWrap: 'wrap', justifyContent: 'center' },
  optionLabel: { fontSize: 12, color: colors.textLight, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  subLabel: { fontSize: 11, color: colors.textLight, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  countEmojis: { fontSize: 28, letterSpacing: 8, textAlign: 'center', padding: spacing.md },
  numOption: { width: 72, height: 72 },
  numText: { fontSize: 22, fontWeight: '900', color: colors.text },
  numBox: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.bg, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  numBoxDashed: { borderStyle: 'dashed', borderColor: colors.primary },
  numBoxText: { fontSize: 18, fontWeight: '900', color: colors.text },
  arrow: { fontSize: 18, color: colors.textMuted, alignSelf: 'center', marginHorizontal: 4 },
});
