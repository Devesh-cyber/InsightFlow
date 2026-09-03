import { apiClient } from './client';

export interface AuthPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  email?: string; // Optional if backend returns it directly, or fallback to payload
}

export const registerUser = async (payload: AuthPayload) => {
  const response = await apiClient.post('/api/auth/register', payload);
  return response.data;
};

export const loginUser = async (payload: AuthPayload): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/api/auth/login', payload);
  if (response.data.access_token) {
    // Store token in localStorage so client.ts interceptor can pick it up
    localStorage.setItem('supabase_access_token', response.data.access_token);
    
    // Store user email for the sidebar display
    const userEmail = response.data.email || payload.email;
    localStorage.setItem('supabase_user_email', userEmail);
  }
  return response.data;
};

export const logoutUser = () => {
  localStorage.removeItem('supabase_access_token');
  localStorage.removeItem('supabase_user_email');
};