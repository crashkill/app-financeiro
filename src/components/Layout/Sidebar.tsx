import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { isAdmin, user } = useAuth();

  console.log('Sidebar Debug:', {
    isAdmin,
    user,
    localStorage: localStorage.getItem('user')
  });

  return (
    <Nav className="flex-column">
      <Nav.Item>
        <Nav.Link 
          as={Link} 
          to="/" 
          active={location.pathname === '/'}
          className="d-flex align-items-center gap-2"
        >
          <i className="bi bi-house-door" data-testid="house-icon"></i>
          Dashboard
        </Nav.Link>
      </Nav.Item>

      <Nav.Item>
        <Nav.Link 
          as={Link} 
          to="/planilhas" 
          active={location.pathname === '/planilhas'}
          className="d-flex align-items-center gap-2"
        >
          <i className="bi bi-table" data-testid="table-icon"></i>
          Planilhas Financeiras
        </Nav.Link>
      </Nav.Item>

      {isAdmin && (
        <Nav.Item>
          <Nav.Link 
            as={Link} 
            to="/documentacao" 
            active={location.pathname === '/documentacao'}
            className="d-flex align-items-center gap-2"
          >
            <i className="bi bi-book" data-testid="book-icon"></i>
            Documentação
          </Nav.Link>
        </Nav.Item>
      )}

      <Nav.Item>
        <Nav.Link 
          as={Link} 
          to="/gestao-profissionais" 
          active={location.pathname === '/gestao-profissionais'}
          className="d-flex align-items-center gap-2"
        >
          <i className="bi bi-people" data-testid="people-icon"></i>
          Gestão de Profissionais
        </Nav.Link>
      </Nav.Item>

      <Nav.Item>
        <Nav.Link 
          as={Link} 
          to="/admin-check" 
          active={location.pathname === '/admin-check'}
          className="d-flex align-items-center gap-2"
        >
          <i className="bi bi-gear" data-testid="gear-icon"></i>
          Verificar Admin
        </Nav.Link>
      </Nav.Item>
    </Nav>
  );
};

export default Sidebar;
