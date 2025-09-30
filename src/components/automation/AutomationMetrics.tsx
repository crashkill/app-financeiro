import React from 'react';
import { Activity, CheckCircle, XCircle, Clock, Database, TrendingUp } from 'lucide-react';

interface AutomationMetricsProps {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  totalRecordsProcessed: number;
  averageExecutionTime: number;
  lastExecutionStatus: 'success' | 'error' | 'running' | 'idle';
}

const AutomationMetrics: React.FC<AutomationMetricsProps> = ({
  totalExecutions,
  successfulExecutions,
  failedExecutions,
  totalRecordsProcessed,
  averageExecutionTime,
  lastExecutionStatus
}) => {
  const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'running': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5" />;
      case 'error': return <XCircle className="w-5 h-5" />;
      case 'running': return <Activity className="w-5 h-5 animate-pulse" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {/* Status Atual */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Status Atual</p>
            <p className="text-lg font-semibold text-gray-900 capitalize">
              {lastExecutionStatus === 'success' ? 'Sucesso' :
               lastExecutionStatus === 'error' ? 'Erro' :
               lastExecutionStatus === 'running' ? 'Executando' : 'Inativo'}
            </p>
          </div>
          <div className={`p-2 rounded-full ${getStatusColor(lastExecutionStatus)}`}>
            {getStatusIcon(lastExecutionStatus)}
          </div>
        </div>
      </div>

      {/* Taxa de Sucesso */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Taxa de Sucesso</p>
            <p className="text-lg font-semibold text-gray-900">
              {successRate.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">
              {formatNumber(successfulExecutions)} de {formatNumber(totalExecutions)} execuções
            </p>
          </div>
          <div className="p-2 rounded-full bg-blue-100 text-blue-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${successRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Total de Execuções */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total de Execuções</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatNumber(totalExecutions)}
            </p>
            <p className="text-xs text-gray-500">
              {formatNumber(failedExecutions)} falhas
            </p>
          </div>
          <div className="p-2 rounded-full bg-purple-100 text-purple-600">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Registros Processados */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Registros Processados</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatNumber(totalRecordsProcessed)}
            </p>
            <p className="text-xs text-gray-500">
              Total acumulado
            </p>
          </div>
          <div className="p-2 rounded-full bg-indigo-100 text-indigo-600">
            <Database className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tempo Médio */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatTime(averageExecutionTime)}
            </p>
            <p className="text-xs text-gray-500">
              Por execução
            </p>
          </div>
          <div className="p-2 rounded-full bg-orange-100 text-orange-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Performance */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Performance</p>
            <p className="text-lg font-semibold text-gray-900">
              {successRate >= 95 ? 'Excelente' :
               successRate >= 85 ? 'Boa' :
               successRate >= 70 ? 'Regular' : 'Baixa'}
            </p>
            <p className="text-xs text-gray-500">
              Baseado na taxa de sucesso
            </p>
          </div>
          <div className={`p-2 rounded-full ${
            successRate >= 95 ? 'bg-green-100 text-green-600' :
            successRate >= 85 ? 'bg-blue-100 text-blue-600' :
            successRate >= 70 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
          }`}>
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomationMetrics;