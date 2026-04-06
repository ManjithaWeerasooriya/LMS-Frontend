type CourseRecord = {
  id?: string | number | null;
  courseId?: string | number | null;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  summary?: string | null;
  category?: string | null;
  price?: number | string | null;
  durationHours?: number | string | null;
  duration?: number | string | null;
  teacherName?: string | null;
  teacherFullName?: string | null;
  teacherDisplayName?: string | null;
  teacherEmail?: string | null;
  instructorName?: string | null;
  instructorFullName?: string | null;
  instructorDisplayName?: string | null;
  instructorEmail?: string | null;
  email?: string | null;
  difficultyLevel?: string | null;
  prerequisites?: string | null;
  status?: string | null;
  maxStudents?: number | string | null;
  studentsEnrolled?: number | string | null;
  students?: number | string | null;
  rating?: number | string | null;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  category: string | null;
  price: number | null;
  durationHours: number | null;
  teacherName: string | null;
  difficultyLevel: string | null;
  prerequisites: string | null;
  maxStudents: number | null;
  studentsEnrolled: number | null;
  rating: number | null;
  status: string | null;
  tags: string[];
};

export type CourseListResult = {
  courses: Course[];
  error: string | null;
};

export type CourseDetailResult = {
  course: Course | null;
  error: string | null;
};

const DEFAULT_LOCAL_API_URL = 'http://localhost:5251';

const fallbackCourses: Course[] = [
  {
    id: 'general-english-foundations',
    title: 'General English Foundations',
    description:
      'Build confidence in grammar, vocabulary, reading, and everyday communication with a structured beginner-friendly syllabus.',
    shortDescription:
      'Build confidence in grammar, vocabulary, reading, and everyday communication with a structured beginner-friendly syllabus.',
    category: 'General English',
    price: 49,
    durationHours: 24,
    teacherName: 'Genuine English',
    difficultyLevel: 'Beginner',
    prerequisites: 'No prior experience required.',
    maxStudents: 40,
    studentsEnrolled: 120,
    rating: 4.8,
    status: 'Active',
    tags: ['General English', 'Beginner'],
  },
  {
    id: 'ielts-speaking-essentials',
    title: 'IELTS Speaking Essentials',
    description:
      'Practice speaking tasks with timed prompts, guided feedback, and focused drills designed for higher IELTS band scores.',
    shortDescription:
      'Practice speaking tasks with timed prompts, guided feedback, and focused drills designed for higher IELTS band scores.',
    category: 'IELTS',
    price: 79,
    durationHours: 18,
    teacherName: 'Genuine English',
    difficultyLevel: 'Intermediate',
    prerequisites: 'Basic spoken English is recommended.',
    maxStudents: 30,
    studentsEnrolled: 84,
    rating: 4.9,
    status: 'Active',
    tags: ['IELTS', 'Intermediate'],
  },
  {
    id: 'academic-writing-bootcamp',
    title: 'Academic Writing Bootcamp',
    description:
      'Learn essay structure, argument flow, citation basics, and formal academic style through practical writing exercises.',
    shortDescription:
      'Learn essay structure, argument flow, citation basics, and formal academic style through practical writing exercises.',
    category: 'Writing',
    price: 69,
    durationHours: 20,
    teacherName: 'Genuine English',
    difficultyLevel: 'Intermediate',
    prerequisites: 'Comfort with paragraph-level writing is helpful.',
    maxStudents: 35,
    studentsEnrolled: 63,
    rating: 4.7,
    status: 'Active',
    tags: ['Writing', 'Intermediate'],
  },
];

function resolvePublicApiUrl(): string | null {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  if (process.env.NODE_ENV !== 'production') {
    return DEFAULT_LOCAL_API_URL;
  }

  return null;
}

function toStringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function toNumberValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function buildDescription(description: string | null, title: string): string {
  if (description) return description;
  return `${title} is available now on Genuine English. Course details will be updated soon.`;
}

function createShortDescription(description: string): string {
  const normalized = description.replace(/\s+/g, ' ').trim();
  if (normalized.length <= 140) return normalized;
  return `${normalized.slice(0, 137).trimEnd()}...`;
}

function buildTags(course: Omit<Course, 'tags'>): string[] {
  return [course.category, course.difficultyLevel].filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  );
}

