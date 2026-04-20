'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { MaterialList } from '@/features/teacher/materials/components/MaterialList';
import { UploadDropzone } from '@/features/teacher/materials/components/UploadDropzone';
import {
  downloadMaterial,
  getCourseMaterials,
  MaterialsApiError,
  uploadMaterial,
  type CourseMaterial,
} from '@/features/teacher/materials/api/materials';
import { getTeacherCourses, type TeacherCourse } from '@/features/teacher/api/teacher';
import { logoutUser } from '@/lib/auth';

export default function TeacherMaterialsPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [courseId, setCourseId] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let active = true;

    const loadCourses = async () => {
      try {
        const teacherCourses = await getTeacherCourses();
        if (!active) return;
        setCourses(teacherCourses);
        if (teacherCourses.length > 0) {
          setCourseId((current) => current || teacherCourses[0].id);
        }
      } catch (err) {
        console.warn('[TeacherMaterialsPage] Unable to load courses', err);
      }
    };

    void loadCourses();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (!courseId) {
      setMaterials([]);
      setLoading(false);
      return () => {
        active = false;
      };
    }

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
            setError('You need elevated access to manage course materials.');
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

  const handleRefresh = async () => {
    if (!courseId) return;
    setIsRefreshing(true);
    try {
      const data = await getCourseMaterials(courseId);
      setMaterials(data);
    } catch (err) {
      if (err instanceof MaterialsApiError) {
        setError(err.message);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUpload = async (file: File, title?: string) => {
    if (!courseId) return;
    setError(null);
    try {
      await uploadMaterial(courseId, file, title);
      await handleRefresh();
    } catch (err) {
      if (err instanceof MaterialsApiError) {
        if (err.status === 400) {
          setError(err.message || 'Please verify the file and try again.');
        } else if (err.status === 403) {
          setError('You do not have permission to upload to this course.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to upload material.');
      }
    }
  };

  const handleDownload = async (material: CourseMaterial) => {
    try {
      await downloadMaterial(material);
    } catch (err) {
      if (err instanceof MaterialsApiError) {
        setError(err.message);
      }
    }
  };

  const hasData = useMemo(() => materials.length > 0, [materials]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.4em] text-blue-700">Materials</p>
        <h1 className="text-3xl font-semibold text-slate-900">Course Materials</h1>
        <p className="text-sm text-slate-500">Upload lesson files and share them with enrolled learners.</p>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="text-sm font-semibold text-slate-700">
          Select Course
          <select
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {courses.length === 0 ? <option value="">No courses available</option> : null}
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </label>
      </section>

      <UploadDropzone courseId={courseId} onUpload={handleUpload} />

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      ) : null}

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-6 w-40 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-slate-200" />
          <div className="mt-2 h-4 w-2/3 animate-pulse rounded-full bg-slate-200" />
        </div>
      ) : (
        <MaterialList materials={materials} onDownload={handleDownload} />
      )}

      {hasData ? (
        <button
          type="button"
          onClick={handleRefresh}
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-white"
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Refreshing…' : 'Refresh materials'}
        </button>
      ) : null}
    </div>
  );
}
