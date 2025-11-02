import { useState, useEffect, Fragment } from 'react';
import { getPendingInstallments, PendingInstallment } from '../api/installments.api';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

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

  // Helper function to extract base description (remove installment suffix like C.01/06, .01/06, etc.)
  const getBaseDescription = (description: string): string => {
    // Match patterns like: C.01/06, .01/06, 01/06, C01/06 at the end of description
    return description.replace(/[\s\.]*(C\.?\d+\/\d+|\d+\/\d+)$/i, '').trim();
  };

  // Group installments by base description + total installments only
  // We don't use amountPerInstallment because rounding differences can cause the same purchase to split
  // This ensures that the same purchase split across different months is grouped together
  const groupedInstallments = installments.reduce((groups, installment) => {
    const baseDescription = getBaseDescription(installment.description);
    const key = `${baseDescription}|${installment.totalInstallments}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(installment);
    return groups;
  }, {} as Record<string, PendingInstallment[]>);

  // Sort groups alphabetically by description (first part of key)
  const sortedGroupKeys = Object.keys(groupedInstallments).sort((a, b) => {
    const descA = a.split('|')[0];
    const descB = b.split('|')[0];
    return descA.localeCompare(descB);
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
    return <LoadingSkeleton type="table" rows={6} />;
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
            <p className="text-sm text-gray-600">Unique Installment Groups</p>
            <p className="text-2xl font-bold text-gray-900">{Object.keys(groupedInstallments).length}</p>
            <p className="text-xs text-gray-500 mt-1">{installments.length} total transactions</p>
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
                {sortedGroupKeys.map((groupKey, groupIndex) => {
                  const groupInstallments = groupedInstallments[groupKey];
                  const [description, totalInstallments] = groupKey.split('|');

                  // Calculate aggregated data for the group
                  const totalGroupPending = groupInstallments.reduce((sum, inst) => sum + inst.totalPending, 0);
                  const totalTransactions = groupInstallments.length;
                  // Use the average amount per installment from the group (to handle rounding differences)
                  const avgAmountPerInstallment = groupInstallments.reduce((sum, inst) => sum + inst.amountPerInstallment, 0) / groupInstallments.length;

                  return (
                    <Fragment key={`group-${groupKey}`}>
                      {/* Group Header */}
                      <tr className="bg-gray-100">
                        <td colSpan={8} className="px-6 py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="text-sm font-semibold text-gray-900">
                                {description}
                              </div>
                              <div className="text-xs text-gray-600">
                                {formatCurrency(avgAmountPerInstallment)} × {totalInstallments} installments
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-sm text-gray-600">
                                {totalTransactions} {totalTransactions === 1 ? 'transaction' : 'transactions'}
                              </div>
                              <div className="text-sm font-semibold text-red-600">
                                Total pending: {formatCurrency(totalGroupPending)}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                      {/* Group Items */}
                      {groupInstallments.map((installment) => {
                        const percentage = getCompletionPercentage(
                          installment.currentInstallment,
                          installment.totalInstallments
                        );
                        const statementDate = new Date(installment.date);
                        const monthYear = statementDate.toLocaleDateString('es-AR', {
                          month: 'short',
                          year: 'numeric'
                        });
                        return (
                          <tr key={installment.transactionId} className={getRowColorClass(percentage)}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500 pl-4">
                                Statement: {monthYear}
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
                    </Fragment>
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
