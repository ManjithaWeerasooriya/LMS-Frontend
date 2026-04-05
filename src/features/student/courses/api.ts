'use client';

import { apiClient } from '@/lib/http';
import { buildApiPath, resolveApiPath } from '@/generated/api-paths';
import type { CourseDetailDto } from '@/generated/api-types';
import {
  convertStudentAxiosError,
  type StudentCourseListItem,
} from '@/features/student/api/student';
import {
  getCourseMaterials,
  type CourseMaterial,
} from '@/features/student/materials/api/materials';

export type StudentCourseOverview = Omit<StudentCourseListItem, 'description'> & {
  description: string;
  durationHours: number | null;
  difficultyLevel: string | null;
  prerequisites: string | null;
  status: string | null;
};

export type StudentCourseQuiz = {
  id: string;
  courseId: string | null;
  courseTitle: string | null;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  questionCount: number | null;
  totalMarks: number | null;
  status: string | null;
  isPublished: boolean | null;
  availableFrom: string | null;
  availableUntil: string | null;
  availabilityLabel: string | null;
  weekLabel: string | null;
  weekNumber: number | null;
  moduleTitle: string | null;
  lessonTitle: string | null;
  sortOrder: number | null;
};

export type StudentCourseWeek = {
  key: string;
  weekNumber: number;
  label: string;
  mappingLabel: string | null;
  materials: CourseMaterial[];
  quizzes: StudentCourseQuiz[];
};

export type StudentCourseContent = {
  course: StudentCourseOverview;
  materials: CourseMaterial[];
  quizzes: StudentCourseQuiz[];
  weeks: StudentCourseWeek[];
};

const PUBLIC_COURSE_DETAIL_PATH = resolveApiPath('/api/public/courses/{id}');
const STUDENT_QUIZZES_PATH = resolveApiPath('/api/v1/student/quizzes');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (record: Record<string, unknown>, keys: string[]): string | null => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

const readNumber = (record: Record<string, unknown>, keys: string[]): number | null => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
};

const readBoolean = (record: Record<string, unknown>, keys: string[]): boolean | null => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
    }
  }

  return null;
};

const readRecord = (
  record: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> | null => {
  for (const key of keys) {
    const value = record[key];
    if (isRecord(value)) {
      return value;
    }
  }

  return null;
};

const unwrapCollection = (value: unknown, keys: string[] = []): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return [];
  }

  for (const key of [...keys, 'items', 'results', 'data']) {
    const nested = value[key];
    if (Array.isArray(nested)) {
      return nested;
    }
  }

  return [];
};

const unwrapEntity = (value: unknown, keys: string[] = []): Record<string, unknown> => {
  if (!isRecord(value)) {
    return {};
  }

  for (const key of [...keys, 'item', 'data', 'result']) {
    const nested = value[key];
    if (isRecord(nested)) {
      return nested;
    }
  }

  return value;
};

const normalizeCourseDescription = (title: string, value?: string | null) =>
  value?.trim() ||
  `${title} is available from your student dashboard. Weekly learning content will appear here as your instructor publishes it.`;

const normalizeCourseOverview = (
  detail: CourseDetailDto | null | undefined,
  fallbackCourse: StudentCourseListItem,
): StudentCourseOverview => {
  const record = (isRecord(detail) ? detail : {}) as CourseDetailDto & Record<string, unknown>;
  const title = readString(record, ['title', 'name']) ?? fallbackCourse.title;

  return {
    ...fallbackCourse,
    title,
    category: readString(record, ['category']) ?? fallbackCourse.category,
    description: normalizeCourseDescription(
      title,
      readString(record, ['description', 'summary']) ?? fallbackCourse.description,
    ),
    durationHours: readNumber(record, ['durationHours', 'duration']) ?? null,
    difficultyLevel: readString(record, ['difficultyLevel']) ?? null,
    prerequisites: readString(record, ['prerequisites']) ?? null,
    status: readString(record, ['status']) ?? null,
  };
};

