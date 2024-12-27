import { Navbar, Container, Nav, Button } from 'react-bootstrap'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const Header = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Navbar bg="white" className="border-bottom shadow-sm">
      <Container fluid>
        <Navbar.Brand href="#" className="fw-bold">App Financeiro</Navbar.Brand>
        <Nav className="ms-auto">
          <div className="d-flex align-items-center">
            <span className="me-3">Olá, {user?.name}</span>
            <Button variant="outline-primary" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </Nav>
      </Container>
    </Navbar>
  )
}

export default Header
