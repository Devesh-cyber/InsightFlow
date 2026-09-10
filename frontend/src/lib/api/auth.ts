import { apiClient } from './client';
import type { AuthCredentials, LoginResponse, RegisterResponse } from '../types/auth';

export async function registerUser(credentials: AuthCredentials): Promise<RegisterResponse> {
  const res = await apiClient.post<RegisterResponse>('/api/auth/register', credentials);
  return res.data;
}

export async function loginUser(credentials: AuthCredentials): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>('/api/auth/login', credentials);
  return res.data;
}
