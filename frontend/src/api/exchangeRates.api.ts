import { apiClient } from './client';
import { ApiResponse } from '@/types';

export interface ExchangeRate {
  id: string;
  month: number;
  year: number;
  currency: 'USD';
  rate: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExchangeRateData {
  month: number;
  year: number;
  currency: 'USD';
  rate: number;
}

export interface UpdateExchangeRateData {
  rate: number;
}

export interface ExchangeRateFilters {
  year?: number;
  month?: number;
  currency?: 'USD' | 'ALL';
}

export const getExchangeRates = async (
  filters?: ExchangeRateFilters
): Promise<ExchangeRate[]> => {
  const params = new URLSearchParams();

  if (filters) {
    if (filters.year) params.append('year', filters.year.toString());
    if (filters.month) params.append('month', filters.month.toString());
    if (filters.currency) params.append('currency', filters.currency);
  }

  const response = await apiClient.get<ApiResponse<ExchangeRate[]>>(
    `/exchange-rates?${params.toString()}`
  );

  return response.data.data;
};

export const getExchangeRate = async (id: string): Promise<ExchangeRate> => {
  const response = await apiClient.get<ApiResponse<ExchangeRate>>(`/exchange-rates/${id}`);
  return response.data.data;
};

export const createExchangeRate = async (data: CreateExchangeRateData): Promise<ExchangeRate> => {
  const response = await apiClient.post<ApiResponse<ExchangeRate>>('/exchange-rates', data);
  return response.data.data;
};

export const updateExchangeRate = async (
  id: string,
  data: UpdateExchangeRateData
): Promise<ExchangeRate> => {
  const response = await apiClient.put<ApiResponse<ExchangeRate>>(`/exchange-rates/${id}`, data);
  return response.data.data;
};

export const deleteExchangeRate = async (id: string): Promise<void> => {
  await apiClient.delete(`/exchange-rates/${id}`);
};
