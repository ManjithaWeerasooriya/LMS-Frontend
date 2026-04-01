'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { MaterialList } from '@/features/teacher/materials/components/MaterialList';
import {
  downloadMaterial,
  getCourseMaterials,
  MaterialsApiError,
  type CourseMaterial,
} from '@/features/student/materials/api/materials';
import { logoutUser } from '@/lib/auth';

const DEFAULT_STUDENT_COURSE_ID = 'default-student-course';

export default function StudentMaterialsPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseId] = useState(DEFAULT_STUDENT_COURSE_ID);

  useEffect(() => {
    let active = true;

    const loadMaterials = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getCourseMaterials(courseId);
        if (!active) return;
        setMaterials(data);
      } catch (err) {
        if (!active) return;

        if (err instanceof MaterialsApiError) {
          if (err.status === 401) {
            await logoutUser();
            router.replace('/login');
            return;
          }
          if (err.status === 403) {
            setError('You must be enrolled to access materials.');
          } else {
            setError(err.message);
          }
        } else {
          setError('Unable to load course materials.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadMaterials();

    return () => {
      active = false;
    };
  }, [courseId, router]);

  const handleDownload = async (material: CourseMaterial) => {
    try {
      await downloadMaterial(material.id);
    } catch (err) {
      if (err instanceof MaterialsApiError) {
        setError(err.message);
      }
    }
  };

  const hasMaterials = useMemo(() => materials.length > 0, [materials]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.4em] text-blue-700">Materials</p>
        <h1 className="text-3xl font-semibold text-slate-900">Course Materials</h1>
        <p className="text-sm text-slate-500">Download the files shared by your instructor.</p>
      </header>

      {error ? (
        <div className={`rounded-3xl border p-4 text-sm ${error.includes('enrolled') ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-6 w-40 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-slate-200" />
          <div className="mt-2 h-4 w-2/3 animate-pulse rounded-full bg-slate-200" />
        </div>
      ) : hasMaterials ? (
        <MaterialList materials={materials} role="student" onDownload={handleDownload} />
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          No materials available yet.
        </div>
      )}
    </div>
  );
}
