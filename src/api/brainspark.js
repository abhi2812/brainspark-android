import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiGet, apiPost } from './client';

// ---- Keys ----
const DEVICE_ID_KEY   = 'bs_device_id';
const CONFIG_CACHE_KEY = 'bs_config_cache';
const PROFILE_CACHE_KEY = 'bs_profile_cache';
const SYNC_QUEUE_KEY  = 'bs_sync_queue';
const CONFIG_TTL_MS   = 24 * 60 * 60 * 1000; // 24h
const PROFILE_TTL_MS  = 5  * 60 * 1000;       // 5 min

// ---- Device ID (anonymous, generated once) ----

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export async function getDeviceId() {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = generateUUID();
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

// ---- Register device (call once on app start / age group change) ----

export async function registerDevice(ageGroup) {
  const deviceId = await getDeviceId();
  try {
    await apiPost('/register', { deviceId, ageGroup });
  } catch {
    // offline — device will be registered on next online action
  }
  return deviceId;
}

// ---- Config (cached 24h, fallback to stale cache if offline) ----

export async function getConfig() {
  try {
    const cached = await AsyncStorage.getItem(CONFIG_CACHE_KEY);
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < CONFIG_TTL_MS) return data;
    }
  } catch {}

  try {
    const data = await apiGet('/config');
    await AsyncStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
    return data;
  } catch {
    // offline — return stale cache if available
    try {
      const cached = await AsyncStorage.getItem(CONFIG_CACHE_KEY);
      if (cached) return JSON.parse(cached).data;
    } catch {}
    return null; // app will use built-in fallback constants
  }
}

// ---- Profile (cached 5 min, fallback to stale) ----

export async function getProfile() {
  const deviceId = await getDeviceId();

  try {
    const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < PROFILE_TTL_MS) return data;
    }
  } catch {}

  try {
    const data = await apiGet(`/profile/${deviceId}`);
    await AsyncStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
    return data;
  } catch {
    try {
      const cached = await AsyncStorage.getItem(PROFILE_CACHE_KEY);
      if (cached) return JSON.parse(cached).data;
    } catch {}
    return null;
  }
}

export function invalidateProfileCache() {
  return AsyncStorage.removeItem(PROFILE_CACHE_KEY);
}

// ---- Save game session (queue if offline, flush on reconnect) ----

export async function saveSession(session) {
  const deviceId = await getDeviceId();
  const payload = { deviceId, ...session };
  try {
    await apiPost('/session', payload);
    await invalidateProfileCache();
  } catch {
    await enqueue('session', payload);
  }
}

// ---- Save assessment (queue if offline) ----

export async function saveAssessment(scores) {
  const deviceId = await getDeviceId();
  const payload = { deviceId, ...scores };
  try {
    await apiPost('/assessment', payload);
    await invalidateProfileCache();
  } catch {
    await enqueue('assessment', payload);
  }
}

// ---- Offline sync queue ----

async function enqueue(type, data) {
  try {
    const raw = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    queue.push({ type, data, ts: Date.now() });
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

export async function flushSyncQueue() {
  try {
    const raw = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    if (!raw) return;
    const queue = JSON.parse(raw);
    if (!queue.length) return;

    const remaining = [];
    for (const item of queue) {
      try {
        if (item.type === 'session')    await apiPost('/session',    item.data);
        if (item.type === 'assessment') await apiPost('/assessment', item.data);
        // success — don't re-queue
      } catch {
        remaining.push(item); // still offline — keep for next flush
      }
    }
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remaining));
    if (remaining.length < queue.length) await invalidateProfileCache();
  } catch {}
}
