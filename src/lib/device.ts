const STORAGE_KEY = 'lmsDeviceId';
let cachedDeviceId: string | null = null;

const fallbackUuid = () => `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;

export function getDeviceId(): string {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  if (typeof window === 'undefined') {
    cachedDeviceId = fallbackUuid();
    return cachedDeviceId;
  }

  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing && existing.trim().length > 0) {
    cachedDeviceId = existing;
    return cachedDeviceId;
  }

  const newId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : fallbackUuid();
  window.localStorage.setItem(STORAGE_KEY, newId);
  cachedDeviceId = newId;
  return newId;
}
