import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    return [
      {
        source: '/dashboard/student',
        destination: '/student/dashboard',
        permanent: false,
      },
      {
        source: '/dashboard/student/:path*',
        destination: '/student/dashboard/:path*',
        permanent: false,
      },
      {
        source: '/dashboard/profile',
        destination: '/teacher/dashboard/settings',
        permanent: false,
      },
      {
        source: '/dashboard/profile/:path*',
        destination: '/teacher/dashboard/settings',
        permanent: false,
      },
      {
        source: '/register/teacher',
        destination: '/register',
        permanent: false,
      },
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
