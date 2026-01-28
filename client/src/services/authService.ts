import config from '../config';

interface AuthResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    displayName: string;
  };
  isNewUser?: boolean;
}

interface ApiError {
  error: string;
  retryAfter?: number;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    const error = data as ApiError;
    throw new Error(error.error || 'An error occurred');
  }

  return data as T;
}

export async function register(email: string, password: string, username?: string): Promise<AuthResponse> {
  const response = await fetch(`${config.apiUrl}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, username }),
  });

  return handleResponse<AuthResponse>(response);
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${config.apiUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  return handleResponse<AuthResponse>(response);
}

export async function requestOTP(email: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${config.apiUrl}/api/auth/otp/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  return handleResponse<{ success: boolean; message: string }>(response);
}

export async function verifyOTP(email: string, code: string, username?: string): Promise<AuthResponse> {
  const response = await fetch(`${config.apiUrl}/api/auth/otp/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, code, username }),
  });

  return handleResponse<AuthResponse>(response);
}

export async function getMe(token: string): Promise<AuthResponse['user']> {
  const response = await fetch(`${config.apiUrl}/api/auth/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return handleResponse<AuthResponse['user']>(response);
}

export async function logout(token: string): Promise<void> {
  await fetch(`${config.apiUrl}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
}
