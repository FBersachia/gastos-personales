import { apiClient } from './client';
import { ApiResponse } from '@/types';

export interface Transaction {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  amount: string;
  installments: string | null;
  userId: string;
  categoryId: string;
  paymentId: string;
  seriesId: string | null;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
  };
  paymentMethod: {
    id: string;
    name: string;
  };
  recurringSeries: {
    id: string;
    name: string;
    frequency: string;
  } | null;
}

export interface TransactionsResponse {
  data: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalIncome: string;
    totalExpense: string;
    balance: string;
  };
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  categoryIds?: string;
  paymentMethodIds?: string;
  type?: 'INCOME' | 'EXPENSE' | 'ALL';
  seriesId?: string;
}

export interface CreateTransactionData {
  date: string;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  amount: number;
  categoryId: string;
  paymentMethodId: string;
  installments?: string | null;
  seriesId?: string | null;
}

export const getTransactions = async (
  filters?: TransactionFilters
): Promise<TransactionsResponse> => {
  const params = new URLSearchParams();

  if (filters) {
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.categoryIds) params.append('categoryIds', filters.categoryIds);
    if (filters.paymentMethodIds) params.append('paymentMethodIds', filters.paymentMethodIds);
    if (filters.type) params.append('type', filters.type);
    if (filters.seriesId) params.append('seriesId', filters.seriesId);
  }

  const response = await apiClient.get<ApiResponse & TransactionsResponse>(
    `/transactions?${params.toString()}`
  );

  return {
    data: response.data.data,
    pagination: response.data.pagination!,
    summary: response.data.summary!,
  };
};

export const getTransaction = async (id: string): Promise<Transaction> => {
  const response = await apiClient.get<ApiResponse<Transaction>>(`/transactions/${id}`);
  return response.data.data;
};

export const createTransaction = async (data: CreateTransactionData): Promise<Transaction> => {
  const response = await apiClient.post<ApiResponse<Transaction>>('/transactions', data);
  return response.data.data;
};

export const updateTransaction = async (
  id: string,
  data: Partial<CreateTransactionData>
): Promise<Transaction> => {
  const response = await apiClient.put<ApiResponse<Transaction>>(`/transactions/${id}`, data);
  return response.data.data;
};

export const deleteTransaction = async (id: string): Promise<void> => {
  await apiClient.delete(`/transactions/${id}`);
};
