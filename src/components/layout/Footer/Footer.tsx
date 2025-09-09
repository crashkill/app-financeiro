import React from 'react';
import { clsx } from 'clsx';
import { Heart, ExternalLink } from 'lucide-react';

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterProps {
  className?: string;
  variant?: 'default' | 'minimal' | 'detailed';
  showCopyright?: boolean;
  showVersion?: boolean;
  links?: FooterLink[];
  companyName?: string;
  version?: string;
}

const defaultLinks: FooterLink[] = [

  {
    label: 'Suporte',
    href: '/suporte'
  },
  {
    label: 'Política de Privacidade',
    href: '/privacidade'
  },
  {
    label: 'HITSS',
    href: 'https://hitss.com',
    external: true
  }
];

const Footer: React.FC<FooterProps> = ({
  className,
  variant = 'default',
  showCopyright = true,
  showVersion = true,
  links = defaultLinks,
  companyName = 'HITSS Technology',
  version = '1.0.0'
}) => {
  const currentYear = new Date().getFullYear();
  
  if (variant === 'minimal') {
    return (
      <footer className={clsx(
        'py-4 px-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
        className
      )}>
        <div className="flex items-center justify-center">
          {showCopyright && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {currentYear} {companyName}
            </p>
          )}
        </div>
      </footer>
    );
  }
  
  if (variant === 'detailed') {
    return (
      <footer className={clsx(
        'py-8 px-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900',
        className
      )}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">HT</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  HITSS Financial
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Plataforma de gestão financeira desenvolvida com tecnologia de ponta para otimizar seus processos financeiros.
              </p>
            </div>
            
            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                Links Rápidos
              </h4>
              <ul className="space-y-2">
                {links.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noopener noreferrer' : undefined}
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 flex items-center space-x-1"
                    >
                      <span>{link.label}</span>
                      {link.external && <ExternalLink size={12} />}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Contact Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                Contato
              </h4>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>Email: suporte@hitss.com</p>
                <p>Telefone: +55 (11) 1234-5678</p>
                <p>Horário: Seg-Sex, 9h-18h</p>
              </div>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              {showCopyright && (
                <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                  <span>© {currentYear} {companyName}. Feito com</span>
                  <Heart size={14} className="text-red-500" />
                  <span>no Brasil</span>
                </div>
              )}
              {showVersion && (
                <div className="text-sm text-gray-500 dark:text-gray-500">
                  Versão {version}
                </div>
              )}
            </div>
          </div>
        </div>
      </footer>
    );
  }
  
  // Default variant
  return (
    <footer className={clsx(
      'py-6 px-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
      className
    )}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center md:justify-start space-x-6">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.href}
                target={link.external ? '_blank' : undefined}
                rel={link.external ? 'noopener noreferrer' : undefined}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 flex items-center space-x-1"
              >
                <span>{link.label}</span>
                {link.external && <ExternalLink size={12} />}
              </a>
            ))}
          </nav>
          
          {/* Copyright and Version */}
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
            {showCopyright && (
              <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                <span>© {currentYear} {companyName}</span>
              </div>
            )}
            {showVersion && (
              <div className="text-sm text-gray-500 dark:text-gray-500">
                v{version}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;