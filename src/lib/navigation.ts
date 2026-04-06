export function getSafeRedirectPath(redirect: string | null | undefined, fallback: string): string {
  if (!redirect) return fallback;

  const trimmed = redirect.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback;
  }

  return trimmed;
}

export function withRedirect(path: string, redirect: string | null | undefined): string {
  const safeRedirect = getSafeRedirectPath(redirect, '');
  if (!safeRedirect) return path;

  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}redirect=${encodeURIComponent(safeRedirect)}`;
}
