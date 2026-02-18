import { createBrowserRouter } from 'react-router-dom';
import Layout from '../layouts/Layout';
import Dashboard from '../pages/dashboard/Dashboard';
import Candidates from '../pages/candidates/Candidates';
import CandidateDetail from '../pages/candidate/CandidateDetail';
import Tasks from '../pages/tasks/Tasks';
import Settings from '../pages/settings/Settings';
import Submit from '../pages/submit/Submit';
import ScoringResults from '../pages/scoring/ScoringResults';

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
        path: 'candidates',
        element: <Candidates />,
      },
      {
        path: 'candidate/:id',
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
      {
        path: 'submit',
        element: <Submit />,
      },
      {
        path: 'scoring/:submissionId',
        element: <ScoringResults />,
      },
    ],
  },
]);

export default router;
