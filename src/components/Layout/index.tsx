import React from 'react';
import { Container, Row, Col, Navbar, Nav, Button } from 'react-bootstrap';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();

  console.log('Layout - User:', user); // Debug
  console.log('Layout - IsAdmin:', isAdmin); // Debug

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-vh-100 d-flex flex-column">
      <Navbar bg="dark" variant="dark" className="px-3">
        <Navbar.Brand>App Financeiro</Navbar.Brand>
        <Nav className="ms-auto">
          <span className="text-light me-3">
            Olá, {user?.name || 'Usuário'}
            {isAdmin && <span className="ms-1 badge bg-primary">Admin</span>}
          </span>
          <Button variant="outline-light" size="sm" onClick={handleLogout}>
            Sair
          </Button>
        </Nav>
      </Navbar>

      <Container fluid className="flex-grow-1">
        <Row className="h-100">
          <Col md={2} className="bg-light p-3">
            <Sidebar />
          </Col>
          <Col md={10} className="py-3">
            <Outlet />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Layout;
