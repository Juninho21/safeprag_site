import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { SchedulingPage } from '../pages/Scheduling';
import App from '../App';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: 'agendamentos',
        element: <SchedulingPage />
      },
      {
        path: 'ordens',
        element: <div>Em desenvolvimento</div>
      },
      {
        path: 'configuracoes',
        element: <div>Em desenvolvimento</div>
      }
    ]
  }
]);
