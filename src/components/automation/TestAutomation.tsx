import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 as Spinner } from 'lucide-react';
import { toast } from 'sonner';

interface TestExecution {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  logs: string[];
  scenario: 'success' | 'error' | 'timeout';
  recordsProcessed: number;
  duration?: number;
}

interface TestMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  lastExecution?: Date;
}

const TestAutomation: React.FC = () => {
  const [executions, setExecutions] = useState<TestExecution[]>([]);
  const [currentExecution, setCurrentExecution] = useState<TestExecution | null>(null);
  const [metrics, setMetrics] = useState<TestMetrics>({
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    averageDuration: 0
  });
  const [isRunning, setIsRunning] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<'success' | 'error' | 'timeout'>('success');

  // Simular execução de teste
  const startTestExecution = async (scenario: 'success' | 'error' | 'timeout') => {
    if (isRunning) {
      toast.error('Teste em Andamento: Aguarde a conclusão do teste atual.');
      return;
    }

    setIsRunning(true);
    const executionId = `test-${Date.now()}`;
    const startTime = new Date();

    const newExecution: TestExecution = {
      id: executionId,
      status: 'running',
      startTime,
      logs: [`[${startTime.toLocaleTimeString()}] Iniciando teste de automação - Cenário: ${scenario}`],
      scenario,
      recordsProcessed: 0
    };

    setCurrentExecution(newExecution);
    setExecutions(prev => [newExecution, ...prev]);

    try {
      // Simular diferentes fases da execução
      await simulateExecutionPhases(newExecution, scenario);
    } catch (error) {
      console.error('Erro durante execução do teste:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // Simular fases da execução
  const simulateExecutionPhases = async (execution: TestExecution, scenario: 'success' | 'error' | 'timeout') => {
    const phases = [
      { name: 'Inicializando conexão com Supabase', duration: 1000 },
      { name: 'Validando permissões RLS', duration: 800 },
      { name: 'Populando dados de teste', duration: 1500 },
      { name: 'Executando Edge Function', duration: 2000 },
      { name: 'Processando registros', duration: 3000 },
      { name: 'Finalizando execução', duration: 500 }
    ];

    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      const timestamp = new Date().toLocaleTimeString();
      
      // Atualizar logs
      setCurrentExecution(prev => {
        if (!prev) return null;
        const updatedExecution = {
          ...prev,
          logs: [...prev.logs, `[${timestamp}] ${phase.name}...`],
          recordsProcessed: Math.floor((i + 1) * 10 + Math.random() * 20)
        };
        
        // Atualizar na lista também
        setExecutions(prevExecs => 
          prevExecs.map(exec => exec.id === prev.id ? updatedExecution : exec)
        );
        
        return updatedExecution;
      });

      // Simular cenário de erro
      if (scenario === 'error' && i === 3) {
        await new Promise(resolve => setTimeout(resolve, phase.duration / 2));
        throw new Error('Falha simulada na Edge Function');
      }

      // Simular timeout
      if (scenario === 'timeout' && i === 4) {
        await new Promise(resolve => setTimeout(resolve, 8000));
        throw new Error('Timeout na execução');
      }

      await new Promise(resolve => setTimeout(resolve, phase.duration));
    }

    // Finalizar execução com sucesso
    const endTime = new Date();
    const duration = endTime.getTime() - execution.startTime.getTime();
    
    setCurrentExecution(prev => {
      if (!prev) return null;
      const finalExecution = {
        ...prev,
        status: 'completed' as const,
        endTime,
        duration,
        logs: [...prev.logs, `[${endTime.toLocaleTimeString()}] Execução concluída com sucesso!`],
        recordsProcessed: 150 + Math.floor(Math.random() * 50)
      };
      
      setExecutions(prevExecs => 
        prevExecs.map(exec => exec.id === prev.id ? finalExecution : exec)
      );
      
      return finalExecution;
    });

    toast.success(`Teste Concluído: Execução finalizada em ${(duration / 1000).toFixed(1)}s`);
  };

  // Limpar dados de teste
  const clearTestData = () => {
    setExecutions([]);
    setCurrentExecution(null);
    setMetrics({
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageDuration: 0
    });
    toast.success('Dados Limpos: Todos os dados de teste foram removidos.');
  };

  // Atualizar métricas quando execuções mudarem
  useEffect(() => {
    const completedExecutions = executions.filter(exec => exec.status === 'completed' || exec.status === 'failed');
    const successfulExecutions = executions.filter(exec => exec.status === 'completed');
    const failedExecutions = executions.filter(exec => exec.status === 'failed');
    
    const totalDuration = completedExecutions.reduce((sum, exec) => sum + (exec.duration || 0), 0);
    const averageDuration = completedExecutions.length > 0 ? totalDuration / completedExecutions.length : 0;
    
    setMetrics({
      totalExecutions: executions.length,
      successfulExecutions: successfulExecutions.length,
      failedExecutions: failedExecutions.length,
      averageDuration,
      lastExecution: executions.length > 0 ? executions[0].startTime : undefined
    });
  }, [executions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Sistema de Teste - Automação HITSS
        </h2>
        <Button
          onClick={clearTestData}
          variant="outline"
          disabled={isRunning}
          className="text-red-600 border-red-600 hover:bg-red-50"
        >
          Limpar Dados
        </Button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Execuções</div>
          <div className="text-2xl font-bold text-blue-600">{metrics.totalExecutions}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Sucessos</div>
          <div className="text-2xl font-bold text-green-600">{metrics.successfulExecutions}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Falhas</div>
          <div className="text-2xl font-bold text-red-600">{metrics.failedExecutions}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Duração Média</div>
          <div className="text-2xl font-bold text-purple-600">
            {(metrics.averageDuration / 1000).toFixed(1)}s
          </div>
        </Card>
      </div>

      {/* Controles de Teste */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Controles de Teste</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Cenário de Teste:</label>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value as 'success' | 'error' | 'timeout')}
              disabled={isRunning}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="success">Execução Bem-sucedida</option>
              <option value="error">Falha na Edge Function</option>
              <option value="timeout">Timeout na Execução</option>
            </select>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => startTestExecution(selectedScenario)}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning && <Spinner className="w-4 h-4" />}
              {isRunning ? 'Executando...' : 'Iniciar Teste'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Execução Atual */}
      {currentExecution && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Execução Atual</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                currentExecution.status === 'running' ? 'bg-blue-100 text-blue-800' :
                currentExecution.status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {currentExecution.status === 'running' ? 'Em Execução' :
                 currentExecution.status === 'completed' ? 'Concluído' : 'Falhou'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Registros Processados:</span>
              <span className="text-blue-600 font-semibold">{currentExecution.recordsProcessed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Duração:</span>
              <span className="text-purple-600 font-semibold">
                {currentExecution.duration ? 
                  `${(currentExecution.duration / 1000).toFixed(1)}s` : 
                  `${((Date.now() - currentExecution.startTime.getTime()) / 1000).toFixed(1)}s`
                }
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Logs da Execução Atual */}
      {currentExecution && currentExecution.logs.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Logs em Tempo Real</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm max-h-64 overflow-y-auto">
            {currentExecution.logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))}
          </div>
        </Card>
      )}

      {/* Histórico de Execuções */}
      {executions.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Histórico de Execuções</h3>
          <div className="space-y-3">
            {executions.slice(0, 5).map((execution) => (
              <div key={execution.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <div>
                  <div className="font-medium">{execution.id}</div>
                  <div className="text-sm text-gray-500">
                    {execution.startTime.toLocaleString()} - Cenário: {execution.scenario}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    execution.status === 'running' ? 'bg-blue-100 text-blue-800' :
                    execution.status === 'completed' ? 'bg-green-100 text-green-800' :
                    execution.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {execution.status === 'running' ? 'Em Execução' :
                     execution.status === 'completed' ? 'Concluído' :
                     execution.status === 'failed' ? 'Falhou' : 'Pendente'}
                  </div>
                  {execution.duration && (
                    <div className="text-sm text-gray-500 mt-1">
                      {(execution.duration / 1000).toFixed(1)}s
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default TestAutomation;