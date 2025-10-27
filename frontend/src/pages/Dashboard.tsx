import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getDashboardSummary, DashboardSummary } from '@/api/dashboard.api';
import { useNavigate } from 'react-router-dom';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const data = await getDashboardSummary();
        setSummary(data);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Error al cargar el resumen');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

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
      day: '2-digit',
      month: 'short',
    });
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading) {
    return <LoadingSkeleton type="dashboard" />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const incomeChange = calculatePercentageChange(
    summary.currentMonth.totalIncome,
    summary.previousMonth.totalIncome
  );
  const expenseChange = calculatePercentageChange(
    summary.currentMonth.totalExpenses,
    summary.previousMonth.totalExpenses
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/transactions')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Nueva Transacción
          </button>
          <button
            onClick={() => navigate('/import/csv')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Importar CSV
          </button>
          <button
            onClick={() => navigate('/import/pdf')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Importar PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Income Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingresos del Mes</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {formatCurrency(summary.currentMonth.totalIncome)}
              </p>
            </div>
            <div className="bg-green-100 p-2 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={`font-medium ${incomeChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}%
            </span>
            <span className="text-gray-500 ml-2">vs mes anterior</span>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">Gastos del Mes</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {formatCurrency(summary.currentMonth.totalExpenses)}
              </p>
            </div>
            <div className="bg-red-100 p-2 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className={`font-medium ${expenseChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}%
            </span>
            <span className="text-gray-500 ml-2">vs mes anterior</span>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">Balance del Mes</p>
              <p className={`text-3xl font-bold mt-2 ${summary.currentMonth.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {formatCurrency(summary.currentMonth.balance)}
              </p>
            </div>
            <div className={`p-2 rounded-lg ${summary.currentMonth.balance >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
              <svg className={`w-6 h-6 ${summary.currentMonth.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <span>{summary.currentMonth.transactionCount} transacciones</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Categories */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Categorías (Gastos)</h2>
          {summary.topCategories.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay datos de categorías</p>
          ) : (
            <div className="space-y-4">
              {summary.topCategories.map((category) => (
                <div key={category.categoryId}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{category.categoryName}</span>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(category.amount)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-12 text-right">{category.percentage.toFixed(1)}%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{category.count} transacciones</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Installments */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Cuotas Pendientes</h2>
            <button
              onClick={() => navigate('/installments')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Ver todas
            </button>
          </div>
          {summary.pendingInstallments.totalCount === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay cuotas pendientes</p>
          ) : (
            <>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-orange-800 font-medium">Total Pendiente</p>
                    <p className="text-2xl font-bold text-orange-600 mt-1">
                      {formatCurrency(summary.pendingInstallments.totalAmount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-orange-800">{summary.pendingInstallments.totalCount} cuotas</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {summary.pendingInstallments.items.map((item) => (
                  <div key={item.transactionId} className="border-l-4 border-orange-400 pl-3 py-2">
                    <p className="text-sm font-medium text-gray-900">{item.description}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500">{item.pendingInstallments} cuotas pendientes</span>
                      <span className="text-sm font-semibold text-orange-600">
                        {formatCurrency(item.totalPending)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Transacciones Recientes</h2>
          <button
            onClick={() => navigate('/transactions')}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Ver todas
          </button>
        </div>
        {summary.recentTransactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay transacciones recientes</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {summary.recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{formatDate(transaction.date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{transaction.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{transaction.category?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{transaction.paymentMethod?.name || '-'}</td>
                    <td className={`px-4 py-3 text-sm font-medium text-right ${transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
