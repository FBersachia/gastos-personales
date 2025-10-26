import { useState, useRef } from 'react';
import {
  previewPdf,
  confirmPdfImport,
  PdfPreviewResponse,
  PdfImportTransaction,
  ImportSummary,
} from '@/api/import.api';

export default function PdfImport() {
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview state
  const [preview, setPreview] = useState<PdfPreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Payment method selection (applies to all transactions)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');

  // Transaction category mappings
  const [categoryMappings, setCategoryMappings] = useState<Map<number, string>>(new Map());

  // Import result state
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);
  const [importing, setImporting] = useState(false);

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
    if (!file.name.endsWith('.pdf')) {
      setError('Please select a PDF file');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setPreview(null);
    setImportResult(null);
    setSelectedPaymentMethod('');
    setCategoryMappings(new Map());
  };

  // Upload and preview PDF
  const handlePreview = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await previewPdf(selectedFile);
      setPreview(result);

      // Initialize category mappings with suggested values
      const mappings = new Map<number, string>();
      result.preview.forEach((txn) => {
        mappings.set(txn.originalLine, txn.suggestedCategoryId || '');
      });
      setCategoryMappings(mappings);

      // Auto-select first payment method if available
      if (result.availablePaymentMethods.length > 0 && !selectedPaymentMethod) {
        setSelectedPaymentMethod(result.availablePaymentMethods[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to preview PDF');
    } finally {
      setLoading(false);
    }
  };

  // Update category for a transaction
  const updateCategory = (originalLine: number, categoryId: string) => {
    setCategoryMappings((prev) => {
      const newMappings = new Map(prev);
      newMappings.set(originalLine, categoryId);
      return newMappings;
    });
  };

  // Confirm import
  const handleConfirmImport = async () => {
    if (!preview) return;

    if (!selectedPaymentMethod) {
      setError('Please select a payment method');
      return;
    }

    console.log('Starting PDF import...');
    setImporting(true);
    setError(null);

    try {
      // Validate all transactions have categories
      console.log('Validating transactions...');
      const transactions: PdfImportTransaction[] = preview.preview.map((txn) => {
        const categoryId = categoryMappings.get(txn.originalLine);
        if (!categoryId) {
          console.error(`Validation failed for line ${txn.originalLine}: no category`);
          throw new Error(`Line ${txn.originalLine}: Please select a category`);
        }

        return {
          date: txn.date,
          description: txn.description,
          amount: txn.amount,
          categoryId,
          installments: txn.installments || undefined,
        };
      });

      console.log(`Sending ${transactions.length} transactions to API...`);
      const result = await confirmPdfImport({
        bank: preview.bank,
        paymentMethodId: selectedPaymentMethod,
        transactions,
      });
      console.log('Import successful:', result);
      setImportResult(result);
      setPreview(null);
      setSelectedFile(null);
      setSelectedPaymentMethod('');
      setCategoryMappings(new Map());
    } catch (err: any) {
      console.error('Import error:', err);
      const errorMessage = err.message || err.response?.data?.error || 'Failed to import transactions';
      setError(errorMessage);
    } finally {
      setImporting(false);
    }
  };

  // Reset and start over
  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    setImportResult(null);
    setSelectedPaymentMethod('');
    setCategoryMappings(new Map());
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Import PDF Bank Statement</h1>

      {/* File Upload Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">1. Upload PDF File</h2>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
            id="pdf-upload"
          />

          {selectedFile ? (
            <div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                📄 {selectedFile.name}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                onClick={() => {
                  handleReset();
                }}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Choose different file
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">
                Drag and drop your PDF bank statement here
              </p>
              <p className="text-sm text-gray-500 mb-4">or</p>
              <label
                htmlFor="pdf-upload"
                className="cursor-pointer bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 inline-block"
              >
                Browse Files
              </label>
              <p className="text-xs text-gray-500 mt-4">
                Supported banks: Santander, Galicia, Amex
              </p>
            </div>
          )}
        </div>

        {selectedFile && !preview && (
          <div className="mt-4">
            <button
              onClick={handlePreview}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Processing PDF...' : 'Preview Transactions'}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Preview Section */}
      {preview && (
        <>
          {/* Bank Detection & Summary */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">2. Bank Detected & Summary</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-sm text-gray-600">Detected Bank</p>
                <p className="text-2xl font-bold text-blue-600">{preview.bank}</p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-green-600">{preview.summary.totalRecords}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <p className="text-sm text-gray-600">Will Import</p>
                <p className="text-2xl font-bold text-purple-600">{preview.summary.willImport}</p>
              </div>
            </div>

            {/* Warnings */}
            {preview.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-3 rounded">
                <p className="font-semibold mb-2">⚠️ Warnings:</p>
                <ul className="list-disc list-inside">
                  {preview.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">3. Select Payment Method</h2>
            <p className="text-sm text-gray-600 mb-4">
              This payment method will be applied to all transactions in this PDF
            </p>

            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Select Payment Method --</option>
              {preview.availablePaymentMethods.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.name}
                </option>
              ))}
            </select>
          </div>

          {/* Transaction Preview Table */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">4. Review & Map Categories</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Installments
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.preview.map((txn) => (
                    <tr key={txn.originalLine} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {new Date(txn.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {txn.description}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-red-600">
                        ${txn.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {txn.installments || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={categoryMappings.get(txn.originalLine) || ''}
                          onChange={(e) => updateCategory(txn.originalLine, e.target.value)}
                          className={`w-full px-2 py-1 border rounded text-sm ${
                            categoryMappings.get(txn.originalLine)
                              ? 'border-green-300 bg-green-50'
                              : 'border-red-300 bg-red-50'
                          }`}
                        >
                          <option value="">-- Select Category --</option>
                          {preview.availableCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name} {cat.macroCategory ? `(${cat.macroCategory})` : ''}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Import Button */}
          <div className="bg-white rounded-lg shadow p-6">
            <button
              onClick={handleConfirmImport}
              disabled={importing || !selectedPaymentMethod}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-lg"
            >
              {importing ? 'Importing...' : `Import ${preview.summary.willImport} Transactions`}
            </button>
          </div>
        </>
      )}

      {/* Import Result */}
      {importResult && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">✅ Import Complete</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 p-4 rounded">
              <p className="text-sm text-gray-600">Successfully Imported</p>
              <p className="text-3xl font-bold text-green-600">{importResult.imported}</p>
            </div>
            <div className="bg-red-50 p-4 rounded">
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-3xl font-bold text-red-600">{importResult.failed}</p>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded mb-4">
              <p className="font-semibold mb-2">Errors:</p>
              <ul className="list-disc list-inside text-sm">
                {importResult.errors.map((err, index) => (
                  <li key={index}>
                    Row {err.row}: {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleReset}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
          >
            Import Another PDF
          </button>
        </div>
      )}
    </div>
  );
}
