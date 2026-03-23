export type Course = {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  durationHours: number;
  teacherName: string;
};

type CourseRecord = Partial<Course> & {
  id?: string | number;
};

const DEFAULT_LOCAL_API_URL = "http://localhost:5251";

const fallbackCourses: Course[] = [
  {
    id: "general-english-foundations",
    title: "General English Foundations",
    description: "Build confidence in grammar, vocabulary, reading, and everyday communication.",
    category: "General English",
    price: 49,
    durationHours: 24,
    teacherName: "Genuine English",
  },
  {
    id: "ielts-speaking-essentials",
    title: "IELTS Speaking Essentials",
    description: "Practice structured speaking tasks with guided feedback and exam-focused drills.",
    category: "IELTS",
    price: 79,
    durationHours: 18,
    teacherName: "Genuine English",
  },
  {
    id: "academic-writing-bootcamp",
    title: "Academic Writing Bootcamp",
    description: "Learn paragraph structure, essay flow, and formal writing for higher education.",
    category: "Writing",
    price: 69,
    durationHours: 20,
    teacherName: "Genuine English",
  },
];

function resolvePublicApiUrl(): string | null {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV !== "production") {
    return DEFAULT_LOCAL_API_URL;
  }

  return null;
}

function normalizeCourse(input: CourseRecord): Course | null {
  const id = input.id;
  const title = input.title;

  if ((typeof id !== "string" && typeof id !== "number") || typeof title !== "string") {
    return null;
  }

  return {
    id: String(id),
    title,
    description:
      typeof input.description === "string" && input.description.trim()
        ? input.description
        : "Course description will be available soon.",
    category:
      typeof input.category === "string" && input.category.trim()
        ? input.category
        : "Uncategorized",
    price: typeof input.price === "number" ? input.price : 0,
    durationHours:
      typeof input.durationHours === "number"
        ? input.durationHours
        : typeof input.durationHours === "string"
          ? Number(input.durationHours) || 0
          : 0,
    teacherName:
      typeof input.teacherName === "string" && input.teacherName.trim()
        ? input.teacherName
        : "Genuine English",
  };
}

function filterCourses(courses: Course[], search?: string): Course[] {
  const term = search?.trim().toLowerCase();

  if (!term) {
    return courses;
  }

  return courses.filter((course) =>
    [course.title, course.description, course.category, course.teacherName]
      .join(" ")
      .toLowerCase()
      .includes(term),
  );
}

async function fetchPublicCourses(): Promise<Course[] | null> {
  const apiBaseUrl = resolvePublicApiUrl();

  if (!apiBaseUrl) {
    return null;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/api/public/courses`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as unknown;
    if (!Array.isArray(data)) {
      return null;
    }

    const courses = data
      .map((item) => normalizeCourse((item ?? {}) as CourseRecord))
      .filter((course): course is Course => course !== null);

    return courses;
  } catch {
    return null;
  }
}

export async function getCourses(search?: string): Promise<Course[]> {
  const remoteCourses = await fetchPublicCourses();
  const courses = remoteCourses && remoteCourses.length > 0 ? remoteCourses : fallbackCourses;
  return filterCourses(courses, search);
}

export async function getCourseById(id: string): Promise<Course | null> {
  const courses = await getCourses();
  return courses.find((course) => course.id === id) ?? null;
}