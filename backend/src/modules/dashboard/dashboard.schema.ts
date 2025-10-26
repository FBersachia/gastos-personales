import { z } from 'zod';

// Dashboard Summary Response
export interface DashboardSummary {
  currentMonth: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    transactionCount: number;
  };
  previousMonth: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    transactionCount: number;
  };
  topCategories: Array<{
    categoryId: string;
    categoryName: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
  recentTransactions: Array<{
    id: string;
    date: Date;
    description: string;
    amount: number;
    type: string;
    category: {
      id: string;
      name: string;
    } | null;
    paymentMethod: {
      id: string;
      name: string;
    } | null;
  }>;
  pendingInstallments: {
    totalCount: number;
    totalAmount: number;
    items: Array<{
      transactionId: string;
      description: string;
      pendingInstallments: number;
      totalPending: number;
    }>;
  };
}
