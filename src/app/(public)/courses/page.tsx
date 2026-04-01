import { CourseCatalogClient } from '@/features/public/courses/components/CourseCatalogClient';
import { getCourses } from '@/lib/courses';
import type { CourseSortOption } from '@/features/public/courses/utils';

type CoursesPageSearchParams = {
  search?: string;
  category?: string;
  sort?: string;
};

function normalizeSortOption(sort?: string): CourseSortOption {
  if (
    sort === 'featured' ||
    sort === 'title-asc' ||
    sort === 'price-asc' ||
    sort === 'price-desc' ||
    sort === 'duration-desc'
  ) {
    return sort;
  }

  return 'featured';
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams?: Promise<CoursesPageSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams?.search?.trim() ?? '';
  const category = resolvedSearchParams?.category?.trim() ?? '';
  const sort = normalizeSortOption(resolvedSearchParams?.sort);
  const { courses, error } = await getCourses(search);

  return (
    <CourseCatalogClient
      courses={courses}
      error={error}
      initialSearch={search}
      initialCategory={category}
      initialSort={sort}
    />
  );
}
