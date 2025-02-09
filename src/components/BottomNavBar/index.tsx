import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, ClipboardList, Settings } from 'lucide-react';

const items = [
  {
    path: '/',
    label: 'Início',
    icon: Home
  },
  {
    path: '/agendamentos',
    label: 'Agendamentos',
    icon: Calendar
  },
  {
    path: '/ordens',
    label: 'Ordens',
    icon: ClipboardList
  },
  {
    path: '/configuracoes',
    label: 'Configurações',
    icon: Settings
  }
];

export function BottomNavBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex justify-around py-2">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center p-2 rounded-lg transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                }`
              }
            >
              {React.createElement(item.icon, { className: 'w-6 h-6' })}
              <span className="text-xs mt-1">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