const normalizeQuiz = (value: unknown): StudentCourseQuiz => {
  const record = unwrapEntity(value, ['quiz']);
  const courseRecord = readRecord(record, ['course']);
  const courseTitle =
    readString(record, ['courseTitle', 'courseName']) ??
    (courseRecord ? readString(courseRecord, ['title', 'name']) : null);

  return {
    id: readString(record, ['id', 'quizId']) ?? '',
    courseId:
      readString(record, ['courseId']) ??
      (courseRecord ? readString(courseRecord, ['id', 'courseId']) : null),
    courseTitle,
    title: readString(record, ['title', 'quizTitle', 'name']) ?? 'Untitled Quiz',
    description: readString(record, ['description', 'summary']),
    durationMinutes: readNumber(record, ['durationMinutes', 'duration']),
    questionCount: readNumber(record, ['questionCount', 'questionsCount', 'totalQuestions']),
    totalMarks: readNumber(record, ['totalMarks', 'maxMarks']),
    status: readString(record, ['status']),
    isPublished: readBoolean(record, ['isPublished', 'published']),
    availableFrom: readString(record, ['startTimeUtc', 'startsAt', 'availableFrom']),
    availableUntil: readString(record, ['endTimeUtc', 'endsAt', 'availableUntil']),
    availabilityLabel: readString(record, ['availabilityLabel', 'availability', 'availabilityText']),
    weekLabel:
      readString(record, ['weekLabel', 'weekName']) ??
      (typeof record.week === 'string' && record.week.trim() ? record.week.trim() : null),
    weekNumber:
      readNumber(record, ['weekNumber']) ??
      (typeof record.week === 'number' && Number.isFinite(record.week) ? record.week : null),
    moduleTitle: readString(record, ['moduleTitle', 'moduleName', 'module']),
    lessonTitle: readString(record, ['lessonTitle', 'lessonName', 'lesson']),
    sortOrder: readNumber(record, ['sortOrder', 'orderIndex']),
  };
};

const normalizeLabel = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();

const parseWeekNumber = (value: string | null): number | null => {
  if (!value) return null;

  const match = /week\s*(\d+)|module\s*(\d+)|lesson\s*(\d+)/i.exec(value);
  if (!match) {
    return null;
  }

  const numericValue = Number(match[1] ?? match[2] ?? match[3]);
  return Number.isFinite(numericValue) ? numericValue : null;
};

type GroupableItem = {
  title: string;
  weekLabel: string | null;
  weekNumber: number | null;
  moduleTitle: string | null;
  lessonTitle: string | null;
  sortOrder: number | null;
};

type WeekGroupBucket = {
  key: string;
  weekNumber: number;
  label: string;
  mappingLabels: Set<string>;
  materials: CourseMaterial[];
  quizzes: StudentCourseQuiz[];
};

const compareNullableNumbers = (left: number | null, right: number | null) => {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  return left - right;
};

const compareStrings = (left: string, right: string) =>
  left.localeCompare(right, undefined, { sensitivity: 'base' });

const compareGroupableItems = <T extends GroupableItem>(left: T, right: T) => {
  const orderResult = compareNullableNumbers(left.sortOrder, right.sortOrder);
  if (orderResult !== 0) {
    return orderResult;
  }

  return compareStrings(left.title, right.title);
};

const ensureBucket = (
  buckets: Map<string, WeekGroupBucket>,
  key: string,
  weekNumber: number,
  mappingLabel?: string | null,
): WeekGroupBucket => {
  const existing = buckets.get(key);
  if (existing) {
    if (mappingLabel) {
      existing.mappingLabels.add(mappingLabel);
    }
    return existing;
  }

  const bucket: WeekGroupBucket = {
    key,
    weekNumber,
    label: `Week ${weekNumber}`,
    mappingLabels: mappingLabel ? new Set([mappingLabel]) : new Set(),
    materials: [],
    quizzes: [],
  };
  buckets.set(key, bucket);
  return bucket;
};

const addMaterialToBucket = (
  buckets: Map<string, WeekGroupBucket>,
  bucketKey: string,
  weekNumber: number,
  material: CourseMaterial,
  mappingLabel?: string | null,
) => {
  const bucket = ensureBucket(buckets, bucketKey, weekNumber, mappingLabel);
  bucket.materials.push(material);
};

const addQuizToBucket = (
  buckets: Map<string, WeekGroupBucket>,
  bucketKey: string,
  weekNumber: number,
  quiz: StudentCourseQuiz,
  mappingLabel?: string | null,
) => {
  const bucket = ensureBucket(buckets, bucketKey, weekNumber, mappingLabel);
  bucket.quizzes.push(quiz);
};

