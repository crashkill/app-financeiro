import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProviderSwitch';

interface AdminRouteProps {
  element: React.ReactElement;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ element }) => {
  const { user, isAdmin } = useAuth();

  console.log('AdminRoute Debug:', {
    user,
    isAdmin,
    localStorage: localStorage.getItem('user')
  });

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return element;
};

export default AdminRoute;
