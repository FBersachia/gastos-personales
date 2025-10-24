import { useState, useEffect } from 'react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMacroCategories,
  createMacroCategory,
  updateMacroCategory,
  deleteMacroCategory
} from '@/api/categories.api';
import { Category, MacroCategory } from '@/types';

export default function Categories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [macroCategories, setMacroCategories] = useState<MacroCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Category modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryFormName, setCategoryFormName] = useState('');
  const [categoryFormMacroId, setCategoryFormMacroId] = useState<string>('');
  const [categoryFormError, setCategoryFormError] = useState<string | null>(null);
  const [categoryDeleteConfirm, setCategoryDeleteConfirm] = useState<string | null>(null);

  // Macro category modal state
  const [isMacroModalOpen, setIsMacroModalOpen] = useState(false);
  const [editingMacro, setEditingMacro] = useState<MacroCategory | null>(null);
  const [macroFormName, setMacroFormName] = useState('');
  const [macroFormError, setMacroFormError] = useState<string | null>(null);
  const [macroDeleteConfirm, setMacroDeleteConfirm] = useState<string | null>(null);

  // Filter state
  const [filterMacroId, setFilterMacroId] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesData, macrosData] = await Promise.all([
        getCategories(),
        getMacroCategories()
      ]);
      setCategories(categoriesData);
      setMacroCategories(macrosData);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Category handlers
  const handleOpenCategoryModal = (category?: any) => {
    if (category) {
      setEditingCategory(category);
      setCategoryFormName(category.name);
      setCategoryFormMacroId(category.macroCategory?.id || '');
    } else {
      setEditingCategory(null);
      setCategoryFormName('');
      setCategoryFormMacroId('');
    }
    setCategoryFormError(null);
    setIsCategoryModalOpen(true);
  };

  const handleCloseCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
    setCategoryFormName('');
    setCategoryFormMacroId('');
    setCategoryFormError(null);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryFormError(null);

    if (!categoryFormName.trim()) {
      setCategoryFormError('Name is required');
      return;
    }

    try {
      const data = {
        name: categoryFormName.trim(),
        macroId: categoryFormMacroId || null
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
      } else {
        await createCategory(data);
      }
      await fetchData();
      handleCloseCategoryModal();
    } catch (err: any) {
      setCategoryFormError(err.response?.data?.error?.message || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      await fetchData();
      setCategoryDeleteConfirm(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete category');
    }
  };

  // Macro category handlers
  const handleOpenMacroModal = (macro?: MacroCategory) => {
    if (macro) {
      setEditingMacro(macro);
      setMacroFormName(macro.name);
    } else {
      setEditingMacro(null);
      setMacroFormName('');
    }
    setMacroFormError(null);
    setIsMacroModalOpen(true);
  };

  const handleCloseMacroModal = () => {
    setIsMacroModalOpen(false);
    setEditingMacro(null);
    setMacroFormName('');
    setMacroFormError(null);
  };

  const handleMacroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMacroFormError(null);

    if (!macroFormName.trim()) {
      setMacroFormError('Name is required');
      return;
    }

    try {
      if (editingMacro) {
        await updateMacroCategory(editingMacro.id, { name: macroFormName.trim() });
      } else {
        await createMacroCategory({ name: macroFormName.trim() });
      }
      await fetchData();
      handleCloseMacroModal();
    } catch (err: any) {
      setMacroFormError(err.response?.data?.error?.message || 'Failed to save macro category');
    }
  };

  const handleDeleteMacro = async (id: string) => {
    try {
      await deleteMacroCategory(id);
      await fetchData();
      setMacroDeleteConfirm(null);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete macro category');
    }
  };

  // Filter categories
  const filteredCategories = filterMacroId === 'all'
    ? categories
    : categories.filter(c => c.macroCategory?.id === filterMacroId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
        <div className="flex gap-3">
          <button
            onClick={() => handleOpenMacroModal()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Add Macro Category
          </button>
          <button
            onClick={() => handleOpenCategoryModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Add Category
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Macro Categories Section */}
      <div className="mb-8 bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Macro Categories</h2>
        {macroCategories.length === 0 ? (
          <p className="text-gray-500 text-sm">No macro categories yet</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {macroCategories.map((macro: any) => (
              <div
                key={macro.id}
                className="px-4 py-2 bg-gray-100 rounded-lg flex items-center gap-2"
              >
                <span className="text-sm font-medium">{macro.name}</span>
                <span className="text-xs text-gray-500">({macro.categoryCount || 0})</span>
                <button
                  onClick={() => handleOpenMacroModal(macro)}
                  className="text-blue-600 hover:text-blue-800 text-xs ml-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => setMacroDeleteConfirm(macro.id)}
                  className="text-red-600 hover:text-red-800 text-xs"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Macro Category
        </label>
        <select
          value={filterMacroId}
          onChange={(e) => setFilterMacroId(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          {macroCategories.map((macro) => (
            <option key={macro.id} value={macro.id}>
              {macro.name}
            </option>
          ))}
        </select>
      </div>

      {/* Categories Table */}
      {filteredCategories.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No categories yet</p>
          <button
            onClick={() => handleOpenCategoryModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Add Your First Category
          </button>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Macro Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transactions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCategories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {category.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.macroCategory ? (
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {category.macroCategory.name}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.transactionCount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpenCategoryModal(category)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setCategoryDeleteConfirm(category.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Category Create/Edit Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingCategory ? 'Edit Category' : 'New Category'}
            </h2>

            <form onSubmit={handleCategorySubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={categoryFormName}
                  onChange={(e) => setCategoryFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Groceries"
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Macro Category (optional)
                </label>
                <select
                  value={categoryFormMacroId}
                  onChange={(e) => setCategoryFormMacroId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None</option>
                  {macroCategories.map((macro) => (
                    <option key={macro.id} value={macro.id}>
                      {macro.name}
                    </option>
                  ))}
                </select>
              </div>

              {categoryFormError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {categoryFormError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editingCategory ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseCategoryModal}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Macro Category Create/Edit Modal */}
      {isMacroModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingMacro ? 'Edit Macro Category' : 'New Macro Category'}
            </h2>

            <form onSubmit={handleMacroSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={macroFormName}
                  onChange={(e) => setMacroFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Food & Dining"
                  autoFocus
                />
              </div>

              {macroFormError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {macroFormError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  {editingMacro ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseMacroModal}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Delete Confirmation Modal */}
      {categoryDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Confirm Delete</h2>
            <p className="mb-6 text-gray-700">
              Are you sure you want to delete this category? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteCategory(categoryDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
              <button
                onClick={() => setCategoryDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Macro Category Delete Confirmation Modal */}
      {macroDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Confirm Delete</h2>
            <p className="mb-6 text-gray-700">
              Are you sure you want to delete this macro category? Associated categories will remain but lose their macro category link.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteMacro(macroDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
              <button
                onClick={() => setMacroDeleteConfirm(null)}
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
