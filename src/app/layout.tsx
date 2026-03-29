import type { Metadata } from 'next';

import { ConfirmProvider } from '@/context/ConfirmContext';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Genuine English LMS',
    template: '%s | Genuine English LMS',
  },
  description: 'Learning management platform for students and teachers at Genuine English.',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">
        <ConfirmProvider>{children}</ConfirmProvider>
      </body>
    </html>
  );
}
