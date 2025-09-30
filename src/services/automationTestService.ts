import { supabase } from './supabaseClient';

export interface TestExecutionData {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  scenario: 'success' | 'error' | 'timeout';
  recordsProcessed: number;
  duration?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface TestLogEntry {
  id: string;
  executionId: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  metadata?: Record<string, any>;
}

export interface TestMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  lastExecution?: Date;
  successRate: number;
}

class AutomationTestService {
  private mockData = {
    companies: [
      { id: 1, name: 'HITSS Brasil', code: 'HITSS_BR' },
      { id: 2, name: 'HITSS Mexico', code: 'HITSS_MX' },
      { id: 3, name: 'HITSS Colombia', code: 'HITSS_CO' }
    ],
    projects: [
      { id: 1, name: 'Projeto Alpha', code: 'ALPHA_2024' },
      { id: 2, name: 'Projeto Beta', code: 'BETA_2024' },
      { id: 3, name: 'Projeto Gamma', code: 'GAMMA_2024' }
    ],
    financialData: [
      { type: 'revenue', amount: 150000, currency: 'BRL' },
      { type: 'expense', amount: 85000, currency: 'BRL' },
      { type: 'investment', amount: 25000, currency: 'BRL' }
    ]
  };

  /**
   * Simula a execução completa de uma automação
   */
  async simulateAutomationExecution(
    scenario: 'success' | 'error' | 'timeout',
    onProgress?: (log: string, recordsProcessed: number) => void
  ): Promise<TestExecutionData> {
    const executionId = `test-exec-${Date.now()}`;
    const startTime = new Date();

    const execution: TestExecutionData = {
      id: executionId,
      status: 'running',
      startTime,
      scenario,
      recordsProcessed: 0
    };

    try {
      // Inserir execução no banco de dados
      await this.insertTestExecution(execution);

      // Simular fases da execução
      const phases = [
        { name: 'Inicializando conexão com Supabase', duration: 800, records: 0 },
        { name: 'Validando permissões RLS', duration: 600, records: 0 },
        { name: 'Carregando dados de teste', duration: 1200, records: 15 },
        { name: 'Executando Edge Function', duration: 2000, records: 45 },
        { name: 'Processando registros financeiros', duration: 3500, records: 120 },
        { name: 'Validando integridade dos dados', duration: 1000, records: 150 },
        { name: 'Finalizando execução', duration: 400, records: 150 }
      ];

      for (let i = 0; i < phases.length; i++) {
        const phase = phases[i];
        
        // Log da fase atual
        await this.addTestLog(executionId, 'info', `${phase.name}...`);
        onProgress?.(phase.name, phase.records);

        // Simular cenário de erro
        if (scenario === 'error' && i === 3) {
          await new Promise(resolve => setTimeout(resolve, phase.duration / 2));
          const errorMsg = 'Falha simulada na Edge Function - Timeout na conexão';
          await this.addTestLog(executionId, 'error', errorMsg);
          throw new Error(errorMsg);
        }

        // Simular timeout
        if (scenario === 'timeout' && i === 4) {
          await new Promise(resolve => setTimeout(resolve, 8000));
          const timeoutMsg = 'Timeout na execução - Processamento excedeu limite de tempo';
          await this.addTestLog(executionId, 'error', timeoutMsg);
          throw new Error(timeoutMsg);
        }

        // Simular processamento
        await new Promise(resolve => setTimeout(resolve, phase.duration));
        execution.recordsProcessed = phase.records;

        // Atualizar progresso no banco
        await this.updateTestExecution(executionId, {
          recordsProcessed: phase.records,
          status: 'running'
        });
      }

      // Finalizar com sucesso
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      execution.status = 'completed';
      execution.endTime = endTime;
      execution.duration = duration;

      await this.updateTestExecution(executionId, {
        status: 'completed',
        endTime,
        duration,
        recordsProcessed: 150
      });

      await this.addTestLog(executionId, 'info', `Execução concluída com sucesso em ${(duration / 1000).toFixed(1)}s`);

      return execution;

    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

      execution.status = 'failed';
      execution.endTime = endTime;
      execution.duration = duration;
      execution.errorMessage = errorMessage;

      await this.updateTestExecution(executionId, {
        status: 'failed',
        endTime,
        duration,
        errorMessage
      });

      await this.addTestLog(executionId, 'error', `Execução falhou: ${errorMessage}`);

      return execution;
    }
  }

