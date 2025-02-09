import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { router } from './routes';
import { NotificationProvider } from './contexts/NotificationContext';
import { KeepAliveProvider } from './contexts/KeepAliveContext';
import { SchedulingProvider } from './contexts/SchedulingContext';
import './index.css';
import 'react-toastify/dist/ReactToastify.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NotificationProvider>
      <KeepAliveProvider>
        <SchedulingProvider>
          <RouterProvider router={router} />
          <ToastContainer 
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </SchedulingProvider>
      </KeepAliveProvider>
    </NotificationProvider>
  </React.StrictMode>
);