function normalizeCourse(
  input: CourseRecord | null | undefined,
  baseCourse?: Course | null,
): Course | null {
  const id = input?.id ?? input?.courseId ?? baseCourse?.id;
  const title =
    toStringValue(input?.title) ??
    toStringValue(input?.name) ??
    baseCourse?.title ??
    null;

  if ((typeof id !== 'string' && typeof id !== 'number') || !title) {
    return null;
  }

  const description = buildDescription(
    toStringValue(input?.description) ?? toStringValue(input?.summary) ?? baseCourse?.description ?? null,
    title,
  );

  const normalizedCourse: Omit<Course, 'tags'> = {
    id: String(id),
    title,
    description,
    shortDescription: createShortDescription(description),
    category: toStringValue(input?.category) ?? baseCourse?.category ?? null,
    price: toNumberValue(input?.price) ?? baseCourse?.price ?? null,
    durationHours:
      toNumberValue(input?.durationHours) ??
      toNumberValue(input?.duration) ??
      baseCourse?.durationHours ??
      null,
    teacherName:
      toStringValue(input?.teacherFullName) ??
      toStringValue(input?.teacherDisplayName) ??
      toStringValue(input?.instructorFullName) ??
      toStringValue(input?.instructorDisplayName) ??
      toStringValue(input?.teacherName) ??
      toStringValue(input?.instructorName) ??
      toStringValue(input?.teacherEmail) ??
      toStringValue(input?.instructorEmail) ??
      toStringValue(input?.email) ??
      baseCourse?.teacherName ??
      null,
    difficultyLevel: toStringValue(input?.difficultyLevel) ?? baseCourse?.difficultyLevel ?? null,
    prerequisites: toStringValue(input?.prerequisites) ?? baseCourse?.prerequisites ?? null,
    maxStudents: toNumberValue(input?.maxStudents) ?? baseCourse?.maxStudents ?? null,
    studentsEnrolled:
      toNumberValue(input?.studentsEnrolled) ??
      toNumberValue(input?.students) ??
      baseCourse?.studentsEnrolled ??
      null,
    rating: toNumberValue(input?.rating) ?? baseCourse?.rating ?? null,
    status: toStringValue(input?.status) ?? baseCourse?.status ?? null,
  };

  return {
    ...normalizedCourse,
    tags: buildTags(normalizedCourse),
  };
}

function filterCourses(courses: Course[], search?: string): Course[] {
  const term = search?.trim().toLowerCase();
  if (!term) return courses;

  return courses.filter((course) =>
    [
      course.title,
      course.description,
      course.category ?? '',
      course.teacherName ?? '',
      course.difficultyLevel ?? '',
    ]
      .join(' ')
      .toLowerCase()
      .includes(term),
  );
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

async function fetchCourseCollection(search?: string): Promise<CourseListResult> {
  const apiBaseUrl = resolvePublicApiUrl();

  if (!apiBaseUrl) {
    return {
      courses: filterCourses(fallbackCourses, search),
      error: null,
    };
  }

  try {
    const params = new URLSearchParams();
    if (search?.trim()) {
      params.set('search', search.trim());
    }

    const query = params.toString();
    const response = await fetch(`${apiBaseUrl}/api/public/courses${query ? `?${query}` : ''}`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return {
        courses: [],
        error: 'Unable to load courses right now. Please refresh or try again later.',
      };
    }

    const payload = await parseJson(response);
    const items = Array.isArray(payload)
      ? payload
      : payload && typeof payload === 'object' && Array.isArray((payload as { items?: unknown[] }).items)
        ? (payload as { items: unknown[] }).items
        : [];

    const courses = items
      .map((item) => normalizeCourse((item ?? {}) as CourseRecord))
      .filter((course): course is Course => course !== null);

    return {
      courses,
      error: null,
    };
  } catch {
    return {
      courses: [],
      error: 'Unable to load courses right now. Please check your connection and try again.',
    };
  }
}

export async function getCourses(search?: string): Promise<CourseListResult> {
  return fetchCourseCollection(search);
}

export async function getCourseById(id: string): Promise<CourseDetailResult> {
  const apiBaseUrl = resolvePublicApiUrl();

  if (!apiBaseUrl) {
    return {
      course: fallbackCourses.find((course) => course.id === id) ?? null,
      error: null,
    };
  }

  try {
    const response = await fetch(`${apiBaseUrl}/api/public/courses/${id}`, {
      next: { revalidate: 300 },
    });

    if (response.status === 404) {
      return {
        course: null,
        error: null,
      };
    }

    if (!response.ok) {
      return {
        course: null,
        error: 'Unable to load this course right now. Please refresh or try again later.',
      };
    }

    const [payload, catalogResult] = await Promise.all([
      parseJson(response),
      fetchCourseCollection(),
    ]);

    const matchingCourse = catalogResult.courses.find((course) => course.id === id) ?? null;
    const course = normalizeCourse((payload ?? {}) as CourseRecord, matchingCourse);

    return {
      course,
      error: null,
    };
  } catch {
    return {
      course: null,
      error: 'Unable to load this course right now. Please check your connection and try again.',
    };
  }
}
