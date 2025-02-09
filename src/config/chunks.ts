// Configuração de chunks para carregamento dinâmico
export const chunks = {
  admin: () => import('../pages/AdminPage'),
  scheduling: () => import('../pages/Scheduling'),
  reports: () => import('../pages/Reports'),
  settings: () => import('../pages/Settings'),
  backup: () => import('../pages/Backup'),
  help: () => import('../pages/Help'),
};
