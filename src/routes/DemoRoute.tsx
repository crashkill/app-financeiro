import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Alert } from 'react-bootstrap';
import Layout from '../components/Layout';

interface DemoRouteProps {
  element: React.ReactElement;
  adminOnly?: boolean;
  demoRestricted?: boolean;
}

const DemoRoute: React.FC<DemoRouteProps> = ({ element, adminOnly = false, demoRestricted = false }) => {
  const { user, isAdmin, isDemo } = useAuth();

  // Se não está logado, redireciona para login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Se é uma rota apenas para admin e o usuário não é admin
  if (adminOnly && !isAdmin) {
    return (
      <Layout>
        <Alert variant="warning" className="m-4">
          <Alert.Heading>Acesso Restrito</Alert.Heading>
          <p>Esta funcionalidade está disponível apenas para administradores.</p>
          <hr />
          <p className="mb-0">
            Você está logado como: <strong>{user.name}</strong> ({user.email})
          </p>
        </Alert>
      </Layout>
    );
  }

  // Se é uma rota restrita para demo e o usuário é demo
  if (demoRestricted && isDemo) {
    return (
      <Layout>
        <Alert variant="info" className="m-4">
          <Alert.Heading>Funcionalidade Limitada</Alert.Heading>
          <p>Esta funcionalidade não está disponível na versão demo.</p>
          <hr />
          <p className="mb-0">
            Para acesso completo, entre em contato com o administrador do sistema.
          </p>
        </Alert>
      </Layout>
    );
  }

  return <Layout>{element}</Layout>;
};

export default DemoRoute;