import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/dashboard/teacher',
        destination: '/teacher/dashboard',
        permanent: false,
      },
      {
        source: '/dashboard/teacher/:path*',
        destination: '/teacher/dashboard/:path*',
        permanent: false,
      },
      {
        source: '/dashboard/admin',
        destination: '/teacher/dashboard',
        permanent: false,
      },
      {
        source: '/dashboard/admin/users',
        destination: '/teacher/dashboard/users',
        permanent: false,
      },
      {
        source: '/dashboard/admin/courses',
        destination: '/teacher/dashboard/platform-courses',
        permanent: false,
      },
      {
        source: '/dashboard/admin/reports',
        destination: '/teacher/dashboard/reports',
        permanent: false,
      },
      {
        source: '/dashboard/admin/:path*',
        destination: '/teacher/dashboard',
        permanent: false,
      },
      {
        source: '/tutor/dashboard',
        destination: '/teacher/dashboard',
        permanent: false,
      },
      {
        source: '/tutor/dashboard/:path*',
        destination: '/teacher/dashboard/:path*',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
