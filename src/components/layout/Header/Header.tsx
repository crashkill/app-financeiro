import React from 'react';
import { LogOut, User, Settings, Bell, Upload } from 'lucide-react';
import { Button } from '../../common';
import { useAuth } from '../../../contexts/AuthContext';
import { clsx } from 'clsx';
import MigrationPanel from '../../Migration/MigrationPanel';

export interface HeaderProps {
  title?: string;
  showNotifications?: boolean;
  showUserMenu?: boolean;
  className?: string;
  onMenuToggle?: () => void;
  onSidebarToggle?: () => void;
  showSidebarToggle?: boolean;
  isMobileMenuOpen?: boolean;
  breadcrumbs?: Array<{ label: string; href?: string; }>;
}

const Header: React.FC<HeaderProps> = ({
  title = 'Plataforma Financeira',
  showNotifications = true,
  showUserMenu = true,
  className,
  onMenuToggle,
  onSidebarToggle,
  showSidebarToggle = false,
  isMobileMenuOpen = false,
  breadcrumbs
}) => {
  const { user, logout } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = React.useState(false);
  const [notifications, setNotifications] = React.useState(0);
  const [showMigrationPanel, setShowMigrationPanel] = React.useState(false);
  
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleLogout = async () => {
    try {
      await logout();
      setShowUserDropdown(false);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };
  
  return (
    <header className={clsx(
      'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm',
      className
    )}>
      <div className="flex items-center justify-between">
        {/* Left Section - Logo and Title */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          {(onMenuToggle || onSidebarToggle) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSidebarToggle || onMenuToggle}
              className="lg:hidden p-2"
            >
              <div className="space-y-1">
                <div className={clsx(
                  'w-5 h-0.5 bg-gray-600 dark:bg-gray-300 transition-transform duration-200',
                  isMobileMenuOpen && 'rotate-45 translate-y-1.5'
                )}></div>
                <div className={clsx(
                  'w-5 h-0.5 bg-gray-600 dark:bg-gray-300 transition-opacity duration-200',
                  isMobileMenuOpen && 'opacity-0'
                )}></div>
                <div className={clsx(
                  'w-5 h-0.5 bg-gray-600 dark:bg-gray-300 transition-transform duration-200',
                  isMobileMenuOpen && '-rotate-45 -translate-y-1.5'
                )}></div>
              </div>
            </Button>
          )}
          
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">HT</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {title}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                HITSS Technology Solutions
              </p>
            </div>
          </div>
        </div>
        
        {/* Right Section - Migration, Notifications and User Menu */}
        <div className="flex items-center space-x-3">
          {/* Migration Button */}
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMigrationPanel(true)}
              className="p-2 relative"
              title="Migração de Dados"
            >
              <Upload size={20} className="text-gray-600 dark:text-gray-300" />
            </Button>
          )}
          
          {/* Notifications */}
          {showNotifications && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="p-2 relative"
              >
                <Bell size={20} className="text-gray-600 dark:text-gray-300" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications > 9 ? '9+' : notifications}
                  </span>
                )}
              </Button>
            </div>
          )}
          
          {/* User Menu */}
          {showUserMenu && user && (
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center space-x-2 p-2"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.name || user.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
              </Button>
              
              {/* Dropdown Menu */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.name || 'Usuário'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => setShowUserDropdown(false)}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Settings size={16} className="mr-3" />
                    Configurações
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <LogOut size={16} className="mr-3" />
                    Sair
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Migration Panel */}
      <MigrationPanel 
        open={showMigrationPanel} 
        onClose={() => setShowMigrationPanel(false)} 
      />
    </header>
  );
};

export default Header;