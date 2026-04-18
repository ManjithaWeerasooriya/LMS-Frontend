'use client';

import { MonitorPlay } from 'lucide-react';
import { useEffect, useRef } from 'react';

import type { LiveClassroomVideoTile } from '@/features/live-classroom/hooks/useLiveClassroomCall';

type VideoTileSurfaceProps = {
  tile: LiveClassroomVideoTile | null;
  title: string;
  emptyTitle: string;
  emptyMessage: string;
  className?: string;
};

export function VideoTileSurface({
  tile,
  title,
  emptyTitle,
  emptyMessage,
  className = '',
}: VideoTileSurfaceProps) {
  const targetRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <div
      className={`overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 text-white shadow-[0_24px_45px_rgba(15,23,42,0.22)] ${className}`}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <p className="text-sm font-semibold text-white/90">{title}</p>
        {tile ? (
          <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
            {tile.displayName}
          </span>
        ) : null}
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
