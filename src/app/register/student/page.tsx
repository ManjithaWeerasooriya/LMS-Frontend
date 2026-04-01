import { RegistrationForm } from '@/app/register/_components/RegistrationForm';

export default async function StudentRegistrationPage({
  searchParams,
}: {
  searchParams?: Promise<{ redirect?: string }>;
}) {
  const resolvedSearchParams = await searchParams;

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto flex max-w-5xl justify-center">
        <RegistrationForm
          role="Student"
          title="Student Registration"
          subtitle="Start learning with Genuine English"
          description="Create your student account to access lessons, assignments, and progress tracking in one place."
          successInstruction="Please check your email to verify your account before logging in."
          submitLabel="Register as Student"
          redirectTo={resolvedSearchParams?.redirect}
        />
      </div>
    </div>
  );
}
