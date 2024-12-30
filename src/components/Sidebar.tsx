import { useState } from 'react'
import { Nav } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'
import { FaChartLine, FaMoneyBillWave, FaChartBar, FaUpload, FaCog, FaBars, FaTimes } from 'react-icons/fa'
import { RiMoneyDollarCircleLine } from 'react-icons/ri'
import { useConfig } from '../contexts/ConfigContext'

const Sidebar = () => {
  const location = useLocation()
  const { config } = useConfig()
  const [isOpen, setIsOpen] = useState(true)

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const sidebarWidth = isOpen ? '250px' : '60px'
  const menuItemClass = isOpen ? 'd-flex align-items-center' : 'd-flex justify-content-center'
  const textClass = isOpen ? 'ms-2' : 'd-none'

  return (
    <div 
      className="bg-white shadow-sm" 
      style={{ 
        width: sidebarWidth, 
        minHeight: '100vh', 
        position: 'fixed',
        transition: 'width 0.3s ease'
      }}
    >
      <div className="p-3">
        <div className="d-flex align-items-center justify-content-between mb-4">
          {isOpen && <h5 className="mb-0 text-dark">Menu</h5>}
          <button 
            className="btn btn-link text-dark p-0" 
            onClick={toggleSidebar}
            style={{ fontSize: '1.2rem' }}
          >
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
        <Nav className="flex-column">
          <Nav.Item>
            <Link
              to="/dashboard"
              className={`nav-link py-2 ${menuItemClass} ${
                isActive('/dashboard') 
                  ? 'active bg-primary bg-opacity-10 text-primary' 
                  : 'text-dark'
              }`}
            >
              <FaChartLine />
              <span className={textClass}>Dashboard</span>
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link
              to="/receitas"
              className={`nav-link py-2 ${menuItemClass} ${
                isActive('/receitas') 
                  ? 'active bg-primary bg-opacity-10 text-primary' 
                  : 'text-dark'
              }`}
            >
              <RiMoneyDollarCircleLine />
              <span className={textClass}>Receitas</span>
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link
              to="/despesas"
              className={`nav-link py-2 ${menuItemClass} ${
                isActive('/despesas') 
                  ? 'active bg-primary bg-opacity-10 text-primary' 
                  : 'text-dark'
              }`}
            >
              <FaMoneyBillWave />
              <span className={textClass}>Despesas</span>
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link
              to="/forecast"
              className={`nav-link py-2 ${menuItemClass} ${
                isActive('/forecast') 
                  ? 'active bg-primary bg-opacity-10 text-primary' 
                  : 'text-dark'
              }`}
            >
              <FaChartBar />
              <span className={textClass}>Forecast</span>
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link
              to="/upload"
              className={`nav-link py-2 ${menuItemClass} ${
                isActive('/upload') 
                  ? 'active bg-primary bg-opacity-10 text-primary' 
                  : 'text-dark'
              }`}
            >
              <FaUpload />
              <span className={textClass}>Upload</span>
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link
              to="/config"
              className={`nav-link py-2 ${menuItemClass} ${
                isActive('/config') 
                  ? 'active bg-primary bg-opacity-10 text-primary' 
                  : 'text-dark'
              }`}
            >
              <FaCog />
              <span className={textClass}>Configurações</span>
            </Link>
          </Nav.Item>
        </Nav>
        
        {isOpen && config.userImage && (
          <div className="position-absolute bottom-0 start-0 p-3 w-100">
            <div className="d-flex align-items-center">
              <img 
                src={config.userImage} 
                alt="User" 
                className="rounded-circle"
                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
              />
              <span className="ms-2 text-dark">{config.userName || 'Usuário'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar
