import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import Header from '../Header';
import Sidebar from '../Sidebar';
import Footer from '../Footer';
import { Loading } from '../../common';

export interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'fullscreen' | 'minimal';
  showSidebar?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  sidebarVariant?: 'default' | 'compact' | 'floating';
  footerVariant?: 'default' | 'minimal' | 'detailed';
  isLoading?: boolean;
  loadingText?: string;
  pageTitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  className,
  variant = 'default',
  showSidebar = true,
  showHeader = true,
  showFooter = true,
  sidebarVariant = 'default',
  footerVariant = 'default',
  isLoading = false,
  loadingText,
  pageTitle,
  breadcrumbs
}) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  
  // Check if mobile
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20
    },
    in: {
      opacity: 1,
      y: 0
    },
    out: {
      opacity: 0,
      y: -20
    }
  };
  
  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.3
  };
  
  if (variant === 'fullscreen') {
    return (
      <div className={clsx('min-h-screen bg-gray-50 dark:bg-gray-900', className)}>
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center min-h-screen"
            >
              <Loading size="lg" text={loadingText} />
            </motion.div>
          ) : (
            <motion.main
              key="content"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
              className="min-h-screen"
            >
              {children}
            </motion.main>
          )}
        </AnimatePresence>
      </div>
    );
  }
  
  if (variant === 'minimal') {
    return (
      <div className={clsx('min-h-screen bg-gray-50 dark:bg-gray-900', className)}>
        {showHeader && (
          <Header
            showSidebarToggle={false}
            title={pageTitle}
            breadcrumbs={breadcrumbs}
          />
        )}
        
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center min-h-[calc(100vh-4rem)]"
            >
              <Loading size="lg" text={loadingText} />
            </motion.div>
          ) : (
            <motion.main
              key="content"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
              className="min-h-[calc(100vh-4rem)] p-6"
            >
              {children}
            </motion.main>
          )}
        </AnimatePresence>
        
        {showFooter && (
          <Footer variant={footerVariant} />
        )}
      </div>
    );
  }
  
  // Default variant
  return (
    <div className={clsx('min-h-screen bg-gray-50 dark:bg-gray-900', className)}>
      {/* Sidebar */}
      {showSidebar && (
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
          variant={sidebarVariant}
        />
      )}
      
      {/* Main Content Area */}
      <div className={clsx(
        'flex flex-col min-h-screen transition-all duration-300',
        showSidebar && {
          'lg:ml-20': !sidebarOpen,
          'lg:ml-[280px]': sidebarOpen
        }
      )}>
        {/* Header */}
        {showHeader && (
          <Header
            onSidebarToggle={showSidebar ? toggleSidebar : undefined}
            showSidebarToggle={showSidebar}
            title={pageTitle}
            breadcrumbs={breadcrumbs}
          />
        )}
        
        {/* Main Content */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center p-6"
            >
              <Loading size="lg" text={loadingText} />
            </motion.div>
          ) : (
            <motion.main
              key="content"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
              className="flex-1 p-6"
            >
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </motion.main>
          )}
        </AnimatePresence>
        
        {/* Footer */}
        {showFooter && (
          <Footer variant={footerVariant} />
        )}
      </div>
    </div>
  );
};

export default Layout;