import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProviderSwitch';

// Pages
import Dashboard from '../pages/Dashboard';
import PlanilhasFinanceiras from '../pages/PlanilhasFinanceiras';
import Login from '../pages/Login';
import AdminCheck from '../pages/AdminCheck';
import GestaoProfissionais from '../pages/GestaoProfissionais';
import ConsultaSAP from '../pages/ConsultaSAP';

// Layout and Routes
import Layout from '../components/Layout';
import DemoRoute from './DemoRoute';

const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { user } = useAuth();
  return user ? <Layout>{element}</Layout> : <Navigate to="/" replace />;
};

const Router: React.FC = () => {
  return (
    <Routes>
      <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
      <Route path="/planilhas" element={<PrivateRoute element={<PlanilhasFinanceiras />} />} />
      <Route path="/admin-check" element={<DemoRoute element={<AdminCheck />} adminOnly={true} />} />
      <Route path="/gestao-profissionais" element={<DemoRoute element={<GestaoProfissionais />} demoRestricted={true} />} />
      <Route path="/consulta-sap" element={<DemoRoute element={<ConsultaSAP />} demoRestricted={true} />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default Router;
