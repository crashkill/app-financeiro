import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TestTube,
  Activity,
  BarChart3,
  Shield,
  History,
  Monitor,
  RefreshCw,
  Play,
  Settings
} from 'lucide-react';
import TestAutomation from '@/components/automation/TestAutomation';
import TestAutomationHitss from '@/components/TestAutomation';
import TestDashboard from '@/components/automation/TestDashboard';
import DataValidator from '@/components/automation/DataValidator';
import AutomationMonitor from '@/components/automation/AutomationMonitor';
import AutomationHistory from '@/components/automation/AutomationHistory';
import { toast } from 'sonner';

interface SystemStatus {
  testEnvironment: 'active' | 'inactive' | 'error';
  dataIntegrity: 'valid' | 'warning' | 'error';
  automationService: 'running' | 'stopped' | 'error';
  lastUpdate: Date;
}

const AutomationTestPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    testEnvironment: 'active',
    dataIntegrity: 'valid',
    automationService: 'running',
    lastUpdate: new Date()
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshSystemStatus = async () => {
    setIsRefreshing(true);
    
    try {
      // Simular verificação do status do sistema
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSystemStatus({
        testEnvironment: 'active',
        dataIntegrity: 'valid',
        automationService: 'running',
        lastUpdate: new Date()
      });
      
      toast.success('Status do sistema atualizado');
    } catch (error) {
      toast.error('Erro ao atualizar status do sistema');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default' as const, label: 'Ativo' },
      running: { variant: 'default' as const, label: 'Executando' },
      valid: { variant: 'default' as const, label: 'Válido' },
      inactive: { variant: 'secondary' as const, label: 'Inativo' },
      stopped: { variant: 'secondary' as const, label: 'Parado' },
      warning: { variant: 'secondary' as const, label: 'Aviso' },
      error: { variant: 'destructive' as const, label: 'Erro' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                   { variant: 'secondary' as const, label: status };
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const quickActions = [
    {
      title: 'Executar Teste Rápido',
      description: 'Executar um teste básico da automação',
      icon: <Play className="h-4 w-4" />,
      action: () => {
        setActiveTab('test');
        toast.info('Navegando para execução de teste');
      }
    },
    {
      title: 'Verificar Integridade',
      description: 'Validar integridade dos dados de teste',
      icon: <Shield className="h-4 w-4" />,
      action: () => {
        setActiveTab('validation');
        toast.info('Navegando para validação de dados');
      }
    },
    {
      title: 'Ver Métricas',
      description: 'Visualizar dashboard de métricas',
      icon: <BarChart3 className="h-4 w-4" />,
      action: () => {
        setActiveTab('dashboard');
        toast.info('Navegando para dashboard');
      }
    },
    {
      title: 'Monitorar Sistema',
      description: 'Acompanhar execuções em tempo real',
      icon: <Monitor className="h-4 w-4" />,
      action: () => {
        setActiveTab('monitor');
        toast.info('Navegando para monitoramento');
      }
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sistema de Teste da Automação HITSS</h1>
          <p className="text-muted-foreground">
            Ambiente completo para testar execução, população e finalização do processo de automação
          </p>
        </div>
        <Button
          onClick={refreshSystemStatus}
          disabled={isRefreshing}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar Status
        </Button>
      </div>

      {/* System Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ambiente de Teste</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">Sistema</div>
              {getStatusBadge(systemStatus.testEnvironment)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Última atualização: {systemStatus.lastUpdate.toLocaleTimeString('pt-BR')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Integridade dos Dados</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">Dados</div>
              {getStatusBadge(systemStatus.dataIntegrity)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Validação automática ativa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviço de Automação</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">Serviço</div>
              {getStatusBadge(systemStatus.automationService)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Monitoramento contínuo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Ações Rápidas
          </CardTitle>
          <CardDescription>
            Acesso rápido às principais funcionalidades do sistema de teste
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div 
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={action.action}
                  >
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {action.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{action.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {action.description}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="test">Execução de Teste</TabsTrigger>
          <TabsTrigger value="hitss-test">Teste HITSS</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="validation">Validação</TabsTrigger>
          <TabsTrigger value="monitor">Monitoramento</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sobre o Sistema de Teste</CardTitle>
                <CardDescription>
                  Funcionalidades disponíveis neste ambiente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <TestTube className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium">Execução de Testes</div>
                      <div className="text-sm text-muted-foreground">
                        Simular diferentes cenários de automação
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium">Dashboard de Métricas</div>
                      <div className="text-sm text-muted-foreground">
                        Visualizar performance e estatísticas
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium">Validação de Dados</div>
                      <div className="text-sm text-muted-foreground">
                        Verificar integridade e consistência
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Monitor className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium">Monitoramento</div>
                      <div className="text-sm text-muted-foreground">
                        Acompanhar execuções em tempo real
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status do Sistema</CardTitle>
                <CardDescription>
                  Informações detalhadas do ambiente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Ambiente de Teste</span>
                    {getStatusBadge(systemStatus.testEnvironment)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Integridade dos Dados</span>
                    {getStatusBadge(systemStatus.dataIntegrity)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Serviço de Automação</span>
                    {getStatusBadge(systemStatus.automationService)}
                  </div>
                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      Última verificação: {systemStatus.lastUpdate.toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="test">
          <TestAutomation />
        </TabsContent>

        <TabsContent value="hitss-test">
          <TestAutomationHitss />
        </TabsContent>

        <TabsContent value="dashboard">
          <TestDashboard />
        </TabsContent>

        <TabsContent value="validation">
          <DataValidator />
        </TabsContent>

        <TabsContent value="monitor">
          <AutomationMonitor />
        </TabsContent>

        <TabsContent value="history">
          <AutomationHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutomationTestPage;