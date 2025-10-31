import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import {
  getExchangeRates,
  createExchangeRate,
  updateExchangeRate,
  deleteExchangeRate,
  ExchangeRate,
  CreateExchangeRateData,
} from '@/api/exchangeRates.api';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - 5 + i);

export default function ExchangeRates() {
  const toast = useToast();

  // Data state
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);

  // Loading & errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterYear, setFilterYear] = useState<number | undefined>(CURRENT_YEAR);
  const [filterMonth, setFilterMonth] = useState<number | undefined>(undefined);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateExchangeRateData>({
    month: new Date().getMonth() + 1,
    year: CURRENT_YEAR,
    currency: 'USD',
    rate: 0,
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchExchangeRates();
  }, [filterYear, filterMonth]);

  const fetchExchangeRates = async () => {
    try {
      setLoading(true);
      const data = await getExchangeRates({
        year: filterYear,
        month: filterMonth,
        currency: 'ALL',
      });
      setExchangeRates(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load exchange rates');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (rate?: ExchangeRate) => {
    if (rate) {
      setEditingRate(rate);
      setFormData({
        month: rate.month,
        year: rate.year,
        currency: rate.currency,
        rate: parseFloat(rate.rate),
      });
    } else {
      setEditingRate(null);
      setFormData({
        month: new Date().getMonth() + 1,
        year: CURRENT_YEAR,
        currency: 'USD',
        rate: 0,
      });
    }
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRate(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (formData.rate <= 0) {
      setFormError('Rate must be positive');
      return;
    }

    try {
      if (editingRate) {
        await updateExchangeRate(editingRate.id, { rate: formData.rate });
        toast.success('Exchange rate updated successfully');
      } else {
        await createExchangeRate(formData);
        toast.success('Exchange rate created successfully');
      }
      await fetchExchangeRates();
      handleCloseModal();
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to save exchange rate');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExchangeRate(id);
      toast.success('Exchange rate deleted successfully');
      await fetchExchangeRates();
      setDeleteConfirm(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete exchange rate');
    }
  };

  const formatRate = (rate: string) => {
    return `$${parseFloat(rate).toFixed(4)}`;
  };

  const getMonthName = (month: number) => {
    return MONTHS[month - 1];
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exchange Rates</h1>
          <p className="text-gray-600 mt-1">Manage USD to ARS exchange rates by month</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Add Exchange Rate
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <select
              value={filterYear || ''}
              onChange={(e) => setFilterYear(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Years</option>
              {YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
            <select
              value={filterMonth || ''}
              onChange={(e) => setFilterMonth(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Months</option>
              {MONTHS.map((month, index) => (
                <option key={index} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Exchange Rates Table */}
      {exchangeRates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No exchange rates yet</p>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Add Your First Exchange Rate
          </button>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Currency</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate (ARS)</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {exchangeRates.map((rate) => (
                <tr key={rate.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getMonthName(rate.month)} {rate.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                      {rate.currency}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                    {formatRate(rate.rate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex justify-center items-center gap-2">
                      <button
                        onClick={() => handleOpenModal(rate)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                        title="Edit exchange rate"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(rate.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                        title="Delete exchange rate"
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
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full p-6 my-8">
            <h2 className="text-2xl font-bold mb-4">
              {editingRate ? 'Edit Exchange Rate' : 'New Exchange Rate'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Month *</label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    disabled={!!editingRate}
                    required
                  >
                    {MONTHS.map((month, index) => (
                      <option key={index} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Year *</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    disabled={!!editingRate}
                    required
                  >
                    {YEARS.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency *</label>
                <select
                  value={formData.currency}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  disabled
                >
                  <option value="USD">USD</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Currently only USD is supported</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Rate (ARS per USD) *</label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.rate || ''}
                  onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., 1250.5000"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">How many ARS equals 1 USD</p>
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
                  {editingRate ? 'Update' : 'Create'}
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
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this exchange rate? This action cannot be undone.
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
