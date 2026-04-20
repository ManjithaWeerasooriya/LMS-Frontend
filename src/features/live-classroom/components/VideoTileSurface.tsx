'use client';

import { Maximize2, Minimize2, MonitorPlay } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { LiveClassroomVideoTile } from '@/features/live-classroom/hooks/useLiveClassroomCall';

type VideoTileSurfaceProps = {
  tile: LiveClassroomVideoTile | null;
  title: string;
  emptyTitle: string;
  emptyMessage: string;
  className?: string;
  showFullscreenButton?: boolean;
};

export function VideoTileSurface({
  tile,
  title,
  emptyTitle,
  emptyMessage,
  className = '',
  showFullscreenButton = false,
}: VideoTileSurfaceProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canToggleFullscreen, setCanToggleFullscreen] = useState(false);

  useEffect(() => {
    const container = targetRef.current;
    if (!container) {
      return;
    }

    container.innerHTML = '';

    if (!tile?.target) {
      return;
    }

    tile.target.classList.add('h-full', 'w-full');
    container.appendChild(tile.target);

    return () => {
      if (container.contains(tile.target)) {
        container.removeChild(tile.target);
      }
    };
  }, [tile]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const surface = surfaceRef.current;

      setCanToggleFullscreen(
        Boolean(
          showFullscreenButton &&
            tile &&
            surface &&
            typeof surface.requestFullscreen === 'function' &&
            typeof document.exitFullscreen === 'function',
        ),
      );
      setIsFullscreen(Boolean(surface && document.fullscreenElement === surface));
    };

    handleFullscreenChange();
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [showFullscreenButton, tile]);

  const handleToggleFullscreen = async () => {
    const surface = surfaceRef.current;
    if (
      !surface ||
      !tile ||
      typeof surface.requestFullscreen !== 'function' ||
      typeof document.exitFullscreen !== 'function'
    ) {
      return;
    }

    try {
      if (document.fullscreenElement === surface) {
        await document.exitFullscreen();
        return;
      }

      await surface.requestFullscreen();
    } catch {
      // Ignore fullscreen errors. The stage remains usable in its normal layout.
    }
  };

  return (
    <div
      ref={surfaceRef}
      data-live-tile-surface="true"
      className={`overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 text-white shadow-[0_24px_45px_rgba(15,23,42,0.22)] ${className}`}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <p className="text-sm font-semibold text-white/90">{title}</p>
        <div className="flex items-center gap-2">
          {tile ? (
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
              {tile.displayName}
            </span>
          ) : null}

          {canToggleFullscreen ? (
            <button
              type="button"
              onClick={() => void handleToggleFullscreen()}
              aria-label={`${isFullscreen ? 'Exit' : 'Enter'} full screen for ${title}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 transition hover:bg-white/15"
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              {isFullscreen ? 'Exit full screen' : 'Full screen'}
            </button>
          ) : null}
        </div>
      </div>

      <div className="relative aspect-video bg-[radial-gradient(circle_at_top,#1e3a8a_0%,#0f172a_48%,#020617_100%)]">
        {tile ? (
          <div ref={targetRef} className="h-full w-full" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-white/10 text-white/80">
              <MonitorPlay className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-lg font-semibold">{emptyTitle}</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/65">{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