  /**
   * Popula dados de teste nas tabelas
   */
  async populateTestData(): Promise<void> {
    try {
      // Inserir dados de teste na tabela de execuções
      const testExecutions = Array.from({ length: 5 }, (_, i) => ({
        id: `test-population-${Date.now()}-${i}`,
        status: i % 4 === 0 ? 'failed' : 'completed',
        start_time: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
        end_time: new Date(Date.now() - (i + 1) * 3600000 + 120000).toISOString(),
        records_processed: 100 + Math.floor(Math.random() * 100),
        duration: 120000 + Math.floor(Math.random() * 60000),
        scenario: ['success', 'error', 'timeout'][Math.floor(Math.random() * 3)],
        metadata: {
          testData: true,
          populatedAt: new Date().toISOString()
        }
      }));

      const { error: execError } = await supabase
        .from('hitss_automation_executions')
        .insert(testExecutions);

      if (execError) {
        console.error('Erro ao inserir execuções de teste:', execError);
        throw execError;
      }

      // Inserir logs de teste
      const testLogs = testExecutions.flatMap(exec => 
        Array.from({ length: 3 + Math.floor(Math.random() * 5) }, (_, i) => ({
          id: `test-log-${exec.id}-${i}`,
          execution_id: exec.id,
          timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          level: ['info', 'warning', 'error'][Math.floor(Math.random() * 3)],
          message: `Log de teste ${i + 1} para execução ${exec.id}`,
          metadata: {
            testData: true,
            phase: `phase-${i + 1}`
          }
        }))
      );

      const { error: logError } = await supabase
        .from('hitss_automation_logs')
        .insert(testLogs);

      if (logError) {
        console.error('Erro ao inserir logs de teste:', logError);
        throw logError;
      }

      console.log('Dados de teste populados com sucesso');
    } catch (error) {
      console.error('Erro ao popular dados de teste:', error);
      throw error;
    }
  }

  /**
   * Limpa todos os dados de teste
   */
  async clearTestData(): Promise<void> {
    try {
      // Limpar logs de teste
      const { error: logError } = await supabase
        .from('hitss_automation_logs')
        .delete()
        .eq('metadata->>testData', 'true');

      if (logError) {
        console.error('Erro ao limpar logs de teste:', logError);
      }

      // Limpar execuções de teste
      const { error: execError } = await supabase
        .from('hitss_automation_executions')
        .delete()
        .eq('metadata->>testData', 'true');

      if (execError) {
        console.error('Erro ao limpar execuções de teste:', execError);
      }

      console.log('Dados de teste limpos com sucesso');
    } catch (error) {
      console.error('Erro ao limpar dados de teste:', error);
      throw error;
    }
  }

  /**
   * Calcula métricas de teste
   */
  async getTestMetrics(): Promise<TestMetrics> {
    try {
      const { data: executions, error } = await supabase
        .from('hitss_automation_executions')
        .select('*')
        .eq('metadata->>testData', 'true')
        .order('start_time', { ascending: false });

      if (error) {
        console.error('Erro ao buscar métricas:', error);
        throw error;
      }

      const totalExecutions = executions?.length || 0;
      const successfulExecutions = executions?.filter(exec => exec.status === 'completed').length || 0;
      const failedExecutions = executions?.filter(exec => exec.status === 'failed').length || 0;
      
      const completedExecutions = executions?.filter(exec => exec.duration) || [];
      const totalDuration = completedExecutions.reduce((sum, exec) => sum + (exec.duration || 0), 0);
      const averageDuration = completedExecutions.length > 0 ? totalDuration / completedExecutions.length : 0;
      
      const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;
      const lastExecution = executions?.[0]?.start_time ? new Date(executions[0].start_time) : undefined;

      return {
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        averageDuration,
        lastExecution,
        successRate
      };
    } catch (error) {
      console.error('Erro ao calcular métricas:', error);
      return {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageDuration: 0,
        successRate: 0
      };
    }
  }

