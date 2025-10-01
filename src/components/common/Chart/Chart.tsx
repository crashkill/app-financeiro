import React from 'react';
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
  ResponsiveContainer
} from 'recharts';
import { clsx } from 'clsx';

export interface ChartDataPoint {
  [key: string]: any;
}

export interface ChartSeries {
  dataKey: string;
  name?: string;
  color?: string;
  strokeWidth?: number;
  fill?: string;
  stroke?: string;
}

export interface ChartProps {
  type: 'line' | 'area' | 'bar' | 'pie';
  data: ChartDataPoint[];
  series: ChartSeries[];
  xAxisKey?: string;
  width?: number | string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  className?: string;
  colors?: string[];
  loading?: boolean;
  emptyText?: string;
}

const DEFAULT_COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
  '#EC4899', // pink-500
  '#6B7280'  // gray-500
];

const Chart: React.FC<ChartProps> = ({
  type,
  data,
  series,
  xAxisKey,
  width = '100%',
  height = 300,
  showGrid = true,
  showTooltip = true,
  showLegend = true,
  showXAxis = true,
  showYAxis = true,
  className,
  colors = DEFAULT_COLORS,
  loading = false,
  emptyText = 'Nenhum dado disponível'
}) => {
  const containerClasses = clsx(
    'w-full',
    className
  );
  
  if (loading) {
    return (
      <div className={clsx(containerClasses, 'flex items-center justify-center')} style={{ height }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando gráfico...</span>
      </div>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <div className={clsx(containerClasses, 'flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg')} style={{ height }}>
        <span className="text-gray-500 dark:text-gray-400">{emptyText}</span>
      </div>
    );
  }
  
  const renderTooltip = (props: any) => {
    if (!props.active || !props.payload || !props.label) return null;
    
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          {props.label}
        </p>
        {props.payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
            <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString('pt-BR') : entry.value}
          </p>
        ))}
      </div>
    );
  };
  
  const renderChart = () => {
    const commonProps = {
      data,
      width: typeof width === 'string' ? undefined : width,
      height
    };
    
    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="opacity-30" />}
            {showXAxis && <XAxis dataKey={xAxisKey} className="text-xs fill-gray-600 dark:fill-gray-400" />}
            {showYAxis && <YAxis className="text-xs fill-gray-600 dark:fill-gray-400" />}
            {showTooltip && <Tooltip content={renderTooltip} />}
            {showLegend && <Legend />}
            {series.map((s, index) => (
              <Line
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name || s.dataKey}
                stroke={s.stroke || s.color || colors[index % colors.length]}
                strokeWidth={s.strokeWidth || 2}
                dot={{ fill: s.stroke || s.color || colors[index % colors.length], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        );
        
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="opacity-30" />}
            {showXAxis && <XAxis dataKey={xAxisKey} className="text-xs fill-gray-600 dark:fill-gray-400" />}
            {showYAxis && <YAxis className="text-xs fill-gray-600 dark:fill-gray-400" />}
            {showTooltip && <Tooltip content={renderTooltip} />}
            {showLegend && <Legend />}
            {series.map((s, index) => (
              <Area
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name || s.dataKey}
                stroke={s.stroke || s.color || colors[index % colors.length]}
                fill={s.fill || s.color || colors[index % colors.length]}
                fillOpacity={0.6}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        );
        
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" className="opacity-30" />}
            {showXAxis && <XAxis dataKey={xAxisKey} className="text-xs fill-gray-600 dark:fill-gray-400" />}
            {showYAxis && <YAxis className="text-xs fill-gray-600 dark:fill-gray-400" />}
            {showTooltip && <Tooltip content={renderTooltip} />}
            {showLegend && <Legend />}
            {series.map((s, index) => (
              <Bar
                key={s.dataKey}
                dataKey={s.dataKey}
                name={s.name || s.dataKey}
                fill={s.fill || s.color || colors[index % colors.length]}
                radius={[2, 2, 0, 0]}
              />
            ))}
          </BarChart>
        );
        
      case 'pie':
        const pieData = data.map((item, index) => ({
          ...item,
          fill: colors[index % colors.length]
        }));
        
        return (
          <PieChart {...commonProps}>
            {showTooltip && <Tooltip content={renderTooltip} />}
            {showLegend && <Legend />}
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={Math.min(height * 0.35, 120)}
              dataKey={series[0]?.dataKey || 'value'}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className={containerClasses}>
      <ResponsiveContainer width={width} height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default Chart