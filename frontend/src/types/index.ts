export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any[];
  };
}

export interface Transaction {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  amount: string;
  installments?: string | null;
  userId: string;
  categoryId: string;
  paymentId: string;
  seriesId?: string | null;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  paymentMethod?: PaymentMethod;
  recurringSeries?: RecurringSeries;
}

export interface Category {
  id: string;
  name: string;
  userId: string;
  macroId?: string | null;
  createdAt: string;
  updatedAt: string;
  macroCategory?: MacroCategory;
}

export interface MacroCategory {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringSeries {
  id: string;
  name: string;
  frequency: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
