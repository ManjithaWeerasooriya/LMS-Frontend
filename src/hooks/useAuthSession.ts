'use client';

import { useEffect, useState } from 'react';

import {
  AUTH_STATE_CHANGE_EVENT,
  EMPTY_AUTH_SESSION,
  getStoredAuthSession,
  type AuthSession,
} from '@/lib/auth';

export function useAuthSession() {
  const [session, setSession] = useState<AuthSession>(EMPTY_AUTH_SESSION);

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
