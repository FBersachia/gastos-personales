import { useAuthStore } from '@/store/authStore';

function Dashboard() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Bienvenido, {user?.email}</h2>
        <p className="text-gray-600">
          Esta es la pantalla principal. Aquí verás un resumen de tus finanzas.
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900">Próximamente</h3>
            <p className="text-2xl font-bold text-blue-600 mt-2">Transacciones</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-900">Próximamente</h3>
            <p className="text-2xl font-bold text-green-600 mt-2">Categorías</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-900">Próximamente</h3>
            <p className="text-2xl font-bold text-purple-600 mt-2">Métodos de Pago</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
