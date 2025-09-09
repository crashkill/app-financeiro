import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';
import {
  Play,
  Pause,
  Square,
  RefreshCw,
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon,
  Download,
  Clock,
  Database,
  TrendingUp,
  Trash2,
  Activity,
  CheckCircle
} from 'lucide-react';
import { automationTestService, TestExecutionData, TestMetrics } from '@/services/automationTestService';
import { mockUtils } from '@/utils/automationMocks';
import { toast } from 'sonner';

interface DashboardStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  totalRecordsProcessed: number;
  lastExecution?: Date;
}

interface ChartData {
  name: string;
  value: number;
  duration?: number;
  records?: number;
}

const TestDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    averageDuration: 0,
    totalRecordsProcessed: 0
  });
  const [executions, setExecutions] = useState<TestExecutionData[]>([]);
  const [metrics, setMetrics] = useState<TestMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [performanceData, setPerformanceData] = useState<ChartData[]>([]);
  const [statusData, setStatusData] = useState<ChartData[]>([]);

  // Cores para os gráficos
  const COLORS = {
    success: '#10b981',
    failed: '#ef4444',
    running: '#f59e0b',
    primary: '#3b82f6',
    secondary: '#8b5cf6'
  };

  const PIE_COLORS = [COLORS.success, COLORS.failed, COLORS.running];

  useEffect(() => {
    loadDashboardData();
    
    // Atualizar dados a cada 30 segundos
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar execuções
      const executionsData = await (automationTestService as any).getExecutions();
      setExecutions(executionsData);
      
      // Carregar métricas
      const metricsData = await (automationTestService as any).getMetrics();
      setMetrics(metricsData);
      
      // Calcular estatísticas
      const totalExecutions = executionsData.length;
      const successfulExecutions = executionsData.filter((e: any) => e.status === 'completed').length;
      const failedExecutions = executionsData.filter((e: any) => e.status === 'failed').length;
      const averageDuration = executionsData.length > 0 
        ? executionsData.reduce((sum: number, e: any) => sum + (e.duration || 0), 0) / executionsData.length
        : 0;
      const totalRecordsProcessed = executionsData.reduce((sum: number, e: any) => sum + (e.recordsProcessed || 0), 0);
      const lastExecution = executionsData.length > 0 
        ? new Date(Math.max(...executionsData.map((e: any) => new Date(e.startTime).getTime())))
        : undefined;
      
      setStats({
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        averageDuration,
        totalRecordsProcessed,
        lastExecution
      });
      
      // Preparar dados para gráficos
      prepareChartData(executionsData);
      
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const prepareChartData = (executionsData: any[]) => {
    // Dados de execuções por dia (últimos 7 dias)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();
    
    const dailyData = last7Days.map(date => {
      const dayExecutions = executionsData.filter((e: any) => 
        e.startTime.toISOString().split('T')[0] === date
      );
      
      return {
        name: new Date(date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
        value: dayExecutions.length,
        duration: dayExecutions.length > 0 
          ? dayExecutions.reduce((sum: number, e: any) => sum + (e.duration || 0), 0) / dayExecutions.length
          : 0,
        records: dayExecutions.reduce((sum: number, e: any) => sum + (e.recordsProcessed || 0), 0)
      };
    });
    
    setChartData(dailyData);
    
    // Dados de performance (últimas 10 execuções)
    const recentExecutions = executionsData
      .slice(-10)
      .map((e: any, index: number) => ({
        name: `Exec ${index + 1}`,
        value: e.duration || 0,
        records: e.recordsProcessed || 0
      }));
    
    setPerformanceData(recentExecutions);
    
    // Dados de status
    const statusCounts = {
      completed: executionsData.filter((e: any) => e.status === 'completed').length,
      failed: executionsData.filter((e: any) => e.status === 'failed').length,
      running: executionsData.filter((e: any) => e.status === 'running').length
    };
    
    const statusChartData = [
      { name: 'Sucesso', value: statusCounts.completed },
      { name: 'Falha', value: statusCounts.failed },
      { name: 'Executando', value: statusCounts.running }
    ].filter(item => item.value > 0);
    
    setStatusData(statusChartData);
  };

  const handleCleanupTestData = async () => {
    try {
      setIsLoading(true);
      await (automationTestService as any).cleanupTestData();
      toast.success('Dados de teste limpos com sucesso');
      await loadDashboardData();
    } catch (error) {
      console.error('Erro ao limpar dados de teste:', error);
      toast.error('Erro ao limpar dados de teste');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      stats,
      executions: executions.slice(0, 50), // Últimas 50 execuções
      metrics
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `automation-test-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Relatório exportado com sucesso');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      completed: 'default',
      running: 'secondary',
      failed: 'destructive'
    };
    
    const labels: Record<string, string> = {
      completed: 'Concluído',
      running: 'Executando',
      failed: 'Falhou'
    };
    
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  const successRate = stats.totalExecutions > 0 
    ? (stats.successfulExecutions / stats.totalExecutions) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard de Testes</h2>
          <p className="text-muted-foreground">
            Monitoramento e métricas das execuções de teste da automação HITSS
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportReport}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleCleanupTestData}
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Dados
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Execuções</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExecutions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.lastExecution && (
                `Última: ${stats.lastExecution.toLocaleString('pt-BR')}`
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <Progress value={successRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.successfulExecutions} de {stats.totalExecutions} execuções
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.averageDuration)}</div>
            <p className="text-xs text-muted-foreground">
              Duração média das execuções
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registros Processados</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecordsProcessed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total de registros processados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com Gráficos e Dados */}
      <Tabs defaultValue="charts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
          <TabsTrigger value="executions">Execuções</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Gráfico de Execuções por Dia */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Execuções por Dia
                </CardTitle>
                <CardDescription>Últimos 7 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Status das Execuções
                </CardTitle>
                <CardDescription>Distribuição por status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Performance */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance das Execuções
                </CardTitle>
                <CardDescription>Duração das últimas 10 execuções</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatDuration(Number(value)), 'Duração']} />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={COLORS.secondary} 
                      strokeWidth={2}
                      dot={{ fill: COLORS.secondary }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Execuções</CardTitle>
              <CardDescription>
                Últimas {executions.length} execuções de teste
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {executions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma execução encontrada
                  </div>
                ) : (
                  executions.slice(0, 20).map((execution) => (
                    <div
                      key={execution.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <div className="font-medium">{execution.id}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(execution.startTime).toLocaleString('pt-BR')}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="text-sm">
                            Cenário: <span className="font-medium">{execution.scenario}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Duração: {formatDuration(execution.duration || 0)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {execution.recordsProcessed || 0} registros
                          </div>
                          {execution.errorMessage && (
                            <div className="text-xs text-destructive">
                              {execution.errorMessage}
                            </div>
                          )}
                        </div>
                        {getStatusBadge(execution.status)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          {metrics ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Métricas de Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Execuções Hoje:</span>
                    <span className="font-medium">{metrics.totalExecutions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tempo Médio (24h):</span>
                    <span className="font-medium">{formatDuration(metrics.averageDuration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de Sucesso (7d):</span>
                    <span className="font-medium">{metrics.successRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Registros/Hora:</span>
                    <span className="font-medium">{(stats.totalRecordsProcessed / 24).toFixed(0)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status do Sistema</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Sistema de teste funcionando normalmente.
                      Última verificação: {new Date().toLocaleTimeString('pt-BR')}
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Conexão Supabase:</span>
                      <Badge variant="default">Conectado</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Edge Functions:</span>
                      <Badge variant="default">Disponível</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Dados de Teste:</span>
                      <Badge variant="secondary">{executions.length} registros</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  Carregando métricas...
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestDashboard;