import { apiClient } from './client';
import { ApiResponse } from '@/types';

export interface Transaction {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  amount: string;
  currency: 'ARS' | 'USD';
  amountARS: string; // Amount converted to ARS
  exchangeRate: string; // Exchange rate used for conversion
  installments: string | null;
  formato: 'cuotas' | 'contado';
  source: 'csv' | 'pdf' | 'manual';
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
  formato?: 'cuotas' | 'contado' | 'ALL';
  source?: 'csv' | 'pdf' | 'manual' | 'ALL';
  seriesId?: string;
}

export interface CreateTransactionData {
  date: string;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  amount: number;
  currency?: 'ARS' | 'USD';
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
    if (filters.formato) params.append('formato', filters.formato);
    if (filters.source) params.append('source', filters.source);
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

// Match History types and functions
export interface Match extends Transaction {
  result: 'ganado' | 'perdido' | 'empatado';
}

export interface MatchHistoryStatistics {
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winPercentage: string;
  totalAmount: string;
}

export interface MatchHistoryResponse {
  matches: Match[];
  statistics: MatchHistoryStatistics;
}

export interface MatchHistoryFilters {
  result?: 'ganado' | 'perdido' | 'empatado' | 'ALL';
  dateFrom?: string;
  dateTo?: string;
}

export const getMatchHistory = async (
  filters?: MatchHistoryFilters
): Promise<MatchHistoryResponse> => {
  const params = new URLSearchParams();

  if (filters) {
    if (filters.result) params.append('result', filters.result);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
  }

  const response = await apiClient.get<ApiResponse<MatchHistoryResponse>>(
    `/transactions/match-history?${params.toString()}`
  );

  return response.data.data;
};
