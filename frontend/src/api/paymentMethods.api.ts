import { apiClient } from './client';
import { ApiResponse, PaymentMethod } from '@/types';

export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const response = await apiClient.get<ApiResponse<PaymentMethod[]>>('/payment-methods');
  return response.data.data;
};

export const getPaymentMethod = async (id: string): Promise<PaymentMethod> => {
  const response = await apiClient.get<ApiResponse<PaymentMethod>>(`/payment-methods/${id}`);
  return response.data.data;
};

export const createPaymentMethod = async (data: { name: string }): Promise<PaymentMethod> => {
  const response = await apiClient.post<ApiResponse<PaymentMethod>>('/payment-methods', data);
  return response.data.data;
};

export const updatePaymentMethod = async (
  id: string,
  data: { name: string }
): Promise<PaymentMethod> => {
  const response = await apiClient.put<ApiResponse<PaymentMethod>>(`/payment-methods/${id}`, data);
  return response.data.data;
};

export const deletePaymentMethod = async (id: string): Promise<void> => {
  await apiClient.delete(`/payment-methods/${id}`);
};
