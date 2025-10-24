import { apiClient } from './client';
import { ApiResponse, AuthResponse, User } from '@/types';

export interface RegisterData {
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const authApi = {
  register: async (data: RegisterData): Promise<{ user: User }> => {
    const response = await apiClient.post<ApiResponse<{ user: User }>>(
      '/auth/register',
      data
    );
    return response.data.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};
