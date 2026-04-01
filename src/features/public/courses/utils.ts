import type { Course } from '@/lib/courses';

export type CourseSortOption = 'featured' | 'title-asc' | 'price-asc' | 'price-desc' | 'duration-desc';

export function formatCoursePrice(price: number | null): string {
  if (price == null) return 'Free';
  if (price === 0) return 'Free';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatCourseDuration(durationHours: number | null): string {
  if (durationHours == null || durationHours <= 0) return 'Self-paced';
  return `${durationHours}h`;
}

export function getCourseCategories(courses: Course[]): string[] {
  return Array.from(
    new Set(
      courses
        .map((course) => course.category)
        .filter((category): category is string => typeof category === 'string' && category.length > 0),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

export function sortCourses(courses: Course[], sort: CourseSortOption): Course[] {
  const sorted = [...courses];

  switch (sort) {
    case 'title-asc':
      return sorted.sort((left, right) => left.title.localeCompare(right.title));
    case 'price-asc':
      return sorted.sort((left, right) => (left.price ?? 0) - (right.price ?? 0));
    case 'price-desc':
      return sorted.sort((left, right) => (right.price ?? 0) - (left.price ?? 0));
    case 'duration-desc':
      return sorted.sort((left, right) => (right.durationHours ?? 0) - (left.durationHours ?? 0));
    case 'featured':
    default:
      return sorted.sort((left, right) => {
        const ratingDifference = (right.rating ?? 0) - (left.rating ?? 0);
        if (ratingDifference !== 0) return ratingDifference;
        return (right.studentsEnrolled ?? 0) - (left.studentsEnrolled ?? 0);
      });
  }
}

export function buildLearningPoints(course: Course): string[] {
  const subject = course.category ?? 'the course subject';
  const duration = formatCourseDuration(course.durationHours);
  const difficulty = course.difficultyLevel?.toLowerCase() ?? 'all levels';

  return [
    `Build confidence in ${subject.toLowerCase()} with structured lessons and guided practice.`,
    `Work through ${duration === 'Self-paced' ? 'self-paced course material' : `around ${duration} of learning material`} designed for ${difficulty} learners.`,
    course.prerequisites
      ? `Prepare effectively with clear expectations before starting: ${course.prerequisites}`
      : 'Move through a clear progression of concepts, exercises, and practical checkpoints.',
  ];
}
