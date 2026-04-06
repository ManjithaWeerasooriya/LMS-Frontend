import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { routerMock, resetRouterMocks } from '../mocks/nextNavigation';
import { confirmMock, resetConfirmMock } from '../mocks/confirmContext';
import { getMockAuthSession, resetMockAuthSession } from '../mocks/authSession';
import React from 'react';

vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
  usePathname: () => '/mock-path',
  useSearchParams: () => new URLSearchParams(),
}));

const MockLink = React.forwardRef<HTMLAnchorElement, React.ComponentProps<'a'>>(
  ({ href, children, ...props }, ref) => {
    const hrefObject = typeof href === 'object' && href !== null ? (href as { pathname?: string }) : null;
    const resolvedHref =
      typeof href === 'string'
        ? href
        : hrefObject && typeof hrefObject.pathname === 'string'
          ? hrefObject.pathname ?? '#'
          : '#';

    return (
      <a href={resolvedHref} ref={ref} {...props}>
        {children}
      </a>
    );
  },
);

MockLink.displayName = 'MockLink';

vi.mock('next/link', () => {
  return {
    __esModule: true,
    default: MockLink,
  };
});

vi.mock('@/context/ConfirmContext', () => ({
  useConfirm: () => confirmMock,
}));

vi.mock('@/hooks/useAuthSession', () => ({
  useAuthSession: () => getMockAuthSession(),
}));

// Polyfill scrollIntoView for jsdom
if (!window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
}

if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

afterEach(() => {
  cleanup();
  resetRouterMocks();
  resetConfirmMock();
  resetMockAuthSession();
});
