import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { setString } from '../storage';
import { AGE_GROUPS, DOMAINS } from '../constants';
import { colors, spacing, radius, shadow } from '../theme';

const FEATURES = [
  { icon: '🧠', title: 'Cognitive Assessment', desc: '5-minute test mapping 5 cognitive domains', color: colors.primary, status: 'live' },
  { icon: '🎮', title: '5 Brain Games', desc: 'Memory, attention, patterns, spatial & logic', color: colors.secondary, status: 'live' },
  { icon: '📈', title: 'Adaptive Difficulty', desc: 'AI adjusts based on age and performance', color: colors.green, status: 'beta' },
  { icon: '👨‍👩‍👧', title: 'Parent Dashboard', desc: 'Track progress with radar chart & history', color: colors.amber, status: 'live' },
  { icon: '🌐', title: 'Regional Languages', desc: 'Hindi, Kannada, Tamil, Telugu coming soon', color: colors.pink, status: 'coming' },
  { icon: '🤖', title: 'AI Voice Tutor', desc: 'Voice-first companion for kids (coming soon)', color: '#06B6D4', status: 'coming' },
];

export default function HomeScreen({ navigation }) {
  const [selectedAge, setSelectedAge] = useState(null);

  const handleStart = async () => {
    if (!selectedAge) return;
    await setString('bs_age_group', selectedAge);
    navigation.navigate('Assessment');
  };

  const handleSkipToGames = async () => {
    if (!selectedAge) return;
    await setString('bs_age_group', selectedAge);
    navigation.navigate('Games');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>🧠</Text>
          <Text style={styles.heroTitle}>Build Smarter Brains{'\n'}
            <Text style={styles.gradient}>Through Play</Text>
          </Text>
          <Text style={styles.heroSub}>
            Free AI-powered cognitive games that adapt to your child's level.
            10 minutes a day to sharpen memory, attention, logic and more.
          </Text>
        </View>

        {/* Age Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How old is your child?</Text>
          <View style={styles.ageGrid}>
            {AGE_GROUPS.map(age => (
              <TouchableOpacity
                key={age.id}
                style={[styles.ageCard, selectedAge === age.id && styles.ageCardSelected]}
                onPress={() => setSelectedAge(age.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.ageIcon}>{age.icon}</Text>
                <Text style={[styles.ageRange, selectedAge === age.id && styles.ageRangeSelected]}>{age.range}</Text>
                <Text style={[styles.ageLabel, selectedAge === age.id && styles.ageLabelSelected]}>{age.label}</Text>
                <Text style={styles.ageDesc}>{age.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, !selectedAge && styles.btnDisabled]}
            onPress={handleStart}
            disabled={!selectedAge}
          >
            <Text style={styles.primaryBtnText}>Start Brain Assessment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryBtn, !selectedAge && styles.btnDisabled]}
            onPress={handleSkipToGames}
            disabled={!selectedAge}
          >
            <Text style={styles.secondaryBtnText}>Skip to Games</Text>
          </TouchableOpacity>
        </View>

        {/* 5 Domains */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5 Cognitive Domains</Text>
          <View style={styles.domainsRow}>
            {DOMAINS.map(d => (
              <View key={d.key} style={styles.domainChip}>
                <Text style={styles.domainIcon}>{d.icon}</Text>
                <Text style={[styles.domainName, { color: d.color }]}>{d.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why BrainSpark?</Text>
          <View style={styles.featuresGrid}>
            {FEATURES.map(f => (
              <View key={f.title} style={[styles.featureCard, f.status === 'coming' && styles.featureCardDim]}>
                {f.status === 'coming' && (
                  <View style={styles.badge}><Text style={styles.badgeText}>COMING SOON</Text></View>
                )}
                {f.status === 'beta' && (
                  <View style={[styles.badge, styles.badgeBeta]}><Text style={[styles.badgeText, styles.badgeBetaText]}>BETA</Text></View>
                )}
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* How it works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          {[
            { step: '1', icon: '🎯', title: 'Take Assessment', desc: '5-minute cognitive profile quiz' },
            { step: '2', icon: '🎮', title: 'Play Daily Games', desc: '10 min/day, AI-adapted to your level' },
            { step: '3', icon: '📈', title: 'Track Growth', desc: 'Watch cognitive scores improve weekly' },
          ].map(s => (
            <View key={s.step} style={styles.step}>
              <View style={styles.stepNumber}><Text style={styles.stepNumText}>{s.step}</Text></View>
              <Text style={styles.stepIcon}>{s.icon}</Text>
              <View style={styles.stepInfo}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA Banner */}
        <View style={styles.ctaBanner}>
          <Text style={styles.ctaTitle}>Ready to spark your child's brain?</Text>
          <Text style={styles.ctaSub}>100% free. No ads. No data selling. Just better brains.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.md, paddingBottom: spacing.xxl },
  hero: { alignItems: 'center', paddingVertical: spacing.xl },
  heroIcon: { fontSize: 56, marginBottom: spacing.md },
  heroTitle: { fontSize: 28, fontWeight: '900', color: colors.text, textAlign: 'center', lineHeight: 36 },
  gradient: { color: colors.primary },
  heroSub: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm, lineHeight: 22 },
  section: { marginBottom: spacing.xl },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: spacing.md, textAlign: 'center' },
  ageGrid: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  ageCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.md,
    alignItems: 'center', borderWidth: 2, borderColor: colors.border, ...shadow.sm,
  },
  ageCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  ageIcon: { fontSize: 28, marginBottom: 4 },
  ageRange: { fontSize: 20, fontWeight: '900', color: colors.text },
  ageRangeSelected: { color: colors.primary },
  ageLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textAlign: 'center' },
  ageLabelSelected: { color: colors.primary },
  ageDesc: { fontSize: 10, color: colors.textLight, textAlign: 'center', marginTop: 4 },
  primaryBtn: {
    backgroundColor: colors.primary, borderRadius: radius.full,
    paddingVertical: 16, alignItems: 'center', marginBottom: spacing.sm,
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  secondaryBtn: {
    backgroundColor: colors.card, borderRadius: radius.full,
    paddingVertical: 16, alignItems: 'center',
    borderWidth: 2, borderColor: colors.border,
  },
  secondaryBtnText: { color: colors.text, fontWeight: '700', fontSize: 16 },
  btnDisabled: { opacity: 0.4 },
  domainsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  domainChip: {
    backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.md,
    alignItems: 'center', minWidth: 90, borderWidth: 1, borderColor: colors.border, ...shadow.sm,
  },
  domainIcon: { fontSize: 28, marginBottom: 6 },
  domainName: { fontSize: 12, fontWeight: '800' },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  featureCard: {
    backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.md,
    width: '47%', borderWidth: 1, borderColor: colors.border, position: 'relative', ...shadow.sm,
  },
  featureCardDim: { opacity: 0.7 },
  featureIcon: { fontSize: 28, marginBottom: 8 },
  featureTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 4 },
  featureDesc: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  badge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.full,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#92400E' },
  badgeBeta: { backgroundColor: '#DBEAFE' },
  badgeBetaText: { color: '#1D4ED8' },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  stepNumber: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  stepIcon: { fontSize: 28 },
  stepInfo: { flex: 1 },
  stepTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  stepDesc: { fontSize: 13, color: colors.textMuted },
  ctaBanner: {
    backgroundColor: colors.primary, borderRadius: radius.xxl,
    padding: spacing.xl, alignItems: 'center',
  },
  ctaTitle: { fontSize: 20, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 8 },
  ctaSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
});
