import { apiClient } from './client';
import { TransactionType } from './transactions.api';

export interface PreviewTransaction {
  date: string;
  type: TransactionType;
  description: string;
  amount: number;
  category: string;
  detectedPaymentMethod: string | null;
  installments: string | null;
  originalRow: number;
  suggestedPaymentMethodId: string | null;
  suggestedCategoryId: string | null;
}

export interface PreviewResponse {
  preview: PreviewTransaction[];
  summary: {
    totalRecords: number;
    filteredRecords: number;
    willImport: number;
  };
  warnings: string[];
  availablePaymentMethods: Array<{ id: string; name: string }>;
  availableCategories: Array<{ id: string; name: string; macroCategory: string }>;
}

export interface CsvFilters {
  dateFrom?: string;
  dateTo?: string;
  paymentMethods?: string[];
}

export interface ImportTransaction {
  date: string;
  type: TransactionType;
  description: string;
  amount: number;
  categoryId: string;
  paymentMethodId: string;
  installments?: string;
  recurringSeriesId?: string;
}

export interface ImportConfirmRequest {
  transactions: ImportTransaction[];
  createMissingCategories?: boolean;
}

export interface ImportSummary {
  imported: number;
  failed: number;
  newCategoriesCreated: number;
  errors: Array<{ row: number; message: string }>;
}

/**
 * Upload and preview CSV file
 */
export const previewCsv = async (
  file: File,
  filters?: CsvFilters
): Promise<PreviewResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  if (filters) {
    formData.append('filters', JSON.stringify(filters));
  }

  const response = await apiClient.post('/import/csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data;
};

/**
 * Confirm and execute import
 */
export const confirmImport = async (
  data: ImportConfirmRequest
): Promise<ImportSummary> => {
  const response = await apiClient.post('/import/csv/confirm', data);
  return response.data.data;
};
