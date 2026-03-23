const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function getCourses(search?: string) {
  const url = search
    ? `${API_BASE}/api/public/courses?search=${encodeURIComponent(search)}`
    : `${API_BASE}/api/public/courses`;

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) return [];

  return res.json();
}

export async function getCourseById(id: string) {
  const res = await fetch(`${API_BASE}/api/public/courses/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) return null;

  return res.json();
}