import { useState } from 'react'
import { Nav } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'
import { Squash as Hamburger } from 'hamburger-react'
import {
  UilAnalytics,
  UilFileAlt,
  UilChartGrowth,
  UilCloudUpload,
  UilSetting,
  UilBook,
  UilBars,
  UilAngleRight,
  UilUsersAlt,
  UilDatabase
} from '@iconscout/react-unicons'
import { useConfig } from '../contexts/ConfigContext'

// Wrappers para os ícones com parâmetros padrão
// Updated icon wrappers with default parameters
const Analytics = ({ ...props } = {}) => <UilAnalytics {...props} />
const FileAlt = ({ ...props } = {}) => <UilFileAlt {...props} />
const ChartGrowth = ({ ...props } = {}) => <UilChartGrowth {...props} />
const CloudUpload = ({ ...props } = {}) => <UilCloudUpload {...props} />
const Setting = ({ ...props } = {}) => <UilSetting {...props} />
const Book = ({ ...props } = {}) => <UilBook {...props} />
const Bars = ({ ...props } = {}) => <UilBars {...props} />
const AngleRight = ({ ...props } = {}) => <UilAngleRight {...props} />
const People = ({ ...props } = {}) => <UilUsersAlt {...props} />
const Database = ({ ...props } = {}) => <UilDatabase {...props} />

interface MenuIconProps {
  icon: React.ReactNode;
  color: string;
  isActive?: boolean;
  size?: number;
}

const MenuIcon = ({ 
  icon, 
  color, 
  isActive = false, 
  size = 24 
}: MenuIconProps): JSX.Element => {
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

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <Analytics />,
      path: '/dashboard',
      color: '#2196f3'
    },
    {
      text: 'Planilhas Financeiras',
      icon: <FileAlt />,
      path: '/planilhas',
      color: '#4caf50'
    },
    {
      text: 'Forecast',
      icon: <ChartGrowth />,
      path: '/forecast',
      color: '#9c27b0'
    },
    {
      text: 'Gestão de Profissionais',
      icon: <People />,
      path: '/gestao-profissionais',
      color: '#e91e63'
    },
    {
      text: 'Upload',
      icon: <CloudUpload />,
      path: '/upload',
      color: '#ff9800'
    },
    {
      text: 'Consulta SAP',
      icon: <Database />,
      path: '/consulta-sap',
      color: '#00bcd4'
    },
    {
      text: 'Documentação',
      icon: <Book />,
      path: '/documentacao',
      color: '#607d8b'
    },
    {
      text: 'Configurações',
      icon: <Setting />,
      path: '/config',
      color: '#607d8b'
    }
  ];

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
          {menuItems.map((menuItem, index) => (
            <Nav.Item key={index}>
              <Link
                to={menuItem.path}
                className={`nav-link py-2 ${menuItemClass} ${
                  isActive(menuItem.path) 
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
                  icon={menuItem.icon}
                  color={menuItem.color}
                  isActive={isActive(menuItem.path)}
                />
                <span className={textClass}>{menuItem.text}</span>
              </Link>
            </Nav.Item>
          ))}
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
