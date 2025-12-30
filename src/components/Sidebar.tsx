import { Nav } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'
import { Squash as Hamburger } from 'hamburger-react'
import {
  BarChart3,
  FileText,
  TrendingUp,
  Upload,
  Settings,
  Book,
  Menu,
  ChevronRight,
  Users,
  Database,
  TestTube
} from 'lucide-react'
import { useConfig } from '../contexts/ConfigContext'

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

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const location = useLocation()
  const { config } = useConfig()

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const sidebarWidth = isOpen ? '250px' : '80px'
  const menuItemClass = isOpen ? 'd-flex align-items-center' : 'd-flex justify-content-center'
  const textClass = isOpen ? 'ms-2' : 'd-none'

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <BarChart3 size={24} />,
      path: '/dashboard',
      color: '#2196f3'
    },
    {
      text: 'Planilhas Financeiras',
      icon: <FileText size={24} />,
      path: '/planilhas',
      color: '#4caf50'
    },
    {
      text: 'Forecast',
      icon: <TrendingUp size={24} />,
      path: '/forecast',
      color: '#9c27b0'
    },
    {
      text: 'Gestão de Profissionais',
      icon: <Users size={24} />,
      path: '/gestao-profissionais',
      color: '#e91e63'
    },
    {
      text: 'Upload',
      icon: <Upload size={24} />,
      path: '/upload',
      color: '#ff9800'
    },
    {
      text: 'Consulta SAP',
      icon: <Database size={24} />,
      path: '/consulta-sap',
      color: '#00bcd4'
    },

    {
      text: 'Configurações',
      icon: <Settings size={24} />,
      path: '/config',
      color: '#607d8b'
    }
  ];

  return (
    <div
      className="bg-gray-50 dark:bg-slate-800 shadow-sm"
      style={{
        width: sidebarWidth,
        minHeight: '100vh',
        position: 'fixed',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        zIndex: 40,
        left: 0,
        top: 0
      }}
    >
      <div className="p-3">
        <div className="d-flex align-items-center justify-content-between mb-4">
          {isOpen && <h5 className="mb-0">Menu</h5>}
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
              toggle={onToggle}
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
                className={`nav-link py-2 ${menuItemClass} ${isActive(menuItem.path)
                  ? 'active bg-blue-100 dark:bg-blue-500 dark:bg-opacity-20 text-blue-600 dark:text-blue-400'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
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
              <span className="ms-2">{config.userName || 'Usuário'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar
