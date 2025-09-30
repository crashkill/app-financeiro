import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileSpreadsheet,
  TrendingUp,
  Users,
  Upload,
  Search,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../../common';

export interface SidebarItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string | number;
  children?: SidebarItem[];
}

export interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
  variant?: 'default' | 'compact' | 'floating';
  items?: SidebarItem[];
}

const defaultItems: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: <LayoutDashboard size={20} />
  },
  {
    id: 'planilhas',
    label: 'Planilhas Financeiras',
    path: '/planilhas',
    icon: <FileSpreadsheet size={20} />
  },
  {
    id: 'forecast',
    label: 'Forecast',
    path: '/forecast',
    icon: <TrendingUp size={20} />
  },
  {
    id: 'profissionais',
    label: 'Gestão de Profissionais',
    path: '/profissionais',
    icon: <Users size={20} />
  },
  {
    id: 'upload',
    label: 'Upload',
    path: '/upload',
    icon: <Upload size={20} />
  },
  {
    id: 'consulta-sap',
    label: 'Consulta SAP',
    path: '/consulta-sap',
    icon: <Search size={20} />
  },

  {
    id: 'configuracoes',
    label: 'Configurações',
    path: '/configuracoes',
    icon: <Settings size={20} />
  }
];

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  className,
  variant = 'default',
  items = defaultItems
}) => {
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);
  
  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };
  
  const sidebarVariants = {
    open: {
      width: 280,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      width: 64,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 30
      }
    }
  };
  
  const contentVariants = {
    open: {
      opacity: 1,
      x: 0,
      transition: {
        delay: 0.1,
        duration: 0.2
      }
    },
    closed: {
      opacity: 0,
      x: -20,
      transition: {
        duration: 0.1
      }
    }
  };
  
  const renderSidebarItem = (item: SidebarItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    
    return (
      <div key={item.id} className="space-y-1">
        {hasChildren ? (
          <button
            onClick={() => toggleExpanded(item.id)}
            className={clsx(
              'w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
              'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
              level > 0 && 'ml-4'
            )}
          >
            <div className="flex items-center space-x-3">
              <span className="flex-shrink-0">{item.icon}</span>
              <AnimatePresence>
                {isOpen && (
                  <motion.span
                    variants={contentVariants}
                    initial="closed"
                    animate="open"
                    exit="closed"
                    className="truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            {isOpen && (
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight size={16} />
              </motion.div>
            )}
          </button>
        ) : (
          <NavLink
            to={item.path}
            className={({ isActive }) => clsx(
              'flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 group',
              isActive
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
              level > 0 && 'ml-4'
            )}
          >
            <div className="flex items-center space-x-3 min-w-0">
              <span className="flex-shrink-0">{item.icon}</span>
              <AnimatePresence>
                {isOpen && (
                  <motion.span
                    variants={contentVariants}
                    initial="closed"
                    animate="open"
                    exit="closed"
                    className="truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            {item.badge && isOpen && (
              <motion.span
                variants={contentVariants}
                initial="closed"
                animate="open"
                exit="closed"
                className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex-shrink-0"
              >
                {item.badge}
              </motion.span>
            )}
          </NavLink>
        )}
        
        {/* Render children */}
        {hasChildren && isExpanded && isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-1 ml-4">
              {item.children!.map(child => renderSidebarItem(child, level + 1))}
            </div>
          </motion.div>
        )}
      </div>
    );
  };
  
  const sidebarClasses = clsx(
    'fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg z-40 flex flex-col',
    variant === 'floating' && 'rounded-r-2xl m-2 h-[calc(100vh-1rem)]',
    className
  );
  
  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        animate={isOpen ? 'open' : 'closed'}
        className={sidebarClasses}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <AnimatePresence>
            {isOpen && (
              <motion.div
                variants={contentVariants}
                initial="closed"
                animate="open"
                exit="closed"
                className="flex items-center space-x-3"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">HT</span>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    HITSS Financial
                  </h2>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </Button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {items.map(item => renderSidebarItem(item))}
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <AnimatePresence>
            {isOpen && (
              <motion.div
                variants={contentVariants}
                initial="closed"
                animate="open"
                exit="closed"
                className="text-xs text-gray-500 dark:text-gray-400 text-center"
              >
                © 2024 HITSS Technology
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;