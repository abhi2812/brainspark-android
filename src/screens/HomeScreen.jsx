import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setString } from '../storage';
import { registerDevice } from '../api/timmble';
import { AGE_GROUPS } from '../constants';
import Mascot from '../components/Mascot';
import { SkillIcon, Icon } from '../components/Icons';
import { colors, skillColors, spacing, radius, type, shadow } from '../theme';

const SKILLS = [
  { key: 'memory', name: 'Memory' },
  { key: 'attention', name: 'Focus' },
  { key: 'pattern', name: 'Patterns' },
  { key: 'spatial', name: 'Shapes' },
  { key: 'logic', name: 'Logic' },
];

const AGE_ACCENT = { young: colors.sunny, middle: colors.teal, older: colors.grape };

const FEATURES = [
  { icon: 'spark', title: 'Warm-Up', desc: 'Quick games to get started', tint: colors.coral, screen: 'Assessment' },
  { icon: 'games', title: '5 Fun Games', desc: 'Memory, focus, patterns & more', tint: colors.teal, screen: 'Games' },
  { icon: 'trend', title: 'Just-Right Level', desc: 'Adapts to your child’s pace', tint: colors.sky, screen: 'Games' },
  { icon: 'chart', title: 'Parent View', desc: 'See progress any time', tint: colors.berry, screen: 'Dashboard' },
  { icon: 'globe', title: 'More Languages', desc: 'Hindi & regional — soon', tint: colors.grape, soon: true },
  { icon: 'sound', title: 'Voice Buddy', desc: 'A talking helper — soon', tint: colors.sunny, soon: true },
];

