import { apiClient } from './client';
import { ApiResponse, Category, MacroCategory } from '@/types';

// Categories
export const getCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get<ApiResponse<Category[]>>('/categories');
  return response.data.data;
};

export const getCategory = async (id: string): Promise<Category> => {
  const response = await apiClient.get<ApiResponse<Category>>(`/categories/${id}`);
  return response.data.data;
};

export const createCategory = async (data: {
  name: string;
  macroId?: string | null;
}): Promise<Category> => {
  const response = await apiClient.post<ApiResponse<Category>>('/categories', data);
  return response.data.data;
};

export const updateCategory = async (
  id: string,
  data: { name: string; macroId?: string | null }
): Promise<Category> => {
  const response = await apiClient.put<ApiResponse<Category>>(`/categories/${id}`, data);
  return response.data.data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  await apiClient.delete(`/categories/${id}`);
};

// Macro Categories
export const getMacroCategories = async (): Promise<MacroCategory[]> => {
  const response = await apiClient.get<ApiResponse<MacroCategory[]>>('/macro-categories');
  return response.data.data;
};

export const getMacroCategory = async (id: string): Promise<MacroCategory> => {
  const response = await apiClient.get<ApiResponse<MacroCategory>>(`/macro-categories/${id}`);
  return response.data.data;
};

export const createMacroCategory = async (data: { name: string }): Promise<MacroCategory> => {
  const response = await apiClient.post<ApiResponse<MacroCategory>>('/macro-categories', data);
  return response.data.data;
};

export const updateMacroCategory = async (
  id: string,
  data: { name: string }
): Promise<MacroCategory> => {
  const response = await apiClient.put<ApiResponse<MacroCategory>>(`/macro-categories/${id}`, data);
  return response.data.data;
};

export const deleteMacroCategory = async (id: string): Promise<void> => {
  await apiClient.delete(`/macro-categories/${id}`);
};
