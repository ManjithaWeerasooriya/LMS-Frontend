import { RegistrationForm } from '@/app/register/_components/RegistrationForm';

export default function TeacherRegistrationPage() {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto flex max-w-5xl justify-center">
        <RegistrationForm
          role="Teacher"
          title="Teacher Registration"
          subtitle="Share your expertise with Genuine English"
          description="Submit your details to request instructor access. Admin approval is required before you can teach."
          successInstruction="Verify your email and wait for admin approval before logging in."
          submitLabel="Register as Teacher"
        />
      </div>
    </div>
  );
}
