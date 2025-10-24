import { apiClient } from './client';

export interface PendingInstallment {
  transactionId: string;
  description: string;
  date: string;
  paymentMethod: {
    id: string;
    name: string;
  };
  currentInstallment: number;
  totalInstallments: number;
  pendingInstallments: number;
  totalAmount: number;
  amountPerInstallment: number;
  totalPending: number;
  estimatedEndDate: string;
}

export interface GetPendingInstallmentsResponse {
  installments: PendingInstallment[];
  totalPending: number;
  count: number;
}

export const getPendingInstallments = async (
  sortBy?: 'pending' | 'amount' | 'date',
  order?: 'asc' | 'desc'
): Promise<GetPendingInstallmentsResponse> => {
  const params = new URLSearchParams();
  if (sortBy) params.append('sortBy', sortBy);
  if (order) params.append('order', order);

  const response = await apiClient.get(`/installments/pending?${params.toString()}`);
  return response.data.data;
};
