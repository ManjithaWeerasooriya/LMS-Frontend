const STORAGE_KEY = 'lmsDeviceId';

const fallbackUuid = () => `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;

export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const newId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : fallbackUuid();
  window.localStorage.setItem(STORAGE_KEY, newId);
  return newId;
}
