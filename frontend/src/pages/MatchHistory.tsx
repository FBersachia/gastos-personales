import { useEffect, useState } from 'react';
import { getMatchHistory, Match, MatchHistoryStatistics, MatchHistoryFilters } from '@/api/transactions.api';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

type ViewMode = 'table' | 'timeline' | 'chart';

function MatchHistory() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [statistics, setStatistics] = useState<MatchHistoryStatistics | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Filters
  const [resultFilter, setResultFilter] = useState<'ganado' | 'perdido' | 'empatado' | 'ALL'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchMatchHistory();
  }, [resultFilter, dateFrom, dateTo]);

  const fetchMatchHistory = async () => {
    try {
      // Only show full loading skeleton on initial load
      if (initialLoading) {
        setInitialLoading(true);
      } else {
        setFilterLoading(true);
      }

      const filters: MatchHistoryFilters = {};

      if (resultFilter !== 'ALL') filters.result = resultFilter;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;

      const data = await getMatchHistory(filters);
      setMatches(data.matches);
      setStatistics(data.statistics);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Error al cargar historial de partidos');
    } finally {
      setInitialLoading(false);
      setFilterLoading(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getResultBadgeClass = (result: string) => {
    switch (result) {
      case 'ganado':
        return 'bg-green-100 text-green-800';
      case 'perdido':
        return 'bg-red-100 text-red-800';
      case 'empatado':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getResultLabel = (result: string) => {
    switch (result) {
      case 'ganado':
        return 'Ganado';
      case 'perdido':
        return 'Perdido';
      case 'empatado':
        return 'Empatado';
      default:
        return result;
    }
  };

  if (initialLoading) {
    return <LoadingSkeleton type="list" />;
  }

  if (error && !filterLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Historial de Partidos</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  // Prepare chart data
  const chartData = statistics ? [
    { name: 'Ganados', value: statistics.wins, color: '#10b981' },
    { name: 'Perdidos', value: statistics.losses, color: '#ef4444' },
    { name: 'Empatados', value: statistics.draws, color: '#eab308' },
  ].filter(item => item.value > 0) : [];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Historial de Partidos</h1>
        {filterLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg
              className="animate-spin h-5 w-5 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Actualizando...</span>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8 transition-opacity ${filterLoading ? 'opacity-50' : 'opacity-100'}`}>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Partidos</p>
            <p className="text-2xl font-bold text-gray-900">{statistics.totalMatches}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Ganados</p>
            <p className="text-2xl font-bold text-green-600">{statistics.wins}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Perdidos</p>
            <p className="text-2xl font-bold text-red-600">{statistics.losses}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Empatados</p>
            <p className="text-2xl font-bold text-yellow-600">{statistics.draws}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">% Victorias</p>
            <p className="text-2xl font-bold text-blue-600">{statistics.winPercentage}%</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Gastado</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(statistics.totalAmount)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resultado
            </label>
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todos</option>
              <option value="ganado">Ganados</option>
              <option value="perdido">Perdidos</option>
              <option value="empatado">Empatados</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Desde
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hasta
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {(resultFilter !== 'ALL' || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setResultFilter('ALL');
              setDateFrom('');
              setDateTo('');
            }}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* View Mode Selector */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setViewMode('table')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                viewMode === 'table'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tabla
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                viewMode === 'timeline'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Línea de Tiempo
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                viewMode === 'chart'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Gráfico
            </button>
          </div>
        </div>

        <div className={`p-6 transition-opacity ${filterLoading ? 'opacity-50' : 'opacity-100'}`}>
          {/* Table View */}
          {viewMode === 'table' && (
            <div className="overflow-x-auto">
              {matches.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay partidos registrados</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resultado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Método de Pago
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {matches.map((match) => (
                      <tr key={match.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(match.date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {match.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getResultBadgeClass(
                              match.result
                            )}`}
                          >
                            {getResultLabel(match.result)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(match.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {match.paymentMethod.name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Timeline View */}
          {viewMode === 'timeline' && (
            <div className="space-y-4">
              {matches.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay partidos registrados</p>
              ) : (
                matches.map((match, index) => (
                  <div key={match.id} className="flex">
                    <div className="flex flex-col items-center mr-4">
                      <div
                        className={`w-4 h-4 rounded-full ${
                          match.result === 'ganado'
                            ? 'bg-green-500'
                            : match.result === 'perdido'
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                        }`}
                      ></div>
                      {index < matches.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-300 mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {match.description}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getResultBadgeClass(
                            match.result
                          )}`}
                        >
                          {getResultLabel(match.result)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">Fecha:</span> {formatDate(match.date)}
                        </p>
                        <p>
                          <span className="font-medium">Monto:</span> {formatCurrency(match.amount)}
                        </p>
                        <p>
                          <span className="font-medium">Pago:</span> {match.paymentMethod.name}
                        </p>
                        <p>
                          <span className="font-medium">Categoría:</span> {match.category.name}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Chart View */}
          {viewMode === 'chart' && (
            <div className="h-96">
              {chartData.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No hay datos para mostrar</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) =>
                        `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MatchHistory;
