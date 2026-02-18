import { createBrowserRouter } from 'react-router-dom';
import Layout from '../layouts/Layout';
import Dashboard from '../pages/dashboard/Dashboard';
import CandidateDetail from '../pages/candidate/CandidateDetail';
import Tasks from '../pages/tasks/Tasks';
import Settings from '../pages/settings/Settings';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'candidate/:id?',
        element: <CandidateDetail />,
      },
      {
        path: 'tasks',
        element: <Tasks />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
]);

export default router;
