import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Pages
import Dashboard from '../pages/Dashboard';
import PlanilhasFinanceiras from '../pages/PlanilhasFinanceiras';
import Documentacao from '../pages/Documentacao';
import Login from '../pages/Login';
import AdminCheck from '../pages/AdminCheck';
import GestaoProfissionais from '../pages/GestaoProfissionais';
import Config from '../pages/Config';

// Layout
import Layout from '../components/Layout';

const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { user } = useAuth();
  return user ? <Layout>{element}</Layout> : <Navigate to="/login" replace />;
};

const AdminRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { user, isAdmin } = useAuth();
  return user && isAdmin ? <Layout>{element}</Layout> : <Navigate to="/" replace />;
};

const Router: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
      <Route path="/planilhas" element={<PrivateRoute element={<PlanilhasFinanceiras />} />} />
      <Route path="/documentacao" element={<PrivateRoute element={<Documentacao />} />} />
      <Route path="/admin-check" element={<AdminRoute element={<AdminCheck />} />} />
      <Route path="/gestao-profissionais" element={<PrivateRoute element={<GestaoProfissionais />} />} />
      <Route path="/config" element={<PrivateRoute element={<Config />} />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default Router;
