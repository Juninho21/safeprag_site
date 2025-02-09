import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNavBar } from '../BottomNavBar';

export function Layout() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pb-16"> {/* Espaço para a BottomNavBar */}
        <Outlet />
      </div>
      {!isHomePage && <BottomNavBar />} {/* Só mostra a BottomNavBar nas outras páginas */}
    </div>
  );
}
