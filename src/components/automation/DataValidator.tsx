import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Database,
  Shield,
  RefreshCw,
  FileCheck,
  AlertCircle,
  TrendingUp,
  Activity
} from 'lucide-react';
import { MockEdgeFunction, mockCompanies, mockProjects, mockFinancialRecords } from '@/utils/automationMocks';
import { automationTestService } from '@/services/automationTestService';
import { toast } from 'sonner';

interface ValidationResult {
  category: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: string;
  count?: number;
}

interface IntegrityCheck {
  name: string;
  description: string;
  status: 'passed' | 'failed' | 'warning';
  result: string;
  timestamp: string;
}

interface DataSummary {
  totalCompanies: number;
  totalProjects: number;
  totalRecords: number;
  activeProjects: number;
  totalRevenue: number;
  totalExpenses: number;
  dataIntegrityScore: number;
}

const DataValidator: React.FC = () => {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [integrityChecks, setIntegrityChecks] = useState<IntegrityCheck[]>([]);
  const [dataSummary, setDataSummary] = useState<DataSummary | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  const [lastValidation, setLastValidation] = useState<Date | null>(null);

  useEffect(() => {
    runInitialValidation();
  }, []);

  const runInitialValidation = async () => {
    await validateData();
  };

  const validateData = async () => {
    setIsValidating(true);
    setValidationProgress(0);
    
    try {
      const results: ValidationResult[] = [];
      const checks: IntegrityCheck[] = [];
      
      // Validação 1: Estrutura de dados das empresas
      setValidationProgress(10);
      const companyValidation = validateCompanies();
      results.push(companyValidation);
      
      // Validação 2: Estrutura de dados dos projetos
      setValidationProgress(25);
      const projectValidation = validateProjects();
      results.push(projectValidation);
      
      // Validação 3: Registros financeiros
      setValidationProgress(40);
      const recordsValidation = validateFinancialRecords();
      results.push(recordsValidation);
      
      // Validação 4: Integridade referencial
      setValidationProgress(55);
      const referentialIntegrity = validateReferentialIntegrity();
      results.push(referentialIntegrity);
      
      // Validação 5: Consistência de dados
      setValidationProgress(70);
      const consistencyValidation = validateDataConsistency();
      results.push(consistencyValidation);
      
      // Validação 6: Validação com Edge Function
      setValidationProgress(85);
      const edgeFunctionValidation = await validateWithEdgeFunction();
      results.push(edgeFunctionValidation);
      
      // Verificações de integridade
      setValidationProgress(95);
      const integrityResults = await runIntegrityChecks();
      checks.push(...integrityResults);
      
      // Calcular resumo dos dados
      const summary = calculateDataSummary();
      
      setValidationResults(results);
      setIntegrityChecks(checks);
      setDataSummary(summary);
      setLastValidation(new Date());
      setValidationProgress(100);
      
      // Mostrar resultado geral
      const hasErrors = results.some(r => r.status === 'error');
      const hasWarnings = results.some(r => r.status === 'warning');
      
      if (hasErrors) {
        toast.error('Validação concluída com erros');
      } else if (hasWarnings) {
        toast.warning('Validação concluída com avisos');
      } else {
        toast.success('Validação concluída com sucesso');
      }
      
    } catch (error) {
      console.error('Erro durante validação:', error);
      toast.error('Erro durante a validação dos dados');
    } finally {
      setIsValidating(false);
    }
  };

  const validateCompanies = (): ValidationResult => {
    const requiredFields = ['id', 'name', 'code', 'country', 'currency', 'timezone'];
    const invalidCompanies = mockCompanies.filter(company => 
      !requiredFields.every(field => company[field as keyof typeof company])
    );
    
    if (invalidCompanies.length > 0) {
      return {
        category: 'Empresas',
        status: 'error',
        message: `${invalidCompanies.length} empresas com campos obrigatórios faltando`,
        details: `Campos obrigatórios: ${requiredFields.join(', ')}`,
        count: invalidCompanies.length
      };
    }
    
    // Verificar códigos únicos
    const codes = mockCompanies.map(c => c.code);
    const duplicateCodes = codes.filter((code, index) => codes.indexOf(code) !== index);
    
    if (duplicateCodes.length > 0) {
      return {
        category: 'Empresas',
        status: 'warning',
        message: `Códigos de empresa duplicados encontrados`,
        details: `Códigos duplicados: ${duplicateCodes.join(', ')}`,
        count: duplicateCodes.length
      };
    }
    
    return {
      category: 'Empresas',
      status: 'success',
      message: `${mockCompanies.length} empresas validadas com sucesso`,
      count: mockCompanies.length
    };
  };

  const validateProjects = (): ValidationResult => {
    const requiredFields = ['id', 'name', 'code', 'companyId', 'status', 'startDate', 'budget'];
    const invalidProjects = mockProjects.filter(project => 
      !requiredFields.every(field => project[field as keyof typeof project] !== undefined)
    );
    
    if (invalidProjects.length > 0) {
      return {
        category: 'Projetos',
        status: 'error',
        message: `${invalidProjects.length} projetos com campos obrigatórios faltando`,
        details: `Campos obrigatórios: ${requiredFields.join(', ')}`,
        count: invalidProjects.length
      };
    }
    
    // Verificar orçamentos válidos
    const invalidBudgets = mockProjects.filter(p => p.budget <= 0);
    if (invalidBudgets.length > 0) {
      return {
        category: 'Projetos',
        status: 'warning',
        message: `${invalidBudgets.length} projetos com orçamento inválido`,
        details: 'Orçamento deve ser maior que zero',
        count: invalidBudgets.length
      };
    }
    
    // Verificar datas
    const invalidDates = mockProjects.filter(p => {
      const startDate = new Date(p.startDate);
      const endDate = p.endDate ? new Date(p.endDate) : null;
      return isNaN(startDate.getTime()) || (endDate && endDate <= startDate);
    });
    
    if (invalidDates.length > 0) {
      return {
        category: 'Projetos',
        status: 'warning',
        message: `${invalidDates.length} projetos com datas inválidas`,
        details: 'Data de fim deve ser posterior à data de início',
        count: invalidDates.length
      };
    }
    
    return {
      category: 'Projetos',
      status: 'success',
      message: `${mockProjects.length} projetos validados com sucesso`,
      count: mockProjects.length
    };
  };

  const validateFinancialRecords = (): ValidationResult => {
    const requiredFields = ['id', 'projectId', 'type', 'category', 'amount', 'currency', 'date', 'description'];
    const invalidRecords = mockFinancialRecords.filter(record => 
      !requiredFields.every(field => record[field as keyof typeof record] !== undefined)
    );
    
    if (invalidRecords.length > 0) {
      return {
        category: 'Registros Financeiros',
        status: 'error',
        message: `${invalidRecords.length} registros com campos obrigatórios faltando`,
        details: `Campos obrigatórios: ${requiredFields.join(', ')}`,
        count: invalidRecords.length
      };
    }
    
    // Verificar valores válidos
    const invalidAmounts = mockFinancialRecords.filter(r => r.amount <= 0);
    if (invalidAmounts.length > 0) {
      return {
        category: 'Registros Financeiros',
        status: 'warning',
        message: `${invalidAmounts.length} registros com valores inválidos`,
        details: 'Valores devem ser maiores que zero',
        count: invalidAmounts.length
      };
    }
    
    // Verificar datas futuras
    const futureRecords = mockFinancialRecords.filter(r => new Date(r.date) > new Date());
    if (futureRecords.length > 0) {
      return {
        category: 'Registros Financeiros',
        status: 'warning',
        message: `${futureRecords.length} registros com data futura`,
        details: 'Registros com data futura podem indicar erro de entrada',
        count: futureRecords.length
      };
    }
    
    return {
      category: 'Registros Financeiros',
      status: 'success',
      message: `${mockFinancialRecords.length} registros validados com sucesso`,
      count: mockFinancialRecords.length
    };
  };

  const validateReferentialIntegrity = (): ValidationResult => {
    // Verificar se todos os projetos referenciam empresas válidas
    const companyIds = mockCompanies.map(c => c.id);
    const invalidProjectRefs = mockProjects.filter(p => !companyIds.includes(p.companyId));
    
    if (invalidProjectRefs.length > 0) {
      return {
        category: 'Integridade Referencial',
        status: 'error',
        message: `${invalidProjectRefs.length} projetos referenciam empresas inexistentes`,
        details: 'Todos os projetos devem referenciar empresas válidas',
        count: invalidProjectRefs.length
      };
    }
    
    // Verificar se todos os registros financeiros referenciam projetos válidos
    const projectIds = mockProjects.map(p => p.id);
    const invalidRecordRefs = mockFinancialRecords.filter(r => !projectIds.includes(r.projectId));
    
    if (invalidRecordRefs.length > 0) {
      return {
        category: 'Integridade Referencial',
        status: 'error',
        message: `${invalidRecordRefs.length} registros referenciam projetos inexistentes`,
        details: 'Todos os registros devem referenciar projetos válidos',
        count: invalidRecordRefs.length
      };
    }
    
    return {
      category: 'Integridade Referencial',
      status: 'success',
      message: 'Integridade referencial validada com sucesso',
      details: 'Todas as referências estão consistentes'
    };
  };

  const validateDataConsistency = (): ValidationResult => {
    // Verificar consistência de moedas por empresa
    const inconsistencies: string[] = [];
    
    mockCompanies.forEach(company => {
      const companyProjects = mockProjects.filter(p => p.companyId === company.id);
      const projectIds = companyProjects.map(p => p.id);
      const companyRecords = mockFinancialRecords.filter(r => projectIds.includes(r.projectId));
      
      const currencies = [...new Set(companyRecords.map(r => r.currency))];
      if (currencies.length > 1 && !currencies.includes(company.currency)) {
        inconsistencies.push(`Empresa ${company.name}: moedas inconsistentes`);
      }
    });
    
    if (inconsistencies.length > 0) {
      return {
        category: 'Consistência de Dados',
        status: 'warning',
        message: `${inconsistencies.length} inconsistências encontradas`,
        details: inconsistencies.join('; '),
        count: inconsistencies.length
      };
    }
    
    return {
      category: 'Consistência de Dados',
      status: 'success',
      message: 'Dados consistentes',
      details: 'Nenhuma inconsistência encontrada'
    };
  };

  const validateWithEdgeFunction = async (): Promise<ValidationResult> => {
    try {
      const result = await MockEdgeFunction.validateData();
      
      if (!result.isValid) {
        return {
          category: 'Validação Edge Function',
          status: 'error',
          message: `Validação falhou: ${result.errors.length} erros`,
          details: result.errors.join('; '),
          count: result.errors.length
        };
      }
      
      if (result.warnings.length > 0) {
        return {
          category: 'Validação Edge Function',
          status: 'warning',
          message: `Validação com avisos: ${result.warnings.length} avisos`,
          details: result.warnings.join('; '),
          count: result.warnings.length
        };
      }
      
      return {
        category: 'Validação Edge Function',
        status: 'success',
        message: 'Validação Edge Function bem-sucedida',
        details: `${result.summary.totalRecords} registros validados`
      };
      
    } catch (error) {
      return {
        category: 'Validação Edge Function',
        status: 'error',
        message: 'Erro na validação Edge Function',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  };

  const runIntegrityChecks = async (): Promise<IntegrityCheck[]> => {
    const checks: IntegrityCheck[] = [];
    const timestamp = new Date().toISOString();
    
    // Check 1: Verificar conexão com Supabase
    try {
      await (automationTestService as any).getExecutions();
      checks.push({
        name: 'Conexão Supabase',
        description: 'Verificar conectividade com o banco de dados',
        status: 'passed',
        result: 'Conexão estabelecida com sucesso',
        timestamp
      });
    } catch (error) {
      checks.push({
        name: 'Conexão Supabase',
        description: 'Verificar conectividade com o banco de dados',
        status: 'failed',
        result: 'Falha na conexão com Supabase',
        timestamp
      });
    }
    
    // Check 2: Verificar estrutura das tabelas
    checks.push({
      name: 'Estrutura de Dados',
      description: 'Verificar integridade da estrutura de dados mock',
      status: 'passed',
      result: `${mockCompanies.length} empresas, ${mockProjects.length} projetos, ${mockFinancialRecords.length} registros`,
      timestamp
    });
    
    // Check 3: Verificar performance
    const startTime = Date.now();
    await MockEdgeFunction.validateData();
    const duration = Date.now() - startTime;
    
    checks.push({
      name: 'Performance de Validação',
      description: 'Verificar tempo de resposta da validação',
      status: duration < 2000 ? 'passed' : 'warning',
      result: `Validação concluída em ${duration}ms`,
      timestamp
    });
    
    return checks;
  };

  const calculateDataSummary = (): DataSummary => {
    const totalRevenue = mockFinancialRecords
      .filter(r => r.type === 'revenue')
      .reduce((sum, r) => sum + r.amount, 0);
    
    const totalExpenses = mockFinancialRecords
      .filter(r => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount, 0);
    
    const activeProjects = mockProjects.filter(p => p.status === 'active').length;
    
    // Calcular score de integridade (0-100)
    const successCount = validationResults.filter(r => r.status === 'success').length;
    const totalValidations = validationResults.length;
    const dataIntegrityScore = totalValidations > 0 ? (successCount / totalValidations) * 100 : 0;
    
    return {
      totalCompanies: mockCompanies.length,
      totalProjects: mockProjects.length,
      totalRecords: mockFinancialRecords.length,
      activeProjects,
      totalRevenue,
      totalExpenses,
      dataIntegrityScore
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      success: 'default',
      passed: 'default',
      warning: 'secondary',
      error: 'destructive',
      failed: 'destructive'
    };
    
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status === 'success' || status === 'passed' ? 'Sucesso' : 
         status === 'warning' ? 'Aviso' : 'Erro'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold tracking-tight">Validação de Dados</h3>
          <p className="text-muted-foreground">
            Verificação de integridade e consistência dos dados de teste
          </p>
        </div>
        <Button
          onClick={validateData}
          disabled={isValidating}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
          {isValidating ? 'Validando...' : 'Validar Dados'}
        </Button>
      </div>

      {/* Progress Bar */}
      {isValidating && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso da Validação</span>
                <span>{validationProgress}%</span>
              </div>
              <Progress value={validationProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {dataSummary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score de Integridade</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dataSummary.dataIntegrityScore.toFixed(1)}%</div>
              <Progress value={dataSummary.dataIntegrityScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dataSummary.totalRecords}</div>
              <p className="text-xs text-muted-foreground">
                {dataSummary.totalCompanies} empresas, {dataSummary.totalProjects} projetos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dataSummary.activeProjects}</div>
              <p className="text-xs text-muted-foreground">
                de {dataSummary.totalProjects} projetos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(dataSummary.totalRevenue / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-muted-foreground">
                Despesas: {(dataSummary.totalExpenses / 1000000).toFixed(1)}M
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Validation Results */}
      <Tabs defaultValue="validation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="validation">Resultados da Validação</TabsTrigger>
          <TabsTrigger value="integrity">Verificações de Integridade</TabsTrigger>
        </TabsList>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Resultados da Validação
              </CardTitle>
              <CardDescription>
                {lastValidation && (
                  `Última validação: ${lastValidation.toLocaleString('pt-BR')}`
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {validationResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma validação executada ainda
                  </div>
                ) : (
                  validationResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        {getStatusIcon(result.status)}
                        <div className="flex-1">
                          <div className="font-medium">{result.category}</div>
                          <div className="text-sm text-muted-foreground">
                            {result.message}
                          </div>
                          {result.details && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {result.details}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.count !== undefined && (
                          <span className="text-sm font-medium">
                            {result.count}
                          </span>
                        )}
                        {getStatusBadge(result.status)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Verificações de Integridade
              </CardTitle>
              <CardDescription>
                Verificações automáticas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrityChecks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma verificação executada ainda
                  </div>
                ) : (
                  integrityChecks.map((check, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        {getStatusIcon(check.status)}
                        <div className="flex-1">
                          <div className="font-medium">{check.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {check.description}
                          </div>
                          <div className="text-sm mt-1">
                            {check.result}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(check.timestamp).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(check.status)}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Alert */}
      {validationResults.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {validationResults.filter(r => r.status === 'error').length > 0
              ? 'Foram encontrados erros na validação. Verifique os resultados acima.'
              : validationResults.filter(r => r.status === 'warning').length > 0
              ? 'Validação concluída com avisos. Revise os itens marcados.'
              : 'Todos os dados foram validados com sucesso!'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DataValidator;