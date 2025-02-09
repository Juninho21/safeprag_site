import React from 'react';

export const LazyServiceScheduler = React.lazy(() => import('./ServiceScheduler'));
export const LazyAdminPage = React.lazy(() => import('./AdminPage'));
export const LazyServiceActivity = React.lazy(() => import('./ServiceActivity'));
export const LazyApprovalModal = React.lazy(() => import('./ApprovalModal'));

// Componente de loading padrão
export const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);
