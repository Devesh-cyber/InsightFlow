import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// v2 Injection: Automatically attach Supabase JWT token to requests if it exists[cite: 6]
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('supabase_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Keep your existing v1 response error handler[cite: 6]
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);