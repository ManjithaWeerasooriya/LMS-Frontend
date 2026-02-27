export type UserRole = 'Student' | 'Instructor' | 'Admin';

export interface LoginParams {
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginResult {
  token: string;
}

export class LoginError extends Error {
  public status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'LoginError';
    this.status = status;
  }
}

export async function loginUser({ email, password, role }: LoginParams): Promise<LoginResult> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new LoginError('Authentication service unavailable. Please try again later.');
  }

  try {
    const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, role }),
    });

    if (response.status === 401) {
      throw new LoginError('Invalid credentials. Please try again.', 401);
    }

    if (response.status === 403) {
      throw new LoginError('Account suspended or pending approval.', 403);
    }

    if (!response.ok) {
      throw new LoginError('Unable to sign in right now. Please try again later.', response.status);
    }

    const data = (await response.json()) as { token?: string };

    if (!data?.token) {
      throw new LoginError('Unexpected response from server.');
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', data.token);
    }

    return { token: data.token };
  } catch (error) {
    if (error instanceof LoginError) {
      throw error;
    }

    throw new LoginError('Something went wrong. Please try again.');
  }
}
