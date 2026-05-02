import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEYS = {
  AGE_GROUP: 'bs_age_group',
  COGNITIVE_PROFILE: 'bs_cognitive_profile',
  ASSESSMENT_DATE: 'bs_assessment_date',
  STREAK: 'bs_streak',
  GAME_MEMORY: 'bs_game_memory',
  GAME_ATTENTION: 'bs_game_attention',
  GAME_PATTERN: 'bs_game_pattern',
  GAME_SPATIAL: 'bs_game_spatial',
  GAME_LOGIC: 'bs_game_logic',
};

export async function getItem(key) {
  try {
    const val = await AsyncStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

export async function setItem(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export async function getString(key) {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setString(key, value) {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {}
}

export async function removeItem(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
}

export async function clearAll() {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  } catch {}
}

export async function updateStreak() {
  const streak = (await getItem(KEYS.STREAK)) || {};
  const today = new Date().toISOString().split('T')[0];
  if (streak.lastDate === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const newStreak = {
    count: streak.lastDate === yesterday ? (streak.count || 0) + 1 : 1,
    lastDate: today,
    best: Math.max(streak.best || 0, streak.lastDate === yesterday ? (streak.count || 0) + 1 : 1),
  };
  await setItem(KEYS.STREAK, newStreak);
}
