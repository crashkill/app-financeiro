'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

const ThemeToggle = ({ className }: { className?: string }) => {
  const { theme, toggleTheme } = useTheme();

  // Efeitos de partículas para o tema
  const particles = Array(8).fill(0);

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg',
        'dark:from-gray-800 dark:to-gray-900 dark:shadow-gray-900/50',
        'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2',
        'transition-all duration-300 ease-in-out transform hover:scale-105',
        'overflow-hidden',
        className
      )}
      aria-label={`Alternar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
    >
      {/* Efeito de brilho */}
      <motion.div 
        className="absolute inset-0 bg-white/10 rounded-full"
        initial={{ scale: 0 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ 
          repeat: Infinity, 
          repeatType: 'reverse',
          duration: 2,
          ease: 'easeInOut'
        }}
      />

      {/* Partículas flutuantes */}
      <AnimatePresence>
        {particles.map((_, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-white/20"
            style={{
              width: Math.random() * 4 + 2 + 'px',
              height: Math.random() * 4 + 2 + 'px',
              top: '50%',
              left: '50%',
              x: 0,
              y: 0,
            }}
            animate={{
              x: [
                0,
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 20,
              ],
              y: [
                0,
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 20,
              ],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              repeatType: 'loop',
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </AnimatePresence>

      {/* Ícone do tema */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={false}
        animate={{
          rotate: theme === 'dark' ? 40 : 0,
          scale: theme === 'dark' ? 0.9 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
        }}
      >
        {theme === 'dark' ? (
          <Moon className="h-6 w-6 text-yellow-300" />
        ) : (
          <Sun className="h-6 w-6 text-yellow-400" />
        )}
      </motion.div>

      {/* Efeito de brilho ao redor */}
      <motion.div 
        className="absolute inset-0 rounded-full border-2 border-transparent"
        animate={{
          borderColor: theme === 'dark' ? 'rgba(234, 179, 8, 0.3)' : 'rgba(99, 102, 241, 0.3)',
          boxShadow: theme === 'dark' 
            ? '0 0 20px rgba(234, 179, 8, 0.3)' 
            : '0 0 20px rgba(99, 102, 241, 0.3)',
        }}
        transition={{
          duration: 0.5,
          ease: 'easeInOut',
        }}
      />
    </button>
  );
};

export default ThemeToggle;