  /**
   * Valida integridade dos dados
   */
  async validateDataIntegrity(): Promise<{
    isValid: boolean;
    issues: string[];
    summary: Record<string, number>;
  }> {
    const issues: string[] = [];
    const summary: Record<string, number> = {};

    try {
      // Verificar execuções órfãs (sem logs)
      const { data: executions } = await supabase
        .from('hitss_automation_executions')
        .select('id')
        .eq('metadata->>testData', 'true');

      const { data: logs } = await supabase
        .from('hitss_automation_logs')
        .select('execution_id')
        .eq('metadata->>testData', 'true');

      const executionIds = new Set(executions?.map(e => e.id) || []);
      const logExecutionIds = new Set(logs?.map(l => l.execution_id) || []);

      const orphanedExecutions = [...executionIds].filter(id => !logExecutionIds.has(id));
      const orphanedLogs = [...logExecutionIds].filter(id => !executionIds.has(id));

      summary.totalExecutions = executionIds.size;
      summary.totalLogs = logs?.length || 0;
      summary.orphanedExecutions = orphanedExecutions.length;
      summary.orphanedLogs = orphanedLogs.length;

      if (orphanedExecutions.length > 0) {
        issues.push(`${orphanedExecutions.length} execuções sem logs encontradas`);
      }

      if (orphanedLogs.length > 0) {
        issues.push(`${orphanedLogs.length} logs órfãos encontrados`);
      }

      // Verificar execuções com duração inválida
      const { data: invalidDurations } = await supabase
        .from('hitss_automation_executions')
        .select('id, duration')
        .eq('metadata->>testData', 'true')
        .or('duration.is.null,duration.lt.0');

      if (invalidDurations && invalidDurations.length > 0) {
        issues.push(`${invalidDurations.length} execuções com duração inválida`);
        summary.invalidDurations = invalidDurations.length;
      }

      return {
        isValid: issues.length === 0,
        issues,
        summary
      };
    } catch (error) {
      console.error('Erro ao validar integridade:', error);
      return {
        isValid: false,
        issues: ['Erro ao validar integridade dos dados'],
        summary
      };
    }
  }

  // Métodos privados para interação com o banco
  private async insertTestExecution(execution: TestExecutionData): Promise<void> {
    const { error } = await supabase
      .from('hitss_automation_executions')
      .insert({
        id: execution.id,
        status: execution.status,
        start_time: execution.startTime.toISOString(),
        records_processed: execution.recordsProcessed,
        scenario: execution.scenario,
        metadata: {
          testData: true,
          createdAt: new Date().toISOString()
        }
      });

    if (error) {
      console.error('Erro ao inserir execução:', error);
      throw error;
    }
  }

  private async updateTestExecution(executionId: string, updates: Partial<TestExecutionData>): Promise<void> {
    const updateData: any = {};
    
    if (updates.status) updateData.status = updates.status;
    if (updates.endTime) updateData.end_time = updates.endTime.toISOString();
    if (updates.duration !== undefined) updateData.duration = updates.duration;
    if (updates.recordsProcessed !== undefined) updateData.records_processed = updates.recordsProcessed;
    if (updates.errorMessage) updateData.error_message = updates.errorMessage;

    const { error } = await supabase
      .from('hitss_automation_executions')
      .update(updateData)
      .eq('id', executionId);

    if (error) {
      console.error('Erro ao atualizar execução:', error);
      throw error;
    }
  }

  private async addTestLog(
    executionId: string, 
    level: 'info' | 'warning' | 'error' | 'debug', 
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const { error } = await supabase
      .from('hitss_automation_logs')
      .insert({
        id: `log-${executionId}-${Date.now()}`,
        execution_id: executionId,
        timestamp: new Date().toISOString(),
        level,
        message,
        metadata: {
          testData: true,
          ...metadata
        }
      });

    if (error) {
      console.error('Erro ao inserir log:', error);
      // Não lançar erro para não interromper a execução
    }
  }

  /**
   * Simula chamada para Edge Function
   */
  async simulateEdgeFunction(scenario: 'success' | 'error' | 'timeout'): Promise<any> {
    const delay = scenario === 'timeout' ? 10000 : 1000 + Math.random() * 2000;
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (scenario === 'error') {
          reject(new Error('Simulação de erro na Edge Function'));
        } else if (scenario === 'timeout') {
          reject(new Error('Timeout na Edge Function'));
        } else {
          resolve({
            success: true,
            data: this.mockData,
            processedAt: new Date().toISOString(),
            recordsCount: 150 + Math.floor(Math.random() * 50)
          });
        }
      }, delay);
    });
  }
}

export const automationTestService = new AutomationTestService();
export default automationTestService;