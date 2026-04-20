import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { VideoTileSurface } from '@/features/live-classroom/components/VideoTileSurface';
import type { LiveClassroomVideoTile } from '@/features/live-classroom/hooks/useLiveClassroomCall';

const tile: LiveClassroomVideoTile = {
  id: 'teacher-stream',
  participantId: 'teacher-1',
  displayName: 'Teacher stream',
  target: document.createElement('div'),
  mediaStreamType: 'Video',
  isReceiving: true,
};

const originalExitFullscreen = Object.getOwnPropertyDescriptor(document, 'exitFullscreen');
const originalFullscreenElement = Object.getOwnPropertyDescriptor(document, 'fullscreenElement');
const originalRequestFullscreen = Object.getOwnPropertyDescriptor(
  HTMLDivElement.prototype,
  'requestFullscreen',
);

let activeFullscreenElement: Element | null = null;
let requestFullscreenMock: ReturnType<typeof vi.fn>;
let exitFullscreenMock: ReturnType<typeof vi.fn>;

beforeAll(() => {
  Object.defineProperty(document, 'fullscreenElement', {
    configurable: true,
    get: () => activeFullscreenElement,
  });
});

afterAll(() => {
  if (originalFullscreenElement) {
    Object.defineProperty(document, 'fullscreenElement', originalFullscreenElement);
  } else {
    delete (document as Document & { fullscreenElement?: Element | null }).fullscreenElement;
  }

  if (originalExitFullscreen) {
    Object.defineProperty(document, 'exitFullscreen', originalExitFullscreen);
  } else {
    delete (document as Document & { exitFullscreen?: () => Promise<void> }).exitFullscreen;
  }

  if (originalRequestFullscreen) {
    Object.defineProperty(HTMLDivElement.prototype, 'requestFullscreen', originalRequestFullscreen);
  } else {
    delete (
      HTMLDivElement.prototype as HTMLDivElement & {
        requestFullscreen?: () => Promise<void>;
      }
    ).requestFullscreen;
  }
});

describe('VideoTileSurface', () => {
  beforeEach(() => {
    activeFullscreenElement = null;

    requestFullscreenMock = vi.fn(async () => {
      activeFullscreenElement = document.querySelector('[data-live-tile-surface="true"]');
      document.dispatchEvent(new Event('fullscreenchange'));
    });

    exitFullscreenMock = vi.fn(async () => {
      activeFullscreenElement = null;
      document.dispatchEvent(new Event('fullscreenchange'));
    });

    Object.defineProperty(HTMLDivElement.prototype, 'requestFullscreen', {
      configurable: true,
      value: requestFullscreenMock,
      writable: true,
    });

    Object.defineProperty(document, 'exitFullscreen', {
      configurable: true,
      value: exitFullscreenMock,
      writable: true,
    });
  });

  it('toggles full screen for the live stream tile when enabled', async () => {
    render(
      <VideoTileSurface
        tile={tile}
        title="Teacher stream"
        emptyTitle="No stream"
        emptyMessage="The stream is unavailable."
        showFullscreenButton
      />,
    );

    const enterButton = await screen.findByRole('button', {
      name: /enter full screen for teacher stream/i,
    });

    await userEvent.click(enterButton);

    await waitFor(() => {
      expect(requestFullscreenMock).toHaveBeenCalledTimes(1);
    });

    const exitButton = await screen.findByRole('button', {
      name: /exit full screen for teacher stream/i,
    });

    await userEvent.click(exitButton);

    await waitFor(() => {
      expect(exitFullscreenMock).toHaveBeenCalledTimes(1);
    });
  });

  it('does not render the full screen control without an active tile', () => {
    render(
      <VideoTileSurface
        tile={null}
        title="Teacher stream"
        emptyTitle="No stream"
        emptyMessage="The stream is unavailable."
        showFullscreenButton
      />,
    );

    expect(screen.queryByRole('button', { name: /full screen/i })).not.toBeInTheDocument();
  });
});
