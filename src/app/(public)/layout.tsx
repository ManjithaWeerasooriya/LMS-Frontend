import type { ReactNode } from 'react';

import { Footer } from '@/components/public/Footer';
import { Navbar } from '@/components/public/Navbar';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
