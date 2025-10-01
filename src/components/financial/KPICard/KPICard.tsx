import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Percent,
  Calendar,
  Info
} from 'lucide-react';

export interface KPICardProps {
  title: string;
  value: number | string;
  previousValue?: number;
  format?: 'currency' | 'percentage' | 'number' | 'custom';
  currency?: string;
  precision?: number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  trendFormat?: 'percentage' | 'absolute';
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outlined' | 'filled' | 'gradient';
  loading?: boolean;
  description?: string;
  period?: string;
  onClick?: () => void;
  className?: string;
  showTrend?: boolean;
  customSuffix?: string;
  customPrefix?: string;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  previousValue,
  format = 'number',
  currency = 'BRL',
  precision = 2,
  trend,
  trendValue,
  trendFormat = 'percentage',
  icon,
  color = 'blue',
  size = 'md',
  variant = 'default',
  loading = false,
  description,
  period,
  onClick,
  className,
  showTrend = true,
  customSuffix,
  customPrefix
}) => {
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: precision,
          maximumFractionDigits: precision
        }).format(val);
      
      case 'percentage':
        return `${val.toFixed(precision)}%`;
      
      case 'number':
        return new Intl.NumberFormat('pt-BR', {
          minimumFractionDigits: precision,
          maximumFractionDigits: precision
        }).format(val);
      
      case 'custom':
        return `${customPrefix || ''}${val.toLocaleString('pt-BR')}${customSuffix || ''}`;
      
      default:
        return val.toString();
    }
  };
  
  const calculateTrend = (): { direction: 'up' | 'down' | 'neutral'; value: number; formatted: string } => {
    if (trend) {
      const trendVal = trendValue || 0;
      return {
        direction: trend,
        value: trendVal,
        formatted: trendFormat === 'percentage' ? `${trendVal.toFixed(1)}%` : formatValue(trendVal)
      };
    }
    
    if (previousValue !== undefined && typeof value === 'number') {
      const diff = value - previousValue;
      const percentChange = previousValue !== 0 ? (diff / previousValue) * 100 : 0;
      
      return {
        direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral',
        value: trendFormat === 'percentage' ? percentChange : diff,
        formatted: trendFormat === 'percentage' ? `${percentChange.toFixed(1)}%` : formatValue(diff)
      };
    }
    
    return { direction: 'neutral', value: 0, formatted: '0%' };
  };
  
  const trendData = calculateTrend();
  
  const getDefaultIcon = () => {
    switch (format) {
      case 'currency':
        return <DollarSign size={20} />;
      case 'percentage':
        return <Percent size={20} />;
      default:
        return <TrendingUp size={20} />;
    }
  };
  
  const getTrendIcon = () => {
    switch (trendData.direction) {
      case 'up':
        return <TrendingUp size={16} />;
      case 'down':
        return <TrendingDown size={16} />;
      default:
        return <Minus size={16} />;
    }
  };
  
  const colorClasses = {
    blue: {
      default: 'bg-white border-blue-200 text-blue-900',
      outlined: 'bg-white border-blue-300 text-blue-900',
      filled: 'bg-blue-50 border-blue-200 text-blue-900',
      gradient: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-blue-900',
      icon: 'text-blue-600 bg-blue-100',
      trend: {
        up: 'text-green-600 bg-green-100',
        down: 'text-red-600 bg-red-100',
        neutral: 'text-gray-600 bg-gray-100'
      }
    },
    green: {
      default: 'bg-white border-green-200 text-green-900',
      outlined: 'bg-white border-green-300 text-green-900',
      filled: 'bg-green-50 border-green-200 text-green-900',
      gradient: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200 text-green-900',
      icon: 'text-green-600 bg-green-100',
      trend: {
        up: 'text-green-600 bg-green-100',
        down: 'text-red-600 bg-red-100',
        neutral: 'text-gray-600 bg-gray-100'
      }
    },
    red: {
      default: 'bg-white border-red-200 text-red-900',
      outlined: 'bg-white border-red-300 text-red-900',
      filled: 'bg-red-50 border-red-200 text-red-900',
      gradient: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200 text-red-900',
      icon: 'text-red-600 bg-red-100',
      trend: {
        up: 'text-green-600 bg-green-100',
        down: 'text-red-600 bg-red-100',
        neutral: 'text-gray-600 bg-gray-100'
      }
    },
    yellow: {
      default: 'bg-white border-yellow-200 text-yellow-900',
      outlined: 'bg-white border-yellow-300 text-yellow-900',
      filled: 'bg-yellow-50 border-yellow-200 text-yellow-900',
      gradient: 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-900',
      icon: 'text-yellow-600 bg-yellow-100',
      trend: {
        up: 'text-green-600 bg-green-100',
        down: 'text-red-600 bg-red-100',
        neutral: 'text-gray-600 bg-gray-100'
      }
    },
    purple: {
      default: 'bg-white border-purple-200 text-purple-900',
      outlined: 'bg-white border-purple-300 text-purple-900',
      filled: 'bg-purple-50 border-purple-200 text-purple-900',
      gradient: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 text-purple-900',
      icon: 'text-purple-600 bg-purple-100',
      trend: {
        up: 'text-green-600 bg-green-100',
        down: 'text-red-600 bg-red-100',
        neutral: 'text-gray-600 bg-gray-100'
      }
    },
    gray: {
      default: 'bg-white border-gray-200 text-gray-900',
      outlined: 'bg-white border-gray-300 text-gray-900',
      filled: 'bg-gray-50 border-gray-200 text-gray-900',
      gradient: 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 text-gray-900',
      icon: 'text-gray-600 bg-gray-100',
      trend: {
        up: 'text-green-600 bg-green-100',
        down: 'text-red-600 bg-red-100',
        neutral: 'text-gray-600 bg-gray-100'
      }
    }
  };
  
  const sizeClasses = {
    sm: {
      card: 'p-4',
      icon: 'w-8 h-8',
      title: 'text-sm',
      value: 'text-xl',
      trend: 'text-xs'
    },
    md: {
      card: 'p-6',
      icon: 'w-10 h-10',
      title: 'text-sm',
      value: 'text-2xl',
      trend: 'text-sm'
    },
    lg: {
      card: 'p-8',
      icon: 'w-12 h-12',
      title: 'text-base',
      value: 'text-3xl',
      trend: 'text-base'
    }
  };
  
  const cardClasses = clsx(
    'border rounded-xl shadow-sm transition-all duration-200',
    colorClasses[color][variant],
    sizeClasses[size].card,
    onClick && 'cursor-pointer hover:shadow-md hover:scale-[1.02]',
    loading && 'animate-pulse',
    className
  );
  
  if (loading) {
    return (
      <div className={cardClasses}>
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-32"></div>
      </div>
    );
  }
  
  return (
    <motion.div
      className={cardClasses}
      onClick={onClick}
      whileHover={onClick ? { y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1">
          <h3 className={clsx('font-medium', sizeClasses[size].title)}>
            {title}
          </h3>
          {period && (
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Calendar size={12} />
              <span>{period}</span>
            </div>
          )}
        </div>
        
        {/* Icon */}
        <div className={clsx(
          'rounded-lg flex items-center justify-center',
          sizeClasses[size].icon,
          colorClasses[color].icon
        )}>
          {icon || getDefaultIcon()}
        </div>
      </div>
      
      {/* Value */}
      <div className="space-y-2">
        <div className={clsx('font-bold', sizeClasses[size].value)}>
          {formatValue(value)}
        </div>
        
        {/* Trend */}
        {showTrend && (trendData.direction !== 'neutral' || trendValue !== undefined) && (
          <div className="flex items-center space-x-2">
            <div className={clsx(
              'flex items-center space-x-1 px-2 py-1 rounded-full',
              sizeClasses[size].trend,
              colorClasses[color].trend[trendData.direction]
            )}>
              {getTrendIcon()}
              <span className="font-medium">{trendData.formatted}</span>
            </div>
            {previousValue !== undefined && (
              <span className="text-xs text-gray-500">
                vs período anterior
              </span>
            )}
          </div>
        )}
        
        {/* Description */}
        {description && (
          <div className="flex items-start space-x-1 text-xs text-gray-600">
            <Info size={12} className="mt-0.5 flex-shrink-0" />
            <span>{description}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default KPICard;