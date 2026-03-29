import type { ReactNode } from 'react';

import { AppNavbar } from '@/components/AppNavbar';
import { Footer } from '@/components/public/Footer';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <AppNavbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
