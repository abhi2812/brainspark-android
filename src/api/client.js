import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = 'https://api.timmble.com/api/timmble';

const TIMEOUT_MS = 8000;

function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(id));
}

export async function apiGet(path) {
  const res = await fetchWithTimeout(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API ${res.status} on GET ${path}`);
  return res.json();
}

export async function apiPost(path, body) {
  const res = await fetchWithTimeout(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status} on POST ${path}`);
  return res.status === 204 ? null : res.json().catch(() => null);
}
