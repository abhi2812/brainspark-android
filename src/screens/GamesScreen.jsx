import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet,  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getProfile } from '../api/timmble';
import { GAMES } from '../constants';
import { colors, spacing, radius, shadow } from '../theme';

export default function GamesScreen({ navigation }) {
  const [gameStats, setGameStats] = useState({});
  const [hasProfile, setHasProfile] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalGames, setTotalGames] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const data = await getProfile();
    if (!data) return;

    const cp = data.cognitiveProfile || {};
    setHasProfile(Object.values(cp).some(v => v > 0));
    setStreak(data.streak?.current || 0);
    setTotalGames(data.totalGames || 0);

    const stats = {};
    const gs = data.gameStats || {};
    for (const g of GAMES) {
      const s = gs[g.id] || {};
      stats[g.id] = { gamesPlayed: s.gamesPlayed || 0, bestScore: s.bestScore || 0 };
    }
    setGameStats(stats);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Brain Games</Text>
            <Text style={styles.subtitle}>Pick a game and start training!</Text>
          </View>
          <View style={styles.badges}>
            {streak > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥 {streak} day streak!</Text>
              </View>
            )}
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{totalGames} played</Text>
            </View>
          </View>
        </View>

        {/* Assessment prompt */}
        {!hasProfile && (
          <View style={styles.assessPrompt}>
            <Text style={styles.assessIcon}>🎯</Text>
            <Text style={styles.assessTitle}>Try the Warm-Up first!</Text>
            <Text style={styles.assessDesc}>A quick warm-up personalizes the difficulty for your child</Text>
            <TouchableOpacity style={styles.assessBtn} onPress={() => navigation.navigate('Assessment')}>
              <Text style={styles.assessBtnText}>Start Warm-Up</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Game Cards */}
        <View style={styles.gamesGrid}>
          {GAMES.map(game => {
            const stats = gameStats[game.id] || {};
            const played = stats.gamesPlayed || 0;
            return (
              <TouchableOpacity
                key={game.id}
                style={styles.gameCard}
                onPress={() => navigation.navigate('Game', { gameId: game.id })}
                activeOpacity={0.85}
              >
                <View style={[styles.gameIcon, { backgroundColor: game.color + '18' }]}>
                  <Text style={styles.gameEmoji}>{game.icon}</Text>
                </View>
                <Text style={styles.gameName}>{game.name}</Text>
                <Text style={[styles.gameDomain, { color: game.color }]}>{game.domain.toUpperCase()}</Text>
                <Text style={styles.gameDesc}>{game.desc}</Text>
                {played > 0 ? (
                  <Text style={styles.gameStats}>Played {played}x · Best: {stats.bestScore || 0}</Text>
                ) : (
                  <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Daily Challenge */}
        <View style={styles.dailyCard}>
          <Text style={styles.dailyIcon}>🌟</Text>
          <Text style={styles.dailyTitle}>Daily Challenge</Text>
          <Text style={styles.dailyDesc}>Play at least one game every day to build your streak!</Text>
          {streak > 0 ? (
            <Text style={styles.doneText}>✓ You've played today! Come back tomorrow.</Text>
          ) : (
            <TouchableOpacity
              style={styles.randomBtn}
              onPress={() => {
                const g = GAMES[Math.floor(Math.random() * GAMES.length)];
                navigation.navigate('Game', { gameId: g.id });
              }}
            >
              <Text style={styles.randomBtnText}>Play a Random Game</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.md, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  title: { fontSize: 26, fontWeight: '900', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  badges: { gap: spacing.sm, alignItems: 'flex-end' },
  streakBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full },
  streakText: { fontSize: 13, fontWeight: '800', color: '#92400E' },
  countBadge: { backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  countText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  assessPrompt: {
    backgroundColor: '#EEF2FF', borderRadius: radius.xl, padding: spacing.lg,
    alignItems: 'center', marginBottom: spacing.lg, borderWidth: 1, borderColor: '#C7D2FE',
  },
  assessIcon: { fontSize: 32, marginBottom: 8 },
  assessTitle: { fontSize: 16, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 6 },
  assessDesc: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.md },
  assessBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: 12, borderRadius: radius.full },
  assessBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  gamesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  gameCard: {
    width: '47%', backgroundColor: colors.card, borderRadius: radius.xl,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadow.sm,
  },
  gameIcon: { width: 60, height: 60, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  gameEmoji: { fontSize: 28 },
  gameName: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 2 },
  gameDomain: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
  gameDesc: { fontSize: 12, color: colors.textMuted, lineHeight: 18, marginBottom: 8 },
  gameStats: { fontSize: 11, color: colors.textLight, fontWeight: '600' },
  newBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, alignSelf: 'flex-start' },
  newBadgeText: { fontSize: 10, fontWeight: '800', color: colors.primary },
  dailyCard: {
    backgroundColor: '#F0FDF4', borderRadius: radius.xl, padding: spacing.lg,
    alignItems: 'center', borderWidth: 1, borderColor: '#A7F3D0',
  },
  dailyIcon: { fontSize: 32, marginBottom: 8 },
  dailyTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 6 },
  dailyDesc: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.md },
  doneText: { fontSize: 14, fontWeight: '700', color: colors.green },
  randomBtn: { backgroundColor: colors.green, paddingHorizontal: spacing.xl, paddingVertical: 12, borderRadius: radius.full },
  randomBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
