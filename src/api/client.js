import AsyncStorage from '@react-native-async-storage/async-storage';

// Switch this to your EC2 URL in production
export const BASE_URL = 'http://43.204.232.129:8080/api/brainspark';

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
