const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1';

export function setAccessToken(token: string | null) {
  if (token) localStorage.setItem('access_token', token);
  else localStorage.removeItem('access_token');
}

export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

function authHeaders() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function buildUrl(path: string) {
  const base = SERVER_URL.replace(/\/$/, '');
  const rel = path.startsWith('/') ? path : `/${path}`;
  return `${base}${API_PREFIX}${rel}`;
}

async function handle(res: Response) {
  if (!res.ok) {
    let message = 'Request failed';
    try {
      const t = await res.text();
      message = t || message;
    } catch {}
    throw new Error(message);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

export async function apiGet(path: string) {
  const res = await fetch(buildUrl(path), { headers: { ...authHeaders() } });
  return handle(res);
}

export async function apiPost(path: string, body: any, init?: RequestInit) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers = isFormData ? authHeaders() : { 'Content-Type': 'application/json', ...authHeaders() };
  const res = await fetch(buildUrl(path), {
    method: 'POST',
    headers,
    body: isFormData ? body : JSON.stringify(body),
    ...init,
  });
  return handle(res);
}

export async function apiPut(path: string, body: any) {
  const res = await fetch(buildUrl(path), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  });
  return handle(res);
}

export async function apiDelete(path: string) {
  const res = await fetch(buildUrl(path), { method: 'DELETE', headers: { ...authHeaders() } });
  return handle(res);
}

// Auth endpoints
export async function registerUser(payload: { email: string; password: string; first_name?: string; last_name?: string }) {
  return apiPost('/users/register', payload);
}

export async function loginUser(payload: { email: string; password: string }) {
  return apiPost('/users/login', payload);
}

// Profile & Allergens
export async function getProfile() { return apiGet('/users/profile'); }
export async function updateProfile(payload: any) { return apiPut('/users/profile', payload); }
export async function getAllergens() { return apiGet('/users/allergens'); }
export async function updateAllergens(payload: any) { return apiPut('/users/allergens', payload); }

// Scan
export async function scanImage(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  return apiPost('/scan/image', fd);
}

export async function scanBarcode(barcode: string) {
  return apiPost('/scan/barcode', { barcode });
}

export async function scanVoice(payload: { text?: string; audio_base64?: string }) {
  return apiPost('/scan/voice', payload);
}

export async function analyzeFood(foodDetails: any) {
  return apiPost('/scan/analyze', foodDetails);
}

// History
export async function getHistory() { return apiGet('/users/history'); }
export async function addHistory(entry: any) { return apiPost('/users/history', entry); }
export async function deleteHistoryEntry(id: string) { return apiDelete(`/users/history/${id}`); }
export async function clearHistory() { return apiDelete('/users/history'); }































