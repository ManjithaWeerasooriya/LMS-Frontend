import { vi } from 'vitest';

export const confirmMock = vi.fn<() => Promise<boolean>>(() => Promise.resolve(true));

export const resetConfirmMock = () => {
  confirmMock.mockClear();
  confirmMock.mockImplementation(() => Promise.resolve(true));
};
