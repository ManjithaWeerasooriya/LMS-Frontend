import { vi } from 'vitest';

export const pushMock = vi.fn();
export const replaceMock = vi.fn();
export const refreshMock = vi.fn();
export const prefetchMock = vi.fn();
export const backMock = vi.fn();

export const routerMock = {
  push: (...args: Parameters<typeof pushMock>) => pushMock(...args),
  replace: (...args: Parameters<typeof replaceMock>) => replaceMock(...args),
  refresh: (...args: Parameters<typeof refreshMock>) => refreshMock(...args),
  prefetch: (...args: Parameters<typeof prefetchMock>) => prefetchMock(...args),
  back: (...args: Parameters<typeof backMock>) => backMock(...args),
};

export const resetRouterMocks = () => {
  pushMock.mockClear();
  replaceMock.mockClear();
  refreshMock.mockClear();
  prefetchMock.mockClear();
  backMock.mockClear();
};
