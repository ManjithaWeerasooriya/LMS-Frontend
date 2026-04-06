import { EMPTY_AUTH_SESSION, type AuthSession } from '@/lib/auth';

const sessionState: AuthSession = { ...EMPTY_AUTH_SESSION };

export const getMockAuthSession = (): AuthSession => sessionState;

export const setMockAuthSession = (next: Partial<AuthSession>) => {
  Object.assign(sessionState, next);
};

export const resetMockAuthSession = () => {
  Object.assign(sessionState, { ...EMPTY_AUTH_SESSION });
};
