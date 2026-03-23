const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// ✅ Define type
export type Course = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  price: number;
  durationHours: number;
  teacherName?: string;
};

// ✅ Get all courses
export async function getCourses(search?: string): Promise<Course[]> {
  const url = search
    ? `${API_BASE}/api/public/courses?search=${encodeURIComponent(search)}`
    : `${API_BASE}/api/public/courses`;

  try {
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) return [];

    const data = await res.json();
    return data as Course[];
  } catch {
    return [];
  }
}

// ✅ Get single course
export async function getCourseById(id: string): Promise<Course | null> {
  try {
    const res = await fetch(`${API_BASE}/api/public/courses/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data as Course;
  } catch {
    return null;
  }
}