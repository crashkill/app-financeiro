import { useState } from 'react'
import { Nav } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'
import { Squash as Hamburger } from 'hamburger-react'
import {
  UilAnalytics,
  UilChartGrowth,
  UilCloudUpload,
  UilSetting,
  UilFileAlt,
  UilBook
} from '@iconscout/react-unicons'
import { useConfig } from '../contexts/ConfigContext'

interface MenuIconProps {
  icon: React.ReactNode
  color: string
  isActive?: boolean
  size?: number
}

const MenuIcon: React.FC<MenuIconProps> = ({ icon, color, isActive, size = 24 }) => {
  return (
    <div 
      style={{ 
        color: isActive ? '#0d6efd' : color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'color 0.3s ease'
      }}
    >
      {icon}
    </div>
  )
}

const Sidebar = () => {
  const location = useLocation()
  const { config } = useConfig()
  const [isOpen, setIsOpen] = useState(true)

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const sidebarWidth = isOpen ? '250px' : '80px'
  const menuItemClass = isOpen ? 'd-flex align-items-center' : 'd-flex justify-content-center'
  const textClass = isOpen ? 'ms-2' : 'd-none'

  return (
    <div 
      className="bg-white shadow-sm" 
      style={{ 
        width: sidebarWidth, 
        minHeight: '100vh', 
        position: 'fixed',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden'
      }}
    >
      <div className="p-3">
        <div className="d-flex align-items-center justify-content-between mb-4">
          {isOpen && <h5 className="mb-0 text-dark">Menu</h5>}
          <div style={{ 
            color: '#6c757d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px'
          }}>
            <Hamburger 
              toggled={isOpen} 
              toggle={setIsOpen}
              size={22}
              duration={0.5}
              easing="ease-in-out"
              distance="lg"
              color="currentColor"
              rounded
            />
          </div>
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
              style={{
                borderRadius: '8px',
                margin: '2px 0',
                transition: 'all 0.3s ease'
              }}
            >
              <MenuIcon 
                icon={<UilAnalytics />}
                color="#2196f3"
                isActive={isActive('/dashboard')}
              />
              <span className={textClass}>Dashboard</span>
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link
              to="/planilhas"
              className={`nav-link py-2 ${menuItemClass} ${
                isActive('/planilhas') 
                  ? 'active bg-primary bg-opacity-10 text-primary' 
                  : 'text-dark'
              }`}
              style={{
                borderRadius: '8px',
                margin: '2px 0',
                transition: 'all 0.3s ease'
              }}
            >
              <MenuIcon 
                icon={<UilFileAlt />}
                color="#4caf50"
                isActive={isActive('/planilhas')}
              />
              <span className={textClass}>Planilhas Financeiras</span>
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
              style={{
                borderRadius: '8px',
                margin: '2px 0',
                transition: 'all 0.3s ease'
              }}
            >
              <MenuIcon 
                icon={<UilChartGrowth />}
                color="#9c27b0"
                isActive={isActive('/forecast')}
              />
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
              style={{
                borderRadius: '8px',
                margin: '2px 0',
                transition: 'all 0.3s ease'
              }}
            >
              <MenuIcon 
                icon={<UilCloudUpload />}
                color="#ff9800"
                isActive={isActive('/upload')}
              />
              <span className={textClass}>Upload</span>
            </Link>
          </Nav.Item>
          <Nav.Item>
            <Link
              to="/documentacao"
              className={`nav-link py-2 ${menuItemClass} ${
                isActive('/documentacao') 
                  ? 'active bg-primary bg-opacity-10 text-primary' 
                  : 'text-dark'
              }`}
              style={{
                borderRadius: '8px',
                margin: '2px 0',
                transition: 'all 0.3s ease'
              }}
            >
              <MenuIcon 
                icon={<UilBook />}
                color="#673ab7"
                isActive={isActive('/documentacao')}
              />
              <span className={textClass}>Documentação</span>
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
              style={{
                borderRadius: '8px',
                margin: '2px 0',
                transition: 'all 0.3s ease'
              }}
            >
              <MenuIcon 
                icon={<UilSetting />}
                color="#607d8b"
                isActive={isActive('/config')}
              />
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
