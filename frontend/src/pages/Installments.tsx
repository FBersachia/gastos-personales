import { useState, useEffect } from 'react';
import { getPendingInstallments, PendingInstallment } from '../api/installments.api';

export default function Installments() {
  const [installments, setInstallments] = useState<PendingInstallment[]>([]);
  const [totalPending, setTotalPending] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'pending' | 'amount' | 'date'>('pending');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchInstallments();
  }, [sortBy, order]);

  const fetchInstallments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPendingInstallments(sortBy, order);
      setInstallments(data.installments);
      setTotalPending(data.totalPending);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load installments');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getCompletionPercentage = (current: number, total: number) => {
    return Math.round((current / total) * 100);
  };

  const getRowColorClass = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-50';
    if (percentage >= 50) return 'bg-yellow-50';
    return 'bg-white';
  };

  const handleSortChange = (newSortBy: 'pending' | 'amount' | 'date') => {
    if (sortBy === newSortBy) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setOrder('desc');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Pending Installments</h1>
        <p className="text-gray-600 mt-2">Track your ongoing payment installments</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Summary Card */}
      <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Total Pending Amount</h2>
            <p className="text-3xl font-bold text-blue-600 mt-2">{formatCurrency(totalPending)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Active Installments</p>
            <p className="text-2xl font-bold text-gray-900">{installments.length}</p>
          </div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => handleSortChange('pending')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            sortBy === 'pending'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Sort by Pending Count {sortBy === 'pending' && (order === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleSortChange('amount')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            sortBy === 'amount'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Sort by Amount {sortBy === 'amount' && (order === 'asc' ? '↑' : '↓')}
        </button>
        <button
          onClick={() => handleSortChange('date')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            sortBy === 'date'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Sort by Date {sortBy === 'date' && (order === 'asc' ? '↑' : '↓')}
        </button>
      </div>

      {/* Installments Table */}
      {installments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No pending installments</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have any transactions with pending installments at the moment.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pending
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount/Installment
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Pending
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Est. End Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {installments.map((installment) => {
                  const percentage = getCompletionPercentage(
                    installment.currentInstallment,
                    installment.totalInstallments
                  );
                  return (
                    <tr key={installment.transactionId} className={getRowColorClass(percentage)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {installment.description}
                        </div>
                        <div className="text-sm text-gray-500">
                          Total: {formatCurrency(installment.totalAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{installment.paymentMethod.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(installment.date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="text-sm text-gray-900">
                            {installment.currentInstallment}/{installment.totalInstallments}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                percentage >= 80
                                  ? 'bg-green-500'
                                  : percentage >= 50
                                  ? 'bg-yellow-500'
                                  : 'bg-blue-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500">{percentage}% paid</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                          {installment.pendingInstallments} remaining
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(installment.amountPerInstallment)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-red-600">
                          {formatCurrency(installment.totalPending)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(installment.estimatedEndDate)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Legend */}
      {installments.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Color Legend:</h3>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
              <span className="text-gray-600">80%+ paid (near completion)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-50 border border-yellow-200 rounded"></div>
              <span className="text-gray-600">50-79% paid</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border border-gray-200 rounded"></div>
              <span className="text-gray-600">Less than 50% paid</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
