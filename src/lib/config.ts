const BASE_URL = '' as const;

const endpoints = {
  auth: {
    login: '/api/v1/auth/login',
  },
} as const;

export type EndpointPaths = typeof endpoints;

export const apiConfig = {
  BASE_URL,
  endpoints,
} as const;