// Press-to-squish wrapper for tactile feedback.
function Squishy({ children, onPress, style, disabled }) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v) => Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 8 }).start();
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onPressIn={() => !disabled && to(0.96)}
      onPressOut={() => to(1)}
    >
      <Animated.View style={[style, { transform: [{ scale }] }, disabled && { opacity: 0.45 }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default function HomeScreen({ navigation }) {
  const [selectedAge, setSelectedAge] = useState(null);
  const scrollRef = useRef(null);
  const ageShake = useRef(new Animated.Value(0)).current;
  const ageSectionY = useRef(0);

  // entrance + idle mascot bob
  const enter = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const promptAgeSelection = () => {
    scrollRef.current?.scrollTo({ y: ageSectionY.current - 20, animated: true });
    Animated.sequence([
      Animated.timing(ageShake, { toValue: 8, duration: 55, useNativeDriver: true }),
      Animated.timing(ageShake, { toValue: -8, duration: 55, useNativeDriver: true }),
      Animated.timing(ageShake, { toValue: 8, duration: 55, useNativeDriver: true }),
      Animated.timing(ageShake, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const go = async (screen) => {
    if (!selectedAge) { promptAgeSelection(); return; }
    await setString('bs_age_group', selectedAge);
    registerDevice(selectedAge);
    navigation.navigate(screen);
  };

  const heroStyle = {
    opacity: enter,
    transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
  };
  const bobStyle = { transform: [{ translateY: bob.interpolate({ inputRange: [-1, 0], outputRange: [-8, 0] }) }] };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <Animated.View style={[styles.hero, heroStyle]}>
          <Animated.View style={bobStyle}>
            <Mascot size={132} mood="happy" />
          </Animated.View>
          <Text style={styles.heroTitle}>Hi, I’m Timmo!</Text>
          <Text style={styles.heroSub}>Let’s play, learn, and grow together — a few happy minutes a day.</Text>
        </Animated.View>

        {/* Age selection */}
        <View style={styles.section} onLayout={e => { ageSectionY.current = e.nativeEvent.layout.y; }}>
          <Text style={styles.sectionTitle}>Who’s playing today?</Text>
          <Animated.View style={[styles.ageRow, { transform: [{ translateX: ageShake }] }]}>
            {AGE_GROUPS.map(age => {
              const on = selectedAge === age.id;
              const accent = AGE_ACCENT[age.id] || colors.teal;
              return (
                <Squishy key={age.id} onPress={() => setSelectedAge(age.id)} style={{ flex: 1 }}>
                  <View style={[styles.ageCard, on && { borderColor: accent, backgroundColor: accent + '14' }]}>
                    <View style={[styles.ageDot, { backgroundColor: on ? accent : accent + '33' }]}>
                      <Text style={[styles.ageDotText, { color: on ? '#fff' : accent }]}>{age.range}</Text>
                    </View>
                    <Text style={styles.ageLabel}>{age.label}</Text>
                  </View>
                </Squishy>
              );
            })}
          </Animated.View>

          <Squishy onPress={() => go('Assessment')} style={[styles.primaryBtn, !selectedAge && styles.btnWaiting, !!selectedAge && shadow.glow(colors.coral)]}>
            <Text style={styles.primaryBtnText}>Start Warm-Up</Text>
            <Icon name="arrow" color="#fff" size={22} />
          </Squishy>
          <Squishy onPress={() => go('Games')} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Skip to Games</Text>
          </Squishy>
        </View>

        {/* Skill areas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What Timmo helps with</Text>
          <View style={styles.skillRow}>
            {SKILLS.map(sk => (
              <View key={sk.key} style={styles.skill}>
                <View style={[styles.skillTile, { backgroundColor: skillColors[sk.key].soft }]}>
                  <SkillIcon name={sk.key} color={skillColors[sk.key].main} size={30} />
                </View>
                <Text style={styles.skillLabel}>{sk.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why families like us</Text>
          <View style={styles.featGrid}>
            {FEATURES.map(f => (
              <Squishy key={f.title} disabled={f.soon} onPress={() => f.screen && navigation.navigate(f.screen)} style={{ width: '47.5%' }}>
                <View style={[styles.featCard, f.soon && styles.featSoon]}>
                  {f.soon && <View style={styles.soonPill}><Text style={styles.soonText}>SOON</Text></View>}
                  <View style={[styles.featIcon, { backgroundColor: f.tint + '1A' }]}>
                    <Icon name={f.icon} color={f.tint} size={24} />
                  </View>
                  <Text style={styles.featTitle}>{f.title}</Text>
                  <Text style={styles.featDesc}>{f.desc}</Text>
                </View>
              </Squishy>
            ))}
          </View>
        </View>

        {/* How it works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How it works</Text>
          {[
            { n: '1', t: 'Warm up', d: 'A few quick games to get started' },
            { n: '2', t: 'Play daily', d: 'A few happy minutes, just right for your child' },
            { n: '3', t: 'See progress', d: 'Streaks, favorites and growth over time' },
          ].map(s => (
            <View key={s.n} style={styles.step}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>{s.n}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{s.t}</Text>
                <Text style={styles.stepDesc}>{s.d}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.cta}>
          <Mascot size={78} mood="celebrate" />
          <Text style={styles.ctaTitle}>Ready to play?</Text>
          <Text style={styles.ctaSub}>Free · No ads · No data selling</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.md, paddingBottom: spacing.xxl },

  hero: { alignItems: 'center', paddingTop: spacing.md, paddingBottom: spacing.lg },
  heroTitle: { ...type.display, color: colors.ink, marginTop: spacing.sm, textAlign: 'center' },
  heroSub: { ...type.body, color: colors.textMuted, textAlign: 'center', marginTop: 8, paddingHorizontal: spacing.md },

  section: { marginBottom: spacing.xl },
  sectionTitle: { ...type.heading, color: colors.ink, marginBottom: spacing.md },

  ageRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  ageCard: {
    backgroundColor: colors.card, borderRadius: radius.xl, paddingVertical: spacing.md,
    alignItems: 'center', borderWidth: 2, borderColor: colors.border, ...shadow.sm,
  },
  ageDot: { width: 52, height: 52, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  ageDotText: { fontSize: 15, fontWeight: '800' },
  ageLabel: { ...type.label, color: colors.textMuted, textAlign: 'center' },

  primaryBtn: {
    flexDirection: 'row', gap: 8, backgroundColor: colors.coral, borderRadius: radius.full,
    paddingVertical: 17, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  btnWaiting: { opacity: 0.55 },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 17 },
  secondaryBtn: {
    backgroundColor: colors.card, borderRadius: radius.full, paddingVertical: 16,
    alignItems: 'center', borderWidth: 2, borderColor: colors.border,
  },
  secondaryBtnText: { color: colors.ink, fontWeight: '700', fontSize: 16 },

  skillRow: { flexDirection: 'row', justifyContent: 'space-between' },
  skill: { alignItems: 'center', flex: 1 },
  skillTile: { width: 60, height: 60, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  skillLabel: { ...type.caption, color: colors.textMuted },

  featGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between' },
  featCard: {
    backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border, ...shadow.sm, minHeight: 132,
  },
  featSoon: { opacity: 0.72 },
  featIcon: { width: 46, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  featTitle: { ...type.bodyStrong, color: colors.ink, marginBottom: 3 },
  featDesc: { fontSize: 12.5, color: colors.textMuted, lineHeight: 17 },
  soonPill: { position: 'absolute', top: 10, right: 10, backgroundColor: colors.cream2, paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.full },
  soonText: { fontSize: 9, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.5 },

  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  stepNum: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 18, fontWeight: '800', color: colors.teal },
  stepTitle: { ...type.bodyStrong, color: colors.ink },
  stepDesc: { fontSize: 13, color: colors.textMuted, marginTop: 1 },

  cta: { alignItems: 'center', backgroundColor: colors.tealSoft, borderRadius: radius.xxl, paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
  ctaTitle: { ...type.title, color: colors.ink, marginTop: 4 },
  ctaSub: { ...type.bodyStrong, color: colors.teal, marginTop: 6 },
});
