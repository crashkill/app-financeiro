import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Pages
import Dashboard from '../pages/Dashboard';
import PlanilhasFinanceiras from '../pages/PlanilhasFinanceiras';
import Documentacao from '../pages/Documentacao';
import Login from '../pages/Login';
import AdminCheck from '../pages/AdminCheck';

// Layout
import Layout from '../components/Layout';
import AdminRoute from './AdminRoute';

const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { user } = useAuth();
  return user ? element : <Navigate to="/login" replace />;
};

const AdminRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { user, isAdmin } = useAuth();
  return user && isAdmin ? element : <Navigate to="/" replace />;
};

const Router: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={<Layout />}>
        <Route index element={<PrivateRoute element={<Dashboard />} />} />
        <Route 
          path="planilhas" 
          element={<PrivateRoute element={<PlanilhasFinanceiras />} />} 
        />
        <Route 
          path="documentacao" 
          element={<PrivateRoute element={<Documentacao />} />} 
        />
        <Route 
          path="admin-check"
          element={<AdminRoute element={<AdminCheck />} />}
        />
      </Route>
    </Routes>
  );
};

export default Router;
