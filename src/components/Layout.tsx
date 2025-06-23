import { Container } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ThemeToggle from './ui/ThemeToggle';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  // Efeito para garantir que o tema seja aplicado corretamente
  useEffect(() => {
    // Adiciona classe de transição suave para todas as mudanças de cor
    const style = document.createElement('style');
    style.textContent = `
      * {
        transition: background-color 0.3s ease, border-color 0.3s ease, color 0.1s ease;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="min-vh-100 bg-background text-foreground">
      <Sidebar />
      <div className="md:ml-64 transition-all duration-300">
        <Header />
        <main className="p-4 min-h-[calc(100vh-64px)]">
          <Container fluid className="p-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={window.location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </Container>
        </main>
        
        {/* Botão de alternar tema flutuante */}
        <motion.div 
          className="fixed bottom-6 right-6 z-50"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          <ThemeToggle />
        </motion.div>
      </div>
    </div>
  );
};

export default Layout;