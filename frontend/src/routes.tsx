import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

// Pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import Dashboard from '@/pages/Dashboard';
import PaymentMethods from '@/pages/PaymentMethods';
import Categories from '@/pages/Categories';
import Transactions from '@/pages/Transactions';
import RecurringSeries from '@/pages/RecurringSeries';
import Installments from '@/pages/Installments';
import CsvImport from '@/pages/CsvImport';
import PdfImport from '@/pages/PdfImport';
import MatchHistory from '@/pages/MatchHistory';
import ExchangeRates from '@/pages/ExchangeRates';
import Layout from '@/components/layout/Layout';

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route wrapper (redirect to dashboard if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <Register />
      </PublicRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'transactions',
        element: <Transactions />,
      },
      {
        path: 'payment-methods',
        element: <PaymentMethods />,
      },
      {
        path: 'categories',
        element: <Categories />,
      },
      {
        path: 'recurring-series',
        element: <RecurringSeries />,
      },
      {
        path: 'installments',
        element: <Installments />,
      },
      {
        path: 'import',
        element: <CsvImport />,
      },
      {
        path: 'import/pdf',
        element: <PdfImport />,
      },
      {
        path: 'match-history',
        element: <MatchHistory />,
      },
      {
        path: 'exchange-rates',
        element: <ExchangeRates />,
      },
    ],
  },
]);
