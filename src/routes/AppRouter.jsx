import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../layouts/Layout';
import ErrorPage from '../pages/common/ErrorPage';
import Login from '../pages/common/Login';
import NotFound from '../pages/common/NotFound';
import Dashboard from '../pages/user/Dashboard';
import AdminDashboard from '../pages/admin/AdminDashboard';

export const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <ErrorPage />,
    element: <Navigate to="/login" replace />,
  },
  {
    path: 'login',
    errorElement: <ErrorPage />,
    element: <Login />,
  },
  {
    path: '/',
    errorElement: <ErrorPage />,
    element: <Layout />,
    children: [
      { path: 'dashboard', element: <Dashboard /> },
    ],
  },
  {
    path: 'admin',
    errorElement: <ErrorPage />,
    element: <Layout />,
    children: [
      { path: 'dashboard', element: <AdminDashboard /> },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

export default router;
