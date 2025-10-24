import { apiClient } from './client';

export interface RecurringSeries {
  id: string;
  name: string;
  frequency: string;
  transactionCount: number;
  lastTransaction: {
    date: string;
    amount: string;
  } | null;
  averageAmount: string;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringSeriesDetail {
  id: string;
  name: string;
  frequency: string;
  createdAt: string;
  updatedAt: string;
}

export interface SeriesTransaction {
  id: string;
  amount: string;
  date: string;
  description: string | null;
  type: 'INCOME' | 'EXPENSE';
  installments: string | null;
  category: {
    id: string;
    name: string;
  };
  paymentMethod: {
    id: string;
    name: string;
  };
  seriesId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SeriesTransactionsResponse {
  series: {
    id: string;
    name: string;
    frequency: string;
  };
  transactions: SeriesTransaction[];
  summary: {
    count: number;
    total: string;
    average: string;
  };
}

export interface CreateRecurringSeriesDto {
  name: string;
  frequency: string;
}

export interface UpdateRecurringSeriesDto {
  name?: string;
  frequency?: string;
}

export const recurringSeriesApi = {
  getAll: async (): Promise<RecurringSeries[]> => {
    const response = await apiClient.get('/recurring-series');
    return response.data.data;
  },

  getById: async (id: string): Promise<RecurringSeriesDetail> => {
    const response = await apiClient.get(`/recurring-series/${id}`);
    return response.data.data;
  },

  getTransactions: async (id: string): Promise<SeriesTransactionsResponse> => {
    const response = await apiClient.get(`/recurring-series/${id}/transactions`);
    return response.data.data;
  },

  create: async (data: CreateRecurringSeriesDto): Promise<RecurringSeriesDetail> => {
    const response = await apiClient.post('/recurring-series', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateRecurringSeriesDto): Promise<RecurringSeriesDetail> => {
    const response = await apiClient.put(`/recurring-series/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/recurring-series/${id}`);
  },
};
