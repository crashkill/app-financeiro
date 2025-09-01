import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  Maximize2,
  Settings
} from 'lucide-react';
import { Button, Loading } from '../../common';

export interface FinancialDataPoint {
  date: string;
  [key: string]: string | number;
}

export interface ChartSeries {
  key: string;
  name: string;
  color: string;
  type?: 'monotone' | 'linear' | 'step';
  strokeWidth?: number;
  fillOpacity?: number;
}

export interface FinancialChartProps {
  data: FinancialDataPoint[];
  series: ChartSeries[];
  type: 'line' | 'area' | 'bar' | 'pie' | 'combo';
  title?: string;
  subtitle?: string;
  height?: number;
  loading?: boolean;
  error?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  currency?: string;
  precision?: number;
  dateFormat?: string;
  className?: string;
  onDataPointClick?: (data: any) => void;
  onExport?: () => void;
  onFullscreen?: () => void;
  onSettings?: () => void;
  referenceLines?: Array<{
    value: number;
    label?: string;
    color?: string;
    strokeDasharray?: string;
  }>;
  customTooltip?: React.ComponentType<any>;
  theme?: 'light' | 'dark';
  animate?: boolean;
  showControls?: boolean;
}

const defaultColors = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#06B6D4', // cyan
  '#F97316', // orange
  '#84CC16', // lime
];

const FinancialChart: React.FC<FinancialChartProps> = ({
  data,
  series,
  type,
  title,
  subtitle,
  height = 400,
  loading = false,
  error,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  currency = 'BRL',
  precision = 2,
  dateFormat = 'dd/MM/yyyy',
  className,
  onDataPointClick,
  onExport,
  onFullscreen,
  onSettings,
  referenceLines = [],
  customTooltip,
  theme = 'light',
  animate = true,
  showControls = true
}) => {
  const [chartType, setChartType] = React.useState(type);
  
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    }).format(value);
  };
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          {formatDate(label)}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600 dark:text-gray-300">
              {entry.name}:
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {typeof entry.value === 'number' ? formatCurrency(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };
  
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
      onClick: onDataPointClick
    };
    
    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="opacity-30" />}
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              className="text-xs"
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(value)}
              className="text-xs"
            />
            {showTooltip && (
              <Tooltip />
            )}
            {showLegend && <Legend />}
            {referenceLines.map((line, index) => (
              <ReferenceLine
                key={index}
                y={line.value}
                stroke={line.color || '#666'}
                strokeDasharray={line.strokeDasharray || '5 5'}
                label={line.label}
              />
            ))}
            {series.map((s, index) => (
              <Line
                key={s.key}
                type={s.type || 'monotone'}
                dataKey={s.key}
                name={s.name}
                stroke={s.color || defaultColors[index % defaultColors.length]}
                strokeWidth={s.strokeWidth || 2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                animationDuration={animate ? 1000 : 0}
              />
            ))}
          </LineChart>
        );
      
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="opacity-30" />}
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              className="text-xs"
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(value)}
              className="text-xs"
            />
            {showTooltip && (
              <Tooltip />
            )}
            {showLegend && <Legend />}
            {referenceLines.map((line, index) => (
              <ReferenceLine
                key={index}
                y={line.value}
                stroke={line.color || '#666'}
                strokeDasharray={line.strokeDasharray || '5 5'}
                label={line.label}
              />
            ))}
            {series.map((s, index) => (
              <Area
                key={s.key}
                type={s.type || 'monotone'}
                dataKey={s.key}
                name={s.name}
                stroke={s.color || defaultColors[index % defaultColors.length]}
                fill={s.color || defaultColors[index % defaultColors.length]}
                fillOpacity={s.fillOpacity || 0.3}
                strokeWidth={s.strokeWidth || 2}
                animationDuration={animate ? 1000 : 0}
              />
            ))}
          </AreaChart>
        );
      
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="opacity-30" />}
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              className="text-xs"
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(value)}
              className="text-xs"
            />
            {showTooltip && (
              <Tooltip />
            )}
            {showLegend && <Legend />}
            {referenceLines.map((line, index) => (
              <ReferenceLine
                key={index}
                y={line.value}
                stroke={line.color || '#666'}
                strokeDasharray={line.strokeDasharray || '5 5'}
                label={line.label}
              />
            ))}
            {series.map((s, index) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                fill={s.color || defaultColors[index % defaultColors.length]}
                animationDuration={animate ? 1000 : 0}
              />
            ))}
          </BarChart>
        );
      
      case 'pie':
        const pieData = data.map((item, index) => ({
          name: item.date,
          value: item[series[0]?.key] || 0,
          color: defaultColors[index % defaultColors.length]
        }));
        
        return (
          <PieChart {...commonProps}>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              animationDuration={animate ? 1000 : 0}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            {showTooltip && (
              <Tooltip
                formatter={(value: any) => [formatCurrency(Number(value)), 'Valor']}
              />
            )}
          </PieChart>
        );
      
      default:
        return null;
    }
  };
  
  if (loading) {
    return (
      <div className={clsx('bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6', className)}>
        <div className="flex items-center justify-center" style={{ height }}>
          <Loading size="lg" text="Carregando gráfico..." />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={clsx('bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6', className)}>
        <div className="flex items-center justify-center text-red-500" style={{ height }}>
          <div className="text-center">
            <p className="text-lg font-medium mb-2">Erro ao carregar gráfico</p>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <div className={clsx('bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6', className)}>
        <div className="flex items-center justify-center text-gray-500" style={{ height }}>
          <div className="text-center">
            <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Nenhum dado disponível</p>
            <p className="text-sm">Não há dados para exibir no gráfico</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm',
        className
      )}
    >
      {/* Header */}
      {(title || showControls) && (
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          
          {showControls && (
            <div className="flex items-center space-x-2">
              {/* Chart Type Toggles */}
              <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <Button
                  variant={chartType === 'line' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setChartType('line')}
                  className="p-2"
                >
                  <TrendingUp size={16} />
                </Button>
                <Button
                  variant={chartType === 'bar' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setChartType('bar')}
                  className="p-2"
                >
                  <BarChart3 size={16} />
                </Button>
                <Button
                  variant={chartType === 'pie' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setChartType('pie')}
                  className="p-2"
                >
                  <PieChartIcon size={16} />
                </Button>
              </div>
              
              {/* Action Buttons */}
              {onExport && (
                <Button variant="ghost" size="sm" onClick={onExport} className="p-2">
                  <Download size={16} />
                </Button>
              )}
              {onFullscreen && (
                <Button variant="ghost" size="sm" onClick={onFullscreen} className="p-2">
                  <Maximize2 size={16} />
                </Button>
              )}
              {onSettings && (
                <Button variant="ghost" size="sm" onClick={onSettings} className="p-2">
                  <Settings size={16} />
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Chart */}
      <div className="p-6">
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default FinancialChart;