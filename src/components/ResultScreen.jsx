import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, radius, shadow } from '../theme';

export default function ResultScreen({ icon, title, stars, stats, onPlayAgain, onNextGame, onBack, backLabel = 'All Games' }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.stars}>
        {[0, 1, 2].map(i => (
          <Text key={i} style={[styles.star, i >= stars && styles.starDim]}>⭐</Text>
        ))}
      </View>

      <View style={styles.statsRow}>
        {stats.map((s, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onPlayAgain}>
        <Text style={styles.primaryBtnText}>Play Again</Text>
      </TouchableOpacity>
      {onNextGame && (
        <TouchableOpacity style={styles.nextBtn} onPress={onNextGame}>
          <Text style={styles.nextBtnText}>🎲 Next Game</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.secondaryBtn} onPress={onBack}>
        <Text style={styles.secondaryBtnText}>{backLabel}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.bg,
  },
  icon: { fontSize: 64, marginBottom: spacing.md },
  title: { fontSize: 28, fontWeight: '900', color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  stars: { flexDirection: 'row', gap: 8, marginBottom: spacing.lg },
  star: { fontSize: 32 },
  starDim: { opacity: 0.2 },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  statCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    minWidth: 90,
    ...shadow.sm,
  },
  statValue: { fontSize: 22, fontWeight: '900', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 4, fontWeight: '600' },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  nextBtn: {
    backgroundColor: '#F0FDF4',
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: '#A7F3D0',
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  nextBtnText: { color: colors.green, fontWeight: '800', fontSize: 16 },
  secondaryBtn: {
    backgroundColor: colors.bg,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  secondaryBtnText: { color: colors.text, fontWeight: '700', fontSize: 16 },
});
