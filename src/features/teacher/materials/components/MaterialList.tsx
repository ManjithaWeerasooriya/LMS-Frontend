'use client';

import { useMemo, type ReactElement } from 'react';
import { Download, FileText, Video } from 'lucide-react';

import type { CourseMaterial, MaterialType } from '@/features/teacher/materials/api/materials';

const badgeStyles: Record<MaterialType, string> = {
  pdf: 'bg-rose-50 text-rose-700',
  video: 'bg-violet-50 text-violet-700',
  assignment: 'bg-amber-50 text-amber-700',
  other: 'bg-slate-100 text-slate-600',
};

const materialTypeLabel: Record<MaterialType, string> = {
  pdf: 'PDF',
  video: 'Video',
  assignment: 'Assignment',
  other: 'Other',
};

const iconByType: Record<MaterialType, ReactElement> = {
  pdf: <FileText className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  assignment: <FileText className="h-4 w-4" />,
  other: <FileText className="h-4 w-4" />,
};

type MaterialListProps = {
  materials: CourseMaterial[];
  role: 'teacher' | 'student';
  onDownload?: (material: CourseMaterial) => Promise<void> | void;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatSize = (bytes: number) => {
  if (!bytes || Number.isNaN(bytes)) {
    return '—';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function MaterialList({ materials, role, onDownload }: MaterialListProps) {
  const rows = useMemo(() => materials, [materials]);

  if (!rows.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        No materials available yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3">Material</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Size</th>
              <th className="px-6 py-3">Uploaded</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((material) => {
              const badgeClass = badgeStyles[material.materialType];
              const typeLabel = materialTypeLabel[material.materialType];
              const Icon = iconByType[material.materialType];
              const canView = Boolean(material.fileUrl);
              const viewLabel = role === 'student' ? 'View' : 'Open';

              return (
                <tr key={material.id} className="hover:bg-slate-50/80">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                        {Icon}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{material.title}</p>
                        <p className="text-xs text-slate-500">{material.fileName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                      {typeLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{formatSize(material.fileSizeBytes)}</td>
                  <td className="px-6 py-4 text-slate-700">{formatDate(material.uploadedAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {canView ? (
                        <a
                          href={material.fileUrl ?? undefined}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-800"
                        >
                          {viewLabel}
                        </a>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => onDownload?.(material)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-[#1B3B8B] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#17306f]"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
