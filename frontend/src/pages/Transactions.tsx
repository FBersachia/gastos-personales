import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  Transaction,
  TransactionFilters,
  CreateTransactionData,
} from '@/api/transactions.api';
import { getCategories } from '@/api/categories.api';
import { getPaymentMethods } from '@/api/paymentMethods.api';
import { recurringSeriesApi, RecurringSeriesDetail } from '@/api/recurringSeries.api';
import { Category, PaymentMethod } from '@/types';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

export default function Transactions() {
  const toast = useToast();

  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [recurringSeries, setRecurringSeries] = useState<RecurringSeriesDetail[]>([]);

  // Pagination & summary
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [summary, setSummary] = useState({ totalIncome: '0', totalExpense: '0', balance: '0' });

  // Loading & errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState<TransactionFilters>({ page: 1, limit: 25, type: 'ALL', sortBy: 'date', sortOrder: 'desc' });
  const [showFilters, setShowFilters] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateTransactionData>({
    date: new Date().toISOString().split('T')[0],
    type: 'EXPENSE',
    description: '',
    amount: 0,
    currency: 'ARS',
    categoryId: '',
    paymentMethodId: '',
    installments: null,
    seriesId: null,
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchInitialData = async () => {
    try {
      const [categoriesData, paymentMethodsData, seriesData] = await Promise.all([
        getCategories(),
        getPaymentMethods(),
        recurringSeriesApi.getAll(),
      ]);
      setCategories(categoriesData);
      setPaymentMethods(paymentMethodsData);
      setRecurringSeries(seriesData);
    } catch (err: any) {
      setError('Failed to load initial data');
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await getTransactions(filters);
      setTransactions(response.data);
      setPagination(response.pagination);
      setSummary(response.summary);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (transaction?: Transaction) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setFormData({
        date: transaction.date.split('T')[0],
        type: transaction.type,
        description: transaction.description,
        amount: parseFloat(transaction.amount),
        currency: transaction.currency || 'ARS',
        categoryId: transaction.categoryId,
        paymentMethodId: transaction.paymentId,
        installments: transaction.installments,
        seriesId: transaction.seriesId,
      });
    } else {
      setEditingTransaction(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'EXPENSE',
        description: '',
        amount: 0,
        currency: 'ARS',
        categoryId: categories[0]?.id || '',
        paymentMethodId: paymentMethods[0]?.id || '',
        installments: null,
        seriesId: null,
      });
    }
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.description.trim()) {
      setFormError('Description is required');
      return;
    }
    if (formData.amount <= 0) {
      setFormError('Amount must be positive');
      return;
    }
    if (!formData.categoryId) {
      setFormError('Category is required');
      return;
    }
    if (!formData.paymentMethodId) {
      setFormError('Payment method is required');
      return;
    }

    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, formData);
        console.log('Transaction updated, showing toast...');
        toast.success('Transaction updated successfully');
      } else {
        await createTransaction(formData);
        console.log('Transaction created, showing toast...');
        toast.success('Transaction created successfully');
      }
      await fetchTransactions();
      handleCloseModal();
    } catch (err: any) {
      console.error('Error saving transaction:', err);
      setFormError(err.response?.data?.error?.message || 'Failed to save transaction');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      toast.success('Transaction deleted successfully');
      await fetchTransactions();
      setDeleteConfirm(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete transaction');
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 25, type: 'ALL', sortBy: 'date', sortOrder: 'desc' });
  };

  const handleSort = (column: 'date' | 'type' | 'description' | 'amount' | 'category' | 'paymentMethod') => {
    const newSortOrder = filters.sortBy === column && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    setFilters({ ...filters, sortBy: column, sortOrder: newSortOrder, page: 1 });
  };

  const getSortIcon = (column: string) => {
    if (filters.sortBy !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return filters.sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-AR');
  };

  if (loading && transactions.length === 0) {
    return <LoadingSkeleton type="table" rows={8} />;
  }

  return (
    <div className="w-full p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            {showFilters ? 'Hide' : 'Show'} Filters
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Add Transaction
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm text-green-600 font-medium">Total Income</div>
          <div className="text-2xl font-bold text-green-700">{formatCurrency(summary.totalIncome)}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm text-red-600 font-medium">Total Expense</div>
          <div className="text-2xl font-bold text-red-700">{formatCurrency(summary.totalExpense)}</div>
        </div>
        <div className={`border rounded-lg p-4 ${parseFloat(summary.balance) >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <div className={`text-sm font-medium ${parseFloat(summary.balance) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Balance</div>
          <div className={`text-2xl font-bold ${parseFloat(summary.balance) >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{formatCurrency(summary.balance)}</div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.type || 'ALL'}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="ALL">All</option>
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                value={filters.paymentMethodIds?.[0] || ''}
                onChange={(e) => handleFilterChange('paymentMethodIds', e.target.value ? [e.target.value] : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Payment Methods</option>
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.categoryIds?.[0] || ''}
                onChange={(e) => handleFilterChange('categoryIds', e.target.value ? [e.target.value] : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Formato</label>
              <select
                value={filters.formato || 'ALL'}
                onChange={(e) => handleFilterChange('formato', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="ALL">All</option>
                <option value="contado">Contado</option>
                <option value="cuotas">Cuotas</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select
                value={filters.source || 'ALL'}
                onChange={(e) => handleFilterChange('source', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="ALL">All</option>
                <option value="manual">Manual</option>
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Transactions Table */}
      {transactions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No transactions yet</p>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Add Your First Transaction
          </button>
        </div>
      ) : (
        <>
          {/* Scroll hint for mobile */}
          <div className="mb-2 text-sm text-gray-500 md:hidden">
            👉 Desliza la tabla horizontalmente para ver más columnas
          </div>
          <div className="bg-white shadow-md rounded-lg overflow-x-auto mb-4 relative">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <button
                      onClick={() => handleSort('date')}
                      className="flex items-center gap-1 hover:text-gray-700 transition"
                    >
                      Date
                      {getSortIcon('date')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                    <button
                      onClick={() => handleSort('type')}
                      className="flex items-center gap-1 hover:text-gray-700 transition"
                    >
                      Type
                      {getSortIcon('type')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <button
                      onClick={() => handleSort('description')}
                      className="flex items-center gap-1 hover:text-gray-700 transition"
                    >
                      Description
                      {getSortIcon('description')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                    <button
                      onClick={() => handleSort('category')}
                      className="flex items-center gap-1 hover:text-gray-700 transition"
                    >
                      Category
                      {getSortIcon('category')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                    <button
                      onClick={() => handleSort('paymentMethod')}
                      className="flex items-center gap-1 hover:text-gray-700 transition"
                    >
                      Payment
                      {getSortIcon('paymentMethod')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase min-w-[150px]">
                    <button
                      onClick={() => handleSort('amount')}
                      className="flex items-center gap-1 hover:text-gray-700 transition ml-auto"
                    >
                      Amount
                      {getSortIcon('amount')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase hidden xl:table-cell">Installments</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase hidden xl:table-cell">Formato</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase hidden xl:table-cell">Source</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase sticky right-0 bg-gray-50">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        transaction.type === 'INCOME'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                      {transaction.category.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                      {transaction.paymentMethod.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 min-w-[150px]">
                      <div className="flex flex-col items-end">
                        <span className="flex items-center gap-1">
                          {transaction.currency === 'USD' && (
                            <span className="text-xs font-semibold text-blue-600 px-1.5 py-0.5 bg-blue-50 rounded">USD</span>
                          )}
                          {transaction.currency === 'USD' ? `$${parseFloat(transaction.amount).toFixed(2)}` : formatCurrency(transaction.amount)}
                        </span>
                        {transaction.currency === 'USD' && parseFloat(transaction.exchangeRate) > 1 && (
                          <span className="text-xs text-gray-500">
                            ≈ {formatCurrency(transaction.amountARS)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 hidden xl:table-cell">
                      {transaction.installments || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center hidden xl:table-cell">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        transaction.formato === 'cuotas'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {transaction.formato}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center hidden xl:table-cell">
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        transaction.source === 'manual'
                          ? 'bg-blue-100 text-blue-800'
                          : transaction.source === 'csv'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {transaction.source.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium sticky right-0 bg-white">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(transaction)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                          title="Edit transaction"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(transaction.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                          title="Delete transaction"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} transactions
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 bg-gray-100 rounded-lg">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <h2 className="text-2xl font-bold mb-4">
              {editingTransaction ? 'Edit Transaction' : 'New Transaction'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'INCOME' | 'EXPENSE' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., Groceries at supermarket"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency *</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'ARS' | 'USD' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Installments</label>
                  <input
                    type="text"
                    value={formData.installments || ''}
                    onChange={(e) => setFormData({ ...formData, installments: e.target.value || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., 1/12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
                  <select
                    value={formData.paymentMethodId}
                    onChange={(e) => setFormData({ ...formData, paymentMethodId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Select payment method</option>
                    {paymentMethods.map((pm) => (
                      <option key={pm.id} value={pm.id}>
                        {pm.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Recurring Series (Optional)</label>
                <select
                  value={formData.seriesId || ''}
                  onChange={(e) => setFormData({ ...formData, seriesId: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">None</option>
                  {recurringSeries.map((series) => (
                    <option key={series.id} value={series.id}>
                      {series.name} ({series.frequency})
                    </option>
                  ))}
                </select>
              </div>

              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {formError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editingTransaction ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Confirm Delete</h2>
            <p className="mb-6 text-gray-700">
              Are you sure you want to delete this transaction? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
