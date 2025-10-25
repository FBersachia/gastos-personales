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
  console.log('[API] Sending import request with', data.transactions.length, 'transactions');
  console.log('[API] Request payload size:', JSON.stringify(data).length, 'characters');
  console.log('[API] Target URL:', apiClient.defaults.baseURL + '/import/csv/confirm');
  console.log('[API] Request started at:', new Date().toISOString());

  try {
    const response = await apiClient.post('/import/csv/confirm', data, {
      timeout: 300000, // 5 minutes timeout for large imports
      onUploadProgress: (progressEvent) => {
        const percentCompleted = progressEvent.total
          ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
          : 0;
        console.log(`[API] Upload progress: ${percentCompleted}%`);
      },
    });

    console.log('[API] Import response received at:', new Date().toISOString());
    console.log('[API] Response status:', response.status);
    console.log('[API] Response data:', response.data);
    return response.data.data;
  } catch (error: any) {
    console.error('[API] Request failed at:', new Date().toISOString());
    console.error('[API] Error details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });
    throw error;
  }
};
