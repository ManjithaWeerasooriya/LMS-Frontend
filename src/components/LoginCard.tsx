import Image from 'next/image';
import React from 'react';

type LoginCardProps = {
  title: string;
  subtitle: string;
  avatarSrc: string;
  children: React.ReactNode;
};

export function LoginCard({ title, subtitle, avatarSrc, children }: LoginCardProps) {
  return (
    <div className="w-full max-w-[420px] rounded-2xl bg-white p-8 text-center shadow-lg">
      <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-4 border-blue-500 ring-4 ring-blue-100">
        <Image
          src={avatarSrc}
          alt="Profile"
          width={72}
          height={72}
          className="h-16 w-16 rounded-full object-cover"
          priority
        />
      </div>
      <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      <div className="mt-6 text-left">{children}</div>
    </div>
  );
}
