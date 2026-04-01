'use client';

import { useEffect, useState } from 'react';

import { AUTH_STATE_CHANGE_EVENT, getStoredAuthSession, type AuthSession } from '@/lib/auth';

export function useAuthSession() {
  const [session, setSession] = useState<AuthSession>(() => getStoredAuthSession());

  useEffect(() => {
    const syncSession = () => {
      setSession(getStoredAuthSession());
    };

    syncSession();
    window.addEventListener('storage', syncSession);
    window.addEventListener('focus', syncSession);
    window.addEventListener('visibilitychange', syncSession);
    window.addEventListener(AUTH_STATE_CHANGE_EVENT, syncSession);

    return () => {
      window.removeEventListener('storage', syncSession);
      window.removeEventListener('focus', syncSession);
      window.removeEventListener('visibilitychange', syncSession);
      window.removeEventListener(AUTH_STATE_CHANGE_EVENT, syncSession);
    };
  }, []);

  return session;
}
