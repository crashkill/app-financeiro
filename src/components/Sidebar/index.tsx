import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col h-screen bg-gray-800 text-white w-64 p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">App Financeiro</h1>
        <p className="text-sm text-gray-400">{user?.email}</p>
      </div>

      <nav className="flex-1">
        <ul className="space-y-2">
          <li>
            <Link
              to="/planilhas"
              className="block px-4 py-2 rounded hover:bg-gray-700"
            >
              Planilhas Financeiras
            </Link>
          </li>
          <li>
            <Link
              to="/forecast"
              className="block px-4 py-2 rounded hover:bg-gray-700"
            >
              Forecast
            </Link>
          </li>
          <li>
            <Link
              to="/profissionais"
              className="block px-4 py-2 rounded hover:bg-gray-700"
            >
              Gestão de Profissionais
            </Link>
          </li>
        </ul>
      </nav>

      <button
        onClick={logout}
        className="mt-auto px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Sair
      </button>
    </div>
  );
};

export default Sidebar;
