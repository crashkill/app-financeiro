'use client';

import { motion } from 'framer-motion';
import { Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

const ThemeToggle = ({ className }: { className?: string }) => {
  // Componente agora é apenas decorativo - sempre modo claro
  const theme = 'light';

  // Efeitos de partículas para o tema
  const particles = Array(6).fill(0);

  return (
    <div
      className={cn(
        'relative h-12 w-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg',
        'transition-all duration-300 ease-in-out',
        'overflow-hidden cursor-default',
        className
      )}
      aria-label="Modo claro ativo"
      title="Aplicação em modo claro"
    >
      {/* Efeito de brilho suave */}
      <motion.div 
        className="absolute inset-0 bg-white/20 rounded-full"
        initial={{ scale: 0 }}
        animate={{ scale: 1.3, opacity: 0 }}
        transition={{ 
          repeat: Infinity, 
          repeatType: 'reverse',
          duration: 3,
          ease: 'easeInOut'
        }}
      />

      {/* Partículas de luz solar */}
      {particles.map((_, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white/30"
          style={{
            width: Math.random() * 3 + 1 + 'px',
            height: Math.random() * 3 + 1 + 'px',
            top: '50%',
            left: '50%',
            x: 0,
            y: 0,
          }}
          animate={{
            x: [
              0,
              (Math.random() - 0.5) * 30,
              (Math.random() - 0.5) * 15,
            ],
            y: [
              0,
              (Math.random() - 0.5) * 30,
              (Math.random() - 0.5) * 15,
            ],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            repeatType: 'loop',
            delay: i * 0.3,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Ícone do sol fixo */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <Sun className="h-6 w-6 text-white drop-shadow-sm" />
      </motion.div>

      {/* Efeito de brilho solar */}
      <motion.div 
        className="absolute inset-0 rounded-full border-2 border-transparent"
        animate={{
          borderColor: 'rgba(251, 191, 36, 0.4)',
          boxShadow: '0 0 15px rgba(251, 191, 36, 0.3)',
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: 'reverse',
          ease: 'easeInOut',
        }}
      />
    </div>
  );
};

export default ThemeToggle;
