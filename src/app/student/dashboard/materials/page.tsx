import { redirect } from 'next/navigation';

export default function StudentMaterialsRedirectPage() {
  redirect('/student/dashboard/courses');
}