const groupCourseContentByWeek = (
  materials: CourseMaterial[],
  quizzes: StudentCourseQuiz[],
): StudentCourseWeek[] => {
  const buckets = new Map<string, WeekGroupBucket>();
  const usedWeekNumbers = new Set<number>();
  const mappedSources = new Map<
    string,
    {
      sourceLabel: string;
      explicitOrder: number | null;
      firstSeenIndex: number;
      materials: CourseMaterial[];
      quizzes: StudentCourseQuiz[];
    }
  >();
  const fallbackMaterials: CourseMaterial[] = [];
  const fallbackQuizzes: StudentCourseQuiz[] = [];

  const assignItem = <T extends GroupableItem>(
    item: T,
    index: number,
    onExplicit: (key: string, weekNumber: number, mappingLabel?: string | null) => void,
    onMapped: (sourceLabel: string, explicitOrder: number | null) => void,
    onFallback: () => void,
  ) => {
    const explicitWeekNumber =
      item.weekNumber ??
      parseWeekNumber(item.weekLabel) ??
      parseWeekNumber(item.moduleTitle) ??
      parseWeekNumber(item.lessonTitle);

    if (explicitWeekNumber != null && explicitWeekNumber > 0) {
      const sourceLabel = item.weekLabel ?? item.moduleTitle ?? item.lessonTitle;
      const normalizedWeekLabel = `Week ${explicitWeekNumber}`;
      const mappingLabel =
        sourceLabel && normalizeLabel(sourceLabel) !== normalizeLabel(normalizedWeekLabel)
          ? sourceLabel
          : null;

      onExplicit(`week-${explicitWeekNumber}`, explicitWeekNumber, mappingLabel);
      usedWeekNumbers.add(explicitWeekNumber);
      return;
    }

    const sourceLabel = item.weekLabel ?? item.moduleTitle ?? item.lessonTitle;
    if (sourceLabel) {
      onMapped(sourceLabel, parseWeekNumber(sourceLabel));
      return;
    }

    onFallback();
  };

  materials.forEach((material, index) => {
    assignItem(
      material,
      index,
      (key, weekNumber, mappingLabel) =>
        addMaterialToBucket(buckets, key, weekNumber, material, mappingLabel),
      (sourceLabel, explicitOrder) => {
        const groupKey = normalizeLabel(sourceLabel);
        const existing = mappedSources.get(groupKey);
        if (existing) {
          existing.materials.push(material);
          return;
        }

        mappedSources.set(groupKey, {
          sourceLabel,
          explicitOrder,
          firstSeenIndex: index,
          materials: [material],
          quizzes: [],
        });
      },
      () => {
        fallbackMaterials.push(material);
      },
    );
  });

  quizzes.forEach((quiz, index) => {
    assignItem(
      quiz,
      index + materials.length,
      (key, weekNumber, mappingLabel) =>
        addQuizToBucket(buckets, key, weekNumber, quiz, mappingLabel),
      (sourceLabel, explicitOrder) => {
        const groupKey = normalizeLabel(sourceLabel);
        const existing = mappedSources.get(groupKey);
        if (existing) {
          existing.quizzes.push(quiz);
          return;
        }

        mappedSources.set(groupKey, {
          sourceLabel,
          explicitOrder,
          firstSeenIndex: index + materials.length,
          materials: [],
          quizzes: [quiz],
        });
      },
      () => {
        fallbackQuizzes.push(quiz);
      },
    );
  });

  const mappedEntries = [...mappedSources.values()].sort((left, right) => {
    const orderResult = compareNullableNumbers(left.explicitOrder, right.explicitOrder);
    if (orderResult !== 0) {
      return orderResult;
    }

    if (left.firstSeenIndex !== right.firstSeenIndex) {
      return left.firstSeenIndex - right.firstSeenIndex;
    }

    return compareStrings(left.sourceLabel, right.sourceLabel);
  });

  let nextWeekNumber = usedWeekNumbers.size > 0 ? Math.max(...usedWeekNumbers) + 1 : 1;
  const reserveNextWeekNumber = () => {
    while (usedWeekNumbers.has(nextWeekNumber)) {
      nextWeekNumber += 1;
    }

    const assigned = nextWeekNumber;
    usedWeekNumbers.add(assigned);
    nextWeekNumber += 1;
    return assigned;
  };

  mappedEntries.forEach((entry) => {
    const weekNumber =
      entry.explicitOrder != null && entry.explicitOrder > 0 && !usedWeekNumbers.has(entry.explicitOrder)
        ? entry.explicitOrder
        : reserveNextWeekNumber();

    if (entry.explicitOrder != null && entry.explicitOrder > 0 && !usedWeekNumbers.has(entry.explicitOrder)) {
      usedWeekNumbers.add(entry.explicitOrder);
    }

    const bucket = ensureBucket(buckets, `week-${weekNumber}`, weekNumber, entry.sourceLabel);
    bucket.materials.push(...entry.materials);
    bucket.quizzes.push(...entry.quizzes);
  });

  if (fallbackMaterials.length > 0 || fallbackQuizzes.length > 0) {
    const fallbackWeekNumber = buckets.size === 0 ? 1 : reserveNextWeekNumber();
    const bucket = ensureBucket(
      buckets,
      `week-${fallbackWeekNumber}`,
      fallbackWeekNumber,
      buckets.size === 0 ? null : 'Additional published content',
    );
    bucket.materials.push(...fallbackMaterials);
    bucket.quizzes.push(...fallbackQuizzes);
  }

  return [...buckets.values()]
    .sort((left, right) => left.weekNumber - right.weekNumber)
    .map((bucket) => ({
      key: bucket.key,
      weekNumber: bucket.weekNumber,
      label: bucket.label,
      mappingLabel:
        bucket.mappingLabels.size === 1
          ? [...bucket.mappingLabels][0]
          : bucket.mappingLabels.size > 1
            ? 'Multiple module mappings'
            : null,
      materials: [...bucket.materials].sort(compareGroupableItems),
      quizzes: [...bucket.quizzes].sort(compareGroupableItems),
    }));
};

