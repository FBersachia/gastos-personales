import { useState, useRef, useEffect } from 'react';
import {
  previewCsv,
  confirmImport,
  PreviewTransaction,
  PreviewResponse,
  CsvFilters,
  ImportTransaction,
  ImportSummary,
} from '@/api/import.api';
import { getPaymentMethods } from '@/api/paymentMethods.api';

export default function CsvImport() {
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview state
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [filters, setFilters] = useState<CsvFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<Array<{ id: string; name: string }>>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Preview table sorting state
  type SortColumn = 'date' | 'type' | 'description' | 'amount' | 'category' | 'paymentMethod';
  const [previewSortColumn, setPreviewSortColumn] = useState<SortColumn | null>(null);
  const [previewSortOrder, setPreviewSortOrder] = useState<'asc' | 'desc'>('asc');

  // Import mapping state (for manual adjustments)
  const [transactionMappings, setTransactionMappings] = useState<Map<number, { categoryId: string; paymentMethodId: string }>>(new Map());

  // Import result state
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);
  const [importing, setImporting] = useState(false);

  // Load payment methods on mount
  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        const methods = await getPaymentMethods();
        setAvailablePaymentMethods(methods);
      } catch (err) {
        console.error('Failed to load payment methods:', err);
      }
    };
    loadPaymentMethods();
  }, []);

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Process file
  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setPreview(null);
    setImportResult(null);
  };

  // Upload and preview CSV
  const handlePreview = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await previewCsv(selectedFile, filters);
      setPreview(result);

      // Initialize mappings with suggested values
      const mappings = new Map<number, { categoryId: string; paymentMethodId: string }>();
      result.preview.forEach((txn) => {
        mappings.set(txn.originalRow, {
          categoryId: txn.suggestedCategoryId || '',
          paymentMethodId: txn.suggestedPaymentMethodId || '',
        });
      });
      setTransactionMappings(mappings);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to preview CSV');
    } finally {
      setLoading(false);
    }
  };

  // Update mapping for a transaction
  const updateMapping = (originalRow: number, field: 'categoryId' | 'paymentMethodId', value: string) => {
    setTransactionMappings((prev) => {
      const newMappings = new Map(prev);
      const current = newMappings.get(originalRow) || { categoryId: '', paymentMethodId: '' };
      newMappings.set(originalRow, { ...current, [field]: value });
      return newMappings;
    });
  };

  // Confirm import
  const handleConfirmImport = async () => {
    if (!preview) return;

    console.log('Starting import...');
    setImporting(true);
    setError(null);

    try {
      // Validate all transactions have required fields
      console.log('Validating transactions...');
      const transactions: ImportTransaction[] = preview.preview.map((txn) => {
        const mapping = transactionMappings.get(txn.originalRow);
        if (!mapping || !mapping.categoryId || !mapping.paymentMethodId) {
          console.error(`Validation failed for row ${txn.originalRow}:`, mapping);
          throw new Error(`Row ${txn.originalRow}: Please select category and payment method`);
        }

        return {
          date: txn.date,
          type: txn.type,
          description: txn.description,
          amount: txn.amount,
          categoryId: mapping.categoryId,
          paymentMethodId: mapping.paymentMethodId,
          installments: txn.installments || undefined,
        };
      });

      console.log(`Sending ${transactions.length} transactions to API...`);
      const result = await confirmImport({ transactions });
      console.log('Import successful:', result);
      setImportResult(result);
      setPreview(null);
      setSelectedFile(null);
      setTransactionMappings(new Map());
    } catch (err: any) {
      console.error('Import error:', err);
      const errorMessage = err.message || err.response?.data?.error || 'Failed to import transactions';
      console.log('Setting error message:', errorMessage);
      setError(errorMessage);
    } finally {
      console.log('Import finished, setting importing to false');
      setImporting(false);
    }
  };

  // Apply filters
  const handleApplyFilters = () => {
    handlePreview();
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({});
    setPreview(null);
  };

  // Handle preview table sorting
  const handlePreviewSort = (column: SortColumn) => {
    if (previewSortColumn === column) {
      // Toggle sort order if same column
      setPreviewSortOrder(previewSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to asc
      setPreviewSortColumn(column);
      setPreviewSortOrder('asc');
    }
  };

  // Get sorted preview data
  const getSortedPreview = () => {
    if (!preview || !previewSortColumn) {
      return preview?.preview || [];
    }

    const sorted = [...preview.preview].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (previewSortColumn) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'description':
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'paymentMethod':
          aValue = a.detectedPaymentMethod.toLowerCase();
          bValue = b.detectedPaymentMethod.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return previewSortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return previewSortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  };

  // Reset everything
  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setFilters({});
    setTransactionMappings(new Map());
    setImportResult(null);
    setError(null);
    setPreviewSortColumn(null);
    setPreviewSortOrder('asc');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Import CSV</h1>

      {/* File Upload Area */}
      {!preview && !importResult && (
        <div className="mb-8">
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex flex-col items-center">
              <svg
                className="w-16 h-16 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-lg font-medium text-gray-700 mb-2">
                {selectedFile ? selectedFile.name : 'Drop CSV file here or click to browse'}
              </p>
              <p className="text-sm text-gray-500">
                Maximum file size: 10MB
              </p>
            </div>
          </div>

          {selectedFile && (
            <div className="mt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Selected file:</strong> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              </div>

              <button
                onClick={handlePreview}
                disabled={loading}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Loading Preview...' : 'Preview CSV'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Filters - Show when file is selected */}
      {selectedFile && !importResult && (
        <div className="mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-blue-600 hover:text-blue-800 mb-4 text-sm font-medium"
          >
            {showFilters ? '▼' : '▶'} {showFilters ? 'Hide' : 'Show'} Filters
          </button>

          {showFilters && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date From
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date To
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Payment Methods
                  </label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setSortOrder('asc')}
                      className={`px-2 py-1 text-xs rounded ${
                        sortOrder === 'asc'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                      title="Sort A-Z"
                    >
                      A-Z
                    </button>
                    <button
                      onClick={() => setSortOrder('desc')}
                      className={`px-2 py-1 text-xs rounded ${
                        sortOrder === 'desc'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                      title="Sort Z-A"
                    >
                      Z-A
                    </button>
                  </div>
                </div>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2 bg-white">
                  {availablePaymentMethods.length === 0 ? (
                    <p className="text-sm text-gray-500">No payment methods available</p>
                  ) : (
                    <div className="space-y-2">
                      {[...availablePaymentMethods]
                        .sort((a, b) => {
                          if (sortOrder === 'asc') {
                            return a.name.localeCompare(b.name);
                          } else {
                            return b.name.localeCompare(a.name);
                          }
                        })
                        .map((pm) => (
                          <label key={pm.id} className="flex items-center hover:bg-gray-50 p-1 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.paymentMethods?.includes(pm.name) || false}
                              onChange={(e) => {
                                const currentMethods = filters.paymentMethods || [];
                                const newMethods = e.target.checked
                                  ? [...currentMethods, pm.name]
                                  : currentMethods.filter((name) => name !== pm.name);
                                setFilters({ ...filters, paymentMethods: newMethods.length > 0 ? newMethods : undefined });
                              }}
                              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">{pm.name}</span>
                          </label>
                        ))}
                    </div>
                  )}
                </div>
                {filters.paymentMethods && filters.paymentMethods.length > 0 && (
                  <p className="text-xs text-gray-600 mt-1">
                    {filters.paymentMethods.length} payment method(s) selected
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleApplyFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Apply Filters
                </button>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Preview Table */}
      {preview && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold">Preview ({preview.summary.filteredRecords} records)</h2>
              <p className="text-sm text-gray-600">
                Total: {preview.summary.totalRecords} | Filtered: {preview.summary.filteredRecords}
              </p>
            </div>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>

          {/* Warnings */}
          {preview.warnings.length > 0 && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="font-medium text-yellow-800 mb-2">Warnings:</p>
              <ul className="list-disc list-inside text-sm text-yellow-700">
                {preview.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview Table */}
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <div className="flex items-center gap-2">
                      Date
                      <div className="flex flex-col">
                        <button
                          onClick={() => handlePreviewSort('date')}
                          className={`px-1 py-0.5 text-[10px] rounded ${
                            previewSortColumn === 'date' && previewSortOrder === 'asc'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          title="Sort ascending"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => { setPreviewSortColumn('date'); setPreviewSortOrder('desc'); }}
                          className={`px-1 py-0.5 text-[10px] rounded ${
                            previewSortColumn === 'date' && previewSortOrder === 'desc'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          title="Sort descending"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <div className="flex items-center gap-2">
                      Type
                      <div className="flex flex-col">
                        <button
                          onClick={() => handlePreviewSort('type')}
                          className={`px-1 py-0.5 text-[10px] rounded ${
                            previewSortColumn === 'type' && previewSortOrder === 'asc'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          title="Sort ascending"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => { setPreviewSortColumn('type'); setPreviewSortOrder('desc'); }}
                          className={`px-1 py-0.5 text-[10px] rounded ${
                            previewSortColumn === 'type' && previewSortOrder === 'desc'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          title="Sort descending"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <div className="flex items-center gap-2">
                      Description
                      <div className="flex flex-col">
                        <button
                          onClick={() => handlePreviewSort('description')}
                          className={`px-1 py-0.5 text-[10px] rounded ${
                            previewSortColumn === 'description' && previewSortOrder === 'asc'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          title="Sort ascending"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => { setPreviewSortColumn('description'); setPreviewSortOrder('desc'); }}
                          className={`px-1 py-0.5 text-[10px] rounded ${
                            previewSortColumn === 'description' && previewSortOrder === 'desc'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          title="Sort descending"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <div className="flex items-center gap-2">
                      Amount
                      <div className="flex flex-col">
                        <button
                          onClick={() => handlePreviewSort('amount')}
                          className={`px-1 py-0.5 text-[10px] rounded ${
                            previewSortColumn === 'amount' && previewSortOrder === 'asc'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          title="Sort ascending"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => { setPreviewSortColumn('amount'); setPreviewSortOrder('desc'); }}
                          className={`px-1 py-0.5 text-[10px] rounded ${
                            previewSortColumn === 'amount' && previewSortOrder === 'desc'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          title="Sort descending"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <div className="flex items-center gap-2">
                      Category
                      <div className="flex flex-col">
                        <button
                          onClick={() => handlePreviewSort('category')}
                          className={`px-1 py-0.5 text-[10px] rounded ${
                            previewSortColumn === 'category' && previewSortOrder === 'asc'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          title="Sort ascending"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => { setPreviewSortColumn('category'); setPreviewSortOrder('desc'); }}
                          className={`px-1 py-0.5 text-[10px] rounded ${
                            previewSortColumn === 'category' && previewSortOrder === 'desc'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          title="Sort descending"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <div className="flex items-center gap-2">
                      Payment Method
                      <div className="flex flex-col">
                        <button
                          onClick={() => handlePreviewSort('paymentMethod')}
                          className={`px-1 py-0.5 text-[10px] rounded ${
                            previewSortColumn === 'paymentMethod' && previewSortOrder === 'asc'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          title="Sort ascending"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => { setPreviewSortColumn('paymentMethod'); setPreviewSortOrder('desc'); }}
                          className={`px-1 py-0.5 text-[10px] rounded ${
                            previewSortColumn === 'paymentMethod' && previewSortOrder === 'desc'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          title="Sort descending"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Installments</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getSortedPreview().map((txn) => {
                  const mapping = transactionMappings.get(txn.originalRow);
                  return (
                    <tr key={txn.originalRow} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{txn.originalRow}</td>
                      <td className="px-4 py-3 text-sm">{new Date(txn.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full ${txn.type === 'INCOME' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {txn.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{txn.description}</td>
                      <td className="px-4 py-3 text-sm font-medium">${txn.amount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm">
                        <select
                          value={mapping?.categoryId || ''}
                          onChange={(e) => updateMapping(txn.originalRow, 'categoryId', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="">Select...</option>
                          {preview.availableCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name} ({cat.macroCategory})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <select
                            value={mapping?.paymentMethodId || ''}
                            onChange={(e) => updateMapping(txn.originalRow, 'paymentMethodId', e.target.value)}
                            className={`w-full px-2 py-1 border rounded text-sm ${
                              txn.suggestedPaymentMethodId && mapping?.paymentMethodId === txn.suggestedPaymentMethodId
                                ? 'border-green-500 bg-green-50'
                                : mapping?.paymentMethodId
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300'
                            }`}
                          >
                            <option value="">Select...</option>
                            {preview.availablePaymentMethods.map((pm) => (
                              <option key={pm.id} value={pm.id}>
                                {pm.name}
                              </option>
                            ))}
                          </select>
                          {txn.suggestedPaymentMethodId && mapping?.paymentMethodId === txn.suggestedPaymentMethodId && (
                            <span className="text-green-600 text-xs" title="Auto-matched">✓</span>
                          )}
                          {txn.detectedPaymentMethod && !txn.suggestedPaymentMethodId && (
                            <span className="text-orange-600 text-xs" title={`Detected: ${txn.detectedPaymentMethod}`}>⚠</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{txn.installments || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Import Button */}
          <div className="mt-6">
            <button
              onClick={handleConfirmImport}
              disabled={importing}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-lg"
            >
              {importing ? 'Importing...' : `Import ${preview.summary.filteredRecords} Transactions`}
            </button>
          </div>
        </div>
      )}

      {/* Import Result */}
      {importResult && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Import Complete</h2>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-600 mb-1">Successfully Imported</p>
              <p className="text-3xl font-bold text-green-700">{importResult.imported}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600 mb-1">Failed</p>
              <p className="text-3xl font-bold text-red-700">{importResult.failed}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-600 mb-1">New Categories Created</p>
              <p className="text-3xl font-bold text-blue-700">{importResult.newCategoriesCreated}</p>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-medium text-red-800 mb-2">Errors:</p>
              <ul className="list-disc list-inside text-sm text-red-700">
                {importResult.errors.map((err, idx) => (
                  <li key={idx}>
                    Row {err.row}: {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleReset}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Import Another File
          </button>
        </div>
      )}
    </div>
  );
}
