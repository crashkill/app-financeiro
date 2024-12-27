import { Nav } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'

const Sidebar = () => {
  const location = useLocation()

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <div className="bg-dark text-white" style={{ width: '250px', minHeight: '100vh', position: 'fixed' }}>
      <div className="p-3">
        <h5 className="mb-4 p-2">Menu</h5>
        <Nav className="flex-column">
          <Nav.Item>
            <Link
              to="/dashboard"
              className={`nav-link py-2 ${isActive('/dashboard') ? 'active bg-primary' : 'text-white'}`}
            >
              Dashboard
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link
              to="/receitas"
              className={`nav-link py-2 ${isActive('/receitas') ? 'active bg-primary' : 'text-white'}`}
            >
              Receitas
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link
              to="/despesas"
              className={`nav-link py-2 ${isActive('/despesas') ? 'active bg-primary' : 'text-white'}`}
            >
              Despesas
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link
              to="/upload"
              className={`nav-link py-2 ${isActive('/upload') ? 'active bg-primary' : 'text-white'}`}
            >
              Upload de Arquivos
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link
              to="/relatorios"
              className={`nav-link py-2 ${isActive('/relatorios') ? 'active bg-primary' : 'text-white'}`}
            >
              Relatórios
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link
              to="/configuracoes"
              className={`nav-link py-2 ${isActive('/configuracoes') ? 'active bg-primary' : 'text-white'}`}
            >
              Configurações
            </Link>
          </Nav.Item>
        </Nav>
      </div>
    </div>
  )
}

export default Sidebar