const normalizeCourseTitle = (courseTitle: string | null) =>
  courseTitle?.trim().replace(/\s+/g, ' ') ?? null;

const isQuizInCourse = (
  quiz: StudentCourseQuiz,
  courseId: string,
  courseTitle: string,
): boolean => {
  if (quiz.courseId && quiz.courseId === courseId) {
    return true;
  }

  const normalizedQuizCourseTitle = normalizeCourseTitle(quiz.courseTitle);
  const normalizedCourseTitle = normalizeCourseTitle(courseTitle);
  return Boolean(
    normalizedQuizCourseTitle &&
      normalizedCourseTitle &&
      normalizeLabel(normalizedQuizCourseTitle) === normalizeLabel(normalizedCourseTitle),
  );
};

export async function getStudentCourseOverview(
  courseId: string,
  fallbackCourse: StudentCourseListItem,
): Promise<StudentCourseOverview> {
  try {
    const { data } = await apiClient.get<CourseDetailDto>(
      buildApiPath(PUBLIC_COURSE_DETAIL_PATH, { id: courseId }),
    );
    return normalizeCourseOverview(data, fallbackCourse);
  } catch (error) {
    console.warn('[StudentCourseOverview] Falling back to enrolled course data.', error);
    return normalizeCourseOverview(null, fallbackCourse);
  }
}

export async function getStudentQuizzes(): Promise<StudentCourseQuiz[]> {
  try {
    const { data } = await apiClient.get<unknown>(STUDENT_QUIZZES_PATH);
    return unwrapCollection(data, ['quizzes']).map(normalizeQuiz).filter((quiz) => quiz.id);
  } catch (error) {
    throw convertStudentAxiosError(error, 'Unable to load student quizzes.');
  }
}

export async function getStudentCourseContent(
  courseId: string,
  fallbackCourse: StudentCourseListItem,
): Promise<StudentCourseContent> {
  try {
    const [course, materials, quizzes] = await Promise.all([
      getStudentCourseOverview(courseId, fallbackCourse),
      getCourseMaterials(courseId),
      getStudentQuizzes(),
    ]);

    const filteredQuizzes = quizzes.filter((quiz) => isQuizInCourse(quiz, courseId, course.title));

    return {
      course,
      materials,
      quizzes: filteredQuizzes,
      weeks: groupCourseContentByWeek(materials, filteredQuizzes),
    };
  } catch (error) {
    throw convertStudentAxiosError(error, 'Unable to load course content.');
  }
}
