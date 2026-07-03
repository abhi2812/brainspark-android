import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { clearAll, getString, KEYS } from '../storage';
import { getProfile, invalidateProfileCache, flushSyncQueue } from '../api/brainspark';
import { DOMAINS } from '../constants';
import RadarChart from '../components/RadarChart';
import { colors, spacing, radius, shadow } from '../theme';

export default function DashboardScreen({ navigation }) {
  const [profile, setProfile] = useState({});
  const [streak, setStreak] = useState({});
  const [gameStats, setGameStats] = useState([]);
  const [radarScores, setRadarScores] = useState({});
  const [ageLabel, setAgeLabel] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const ageGroup = (await getString(KEYS.AGE_GROUP)) || 'middle';
    setAgeLabel(ageGroup === 'young' ? '3-5 yrs' : ageGroup === 'middle' ? '6-8 yrs' : '9-12 yrs');

    // Flush any queued sessions first, then always fetch fresh — Dashboard must never show stale data
    await flushSyncQueue();
    await invalidateProfileCache();
    const data = await getProfile();
    if (!data) return;

    const cp = data.cognitiveProfile || {};
    const p = {
      memory: cp.memory || 0,
      attention: cp.attention || 0,
      pattern: cp.pattern || 0,
      spatial: cp.spatial || 0,
      logic: cp.logic || 0,
    };
    setProfile(p);

    setStreak({ count: data.streak?.current || 0, best: data.streak?.best || 0 });

    const apiGs = data.gameStats || {};
    const stats = DOMAINS.map(d => {
      const s = apiGs[d.key] || {};
      return {
        ...d,
        stats: {
          gamesPlayed: s.gamesPlayed || 0,
          wins: s.wins || 0,
          bestScore: s.bestScore || 0,
          totalScore: s.totalScore || 0,
          lastPlayed: s.lastPlayed || null,
        },
      };
    });
    setGameStats(stats);

    const scores = {};
    stats.forEach(d => {
      const assessScore = p[d.key] || 0;
      const gs = d.stats;
      const winRate = gs.gamesPlayed ? Math.round(((gs.wins || 0) / gs.gamesPlayed) * 100) : 0;
      scores[d.key] = gs.gamesPlayed ? Math.round(assessScore * 0.4 + winRate * 0.6) : assessScore;
    });
    setRadarScores(scores);
  };

  const handleReset = () => {
    Alert.alert(
      'Reset All Data',
      'This will erase all game history and progress. Cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset', style: 'destructive',
          onPress: async () => {
            await clearAll();
            await invalidateProfileCache();
            loadData();
          },
        },
      ]
    );
  };

  const hasProfile = Object.values(profile).some(v => v > 0);
  const totalGames = gameStats.reduce((s, g) => s + (g.stats.gamesPlayed || 0), 0);
  const totalScore = gameStats.reduce((s, g) => s + (g.stats.totalScore || 0), 0);
  const avgScore = hasProfile
    ? Math.round(Object.values(profile).reduce((a, b) => a + b, 0) / 5)
    : 0;

  const recentActivity = gameStats
    .filter(g => g.stats.lastPlayed)
    .map(g => ({ ...g, date: new Date(g.stats.lastPlayed) }))
    .sort((a, b) => b.date - a.date);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>📊 Parent Dashboard</Text>
            <Text style={styles.subtitle}>See your child's play & progress</Text>
          </View>
          <View style={styles.headerBadges}>
            {ageLabel ? <View style={styles.ageBadge}><Text style={styles.ageBadgeText}>Age: {ageLabel}</Text></View> : null}
            {streak.count > 0 && <View style={styles.streakBadge}><Text style={styles.streakText}>🔥 {streak.count} day streak</Text></View>}
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { value: `${avgScore}%`, label: 'Avg Accuracy', color: colors.primary },
            { value: totalGames, label: 'Games Played', color: colors.secondary },
            { value: totalScore, label: 'Total Points', color: colors.amber },
            { value: streak.best || 0, label: 'Best Streak', color: colors.green },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* No profile prompt */}
        {!hasProfile && (
          <View style={styles.noProfile}>
            <Text style={styles.noProfileIcon}>🎯</Text>
            <Text style={styles.noProfileTitle}>No warm-up yet</Text>
            <Text style={styles.noProfileDesc}>Play the warm-up to personalize your child's games</Text>
            <TouchableOpacity style={styles.assessBtn} onPress={() => navigation.navigate('Assessment')}>
              <Text style={styles.assessBtnText}>Start Warm-Up</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Radar Chart */}
        {(hasProfile || totalGames > 0) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Skills Explored</Text>
            <View style={styles.radarWrapper}>
              <RadarChart scores={radarScores} />
            </View>
            {hasProfile && (
              <View style={styles.scoreBreakdown}>
                {DOMAINS.map(d => (
                  <View key={d.key} style={styles.scoreRow}>
                    <Text style={styles.scoreIcon}>{d.icon}</Text>
                    <Text style={styles.scoreName}>{d.name}</Text>
                    <View style={styles.progressBg}>
                      <View style={[styles.progressFill, { width: `${radarScores[d.key] || 0}%`, backgroundColor: d.color }]} />
                    </View>
                    <Text style={[styles.scorePct, { color: d.color }]}>{radarScores[d.key] || 0}%</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Recent Activity */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          {recentActivity.length === 0 ? (
            <View style={styles.emptyActivity}>
              <Text style={styles.emptyIcon}>🎮</Text>
              <Text style={styles.emptyText}>No games played yet. Start playing!</Text>
            </View>
          ) : (
            recentActivity.map((a, i) => (
              <View key={i} style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: a.color + '18' }]}>
                  <Text style={styles.activityEmoji}>{a.icon}</Text>
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityName}>{a.name}</Text>
                  <Text style={styles.activityDate}>
                    {a.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · Best: {a.stats.bestScore || 0}
                  </Text>
                </View>
                <Text style={styles.activityPlayed}>{a.stats.gamesPlayed || 0}x</Text>
              </View>
            ))
          )}
          <TouchableOpacity style={styles.playBtn} onPress={() => navigation.navigate('Games')}>
            <Text style={styles.playBtnText}>Play Now</Text>
          </TouchableOpacity>
        </View>

        {/* Game Details */}
        <Text style={styles.sectionTitle}>Game Details</Text>
        <View style={styles.gamesGrid}>
          {gameStats.map(g => {
            const played = g.stats.gamesPlayed || 0;
            const winRate = played ? Math.round(((g.stats.wins || 0) / played) * 100) : 0;
            return (
              <View key={g.key} style={styles.gameCard}>
                <View style={styles.gameCardHeader}>
                  <Text style={styles.gameCardIcon}>{g.icon}</Text>
                  <View>
                    <Text style={styles.gameCardName}>{g.name}</Text>
                    <Text style={[styles.gameCardDomain, { color: g.color }]}>{g.key.toUpperCase()}</Text>
                  </View>
                </View>
                {played > 0 ? (
                  <View style={styles.gameCardStats}>
                    {[
                      { label: 'Games', value: played },
                      { label: 'Win Rate', value: `${winRate}%`, color: winRate >= 60 ? colors.green : winRate >= 40 ? colors.amber : colors.red },
                      { label: 'Best Score', value: g.stats.bestScore || 0 },
                    ].map((row, i) => (
                      <View key={i} style={styles.gameCardRow}>
                        <Text style={styles.gameCardLabel}>{row.label}</Text>
                        <Text style={[styles.gameCardValue, row.color && { color: row.color }]}>{row.value}</Text>
                      </View>
                    ))}
                    <View style={styles.progressBg}>
                      <View style={[styles.progressFill, { width: `${winRate}%`, backgroundColor: g.color }]} />
                    </View>
                  </View>
                ) : (
                  <Text style={styles.notPlayed}>Not played yet</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Reset */}
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetBtnText}>Reset All Data</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.md, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  title: { fontSize: 22, fontWeight: '900', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  headerBadges: { gap: 6, alignItems: 'flex-end' },
  ageBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  ageBadgeText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  streakBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  streakText: { fontSize: 12, fontWeight: '700', color: '#92400E' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: colors.card, borderRadius: radius.xl,
    padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border, ...shadow.sm,
  },
  statValue: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 4, fontWeight: '600', textAlign: 'center' },
  noProfile: {
    backgroundColor: '#FFFBEB', borderRadius: radius.xl, padding: spacing.lg,
    alignItems: 'center', borderWidth: 1, borderColor: '#FDE68A', marginBottom: spacing.lg,
  },
  noProfileIcon: { fontSize: 32, marginBottom: 8 },
  noProfileTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 6 },
  noProfileDesc: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.md },
  assessBtn: { backgroundColor: colors.amber, paddingHorizontal: spacing.xl, paddingVertical: 12, borderRadius: radius.full },
  assessBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  card: {
    backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg,
    marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadow.sm,
  },
  cardTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  radarWrapper: { alignItems: 'center', marginBottom: spacing.md },
  scoreBreakdown: { gap: 12 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  scoreName: { fontSize: 13, fontWeight: '700', width: 72, color: colors.text },
  progressBg: { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.primary },
  scorePct: { fontSize: 13, fontWeight: '800', width: 36, textAlign: 'right' },
  emptyActivity: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, color: colors.textLight },
  activityItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  activityIcon: { width: 44, height: 44, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  activityEmoji: { fontSize: 22 },
  activityInfo: { flex: 1 },
  activityName: { fontSize: 15, fontWeight: '700', color: colors.text },
  activityDate: { fontSize: 12, color: colors.textMuted },
  activityPlayed: { fontSize: 13, fontWeight: '800', color: colors.textMuted },
  playBtn: { backgroundColor: colors.primary, borderRadius: radius.full, paddingVertical: 14, alignItems: 'center', marginTop: spacing.sm },
  playBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  gamesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  gameCard: {
    width: '47%', backgroundColor: colors.card, borderRadius: radius.xl,
    padding: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadow.sm,
  },
  gameCardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  gameCardIcon: { fontSize: 22 },
  gameCardName: { fontSize: 13, fontWeight: '800', color: colors.text },
  gameCardDomain: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  gameCardStats: { gap: 6 },
  gameCardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  gameCardLabel: { fontSize: 12, color: colors.textMuted },
  gameCardValue: { fontSize: 12, fontWeight: '700', color: colors.text },
  notPlayed: { fontSize: 12, color: colors.textLight, textAlign: 'center', paddingVertical: spacing.md },
  resetBtn: {
    backgroundColor: '#FEE2E2', borderRadius: radius.full,
    paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#FECACA',
  },
  resetBtnText: { color: '#DC2626', fontWeight: '700', fontSize: 14 },
});
