import { Container, Nav, Button } from 'react-bootstrap'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const Header = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="bg-white shadow-sm">
      <Container fluid>
        <div className="d-flex align-items-center justify-content-between py-2">
          <div className="d-flex align-items-center">
            <img 
              src="https://globalhitss.com/br/wp-content/uploads/2024/03/logo_BR-no-copy.png"
              alt="Global Hitss" 
              style={{ 
                height: '50px',
                width: 'auto',
                marginRight: '20px'
              }}
            />
            <div>
              <h4 className="mb-0 text-dark" style={{ fontSize: '1.4rem' }}>Plataforma Financeira</h4>
              <small className="text-muted" style={{ fontSize: '0.85rem' }}>Fábrica de Software Globalhitss</small>
            </div>
          </div>
          <div className="d-flex align-items-center">
            <span className="me-3">Olá, {user?.email}</span>
            <Button variant="outline-primary" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>
      </Container>
    </div>
  )
}

export default Header
