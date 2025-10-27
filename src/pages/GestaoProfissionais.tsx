import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Tabs, Tab, Alert, Toast, ToastContainer, Form } from 'react-bootstrap';
import { Plus, Upload, Edit, Trash2, AlertTriangle, X } from 'lucide-react';
import { profissionaisService, Profissional } from '../services/profissionaisService';
import { formatCurrency } from '../utils/formatters';
import { profissionaisFilterService } from '../services/profissionaisFilterService';
import ProjectFilterReusable from '../components/filters/ProjectFilterReusable';
import YearFilterReusable from '../components/filters/YearFilterReusable';
import MonthFilterReusable from '../components/filters/MonthFilterReusable';
import ProfissionalForm from '../components/ProfissionalForm';
import UploadModal from '../components/UploadModal';
import TabelaProfissionais from '../components/gestao-profissionais/TabelaProfissionais';
import ProfissionalModal from '../components/gestao-profissionais/ProfissionalModal';
import ConfirmDeleteModal from '../components/gestao-profissionais/ConfirmDeleteModal';
import UploadProfissionais from '../components/gestao-profissionais/UploadProfissionais';
import CustosGrafico from '../components/gestao-profissionais/CustosGrafico';

interface CustosPorTipo {
  CLT: number;
  OUTROS: number;
  SUBCONTRATADOS: number;
  total: number;
}

interface ProfissionalCusto {
  tipo: string;
  descricao: string;
  valor: number;
  periodo: string;
}

const GestaoProfissionais: React.FC = () => {
  const [projetoSelecionado, setProjetoSelecionado] = useState<string[]>([]);
  const [anoSelecionado, setAnoSelecionado] = useState<number>(new Date().getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState<string>('');
  const [projetos, setProjetos] = useState<string[]>([]);
  const [anos, setAnos] = useState<number[]>([]);
  const [custosPorTipo, setCustosPorTipo] = useState<{ [key: string]: { items: ProfissionalCusto[]; total: number; percentual: number; } }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [ordenacao, setOrdenacao] = useState<'valor' | 'descricao' | 'periodo'>('valor');
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<'asc' | 'desc'>('desc');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('custos');

  // Estados para CRUD de profissionais
  const [profissionaisList, setProfissionaisList] = useState<Profissional[]>([]);
  const [loadingProfissionais, setLoadingProfissionais] = useState(false);
  const [errorProfissionais, setErrorProfissionais] = useState<string | null>(null);
  const [showProfissionalModal, setShowProfissionalModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profissionalSelecionado, setProfissionalSelecionado] = useState<Profissional | null>(null);
  const [isEditingProfissional, setIsEditingProfissional] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'danger'>('success');
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar profissionais do Supabase
  const carregarProfissionais = async () => {
    try {
      setLoadingProfissionais(true);
      setErrorProfissionais(null);
      const response = await profissionaisService.listarProfissionais();
      
      // Garantir que sempre temos um array válido
      if (!response || !response.success || !Array.isArray(response.data)) {
        console.warn('[GestaoProfissionais] Resposta inválida do serviço:', response);
        setProfissionaisList([]);
        setErrorProfissionais('Dados de profissionais inválidos recebidos do servidor');
        return;
      }
      
      setProfissionaisList(response.data);
    } catch (err) {
      console.error('[GestaoProfissionais] Erro ao carregar dados dos colaboradores:', err);
      setErrorProfissionais(err instanceof Error ? err.message : 'Erro ao carregar profissionais');
      setProfissionaisList([]);
    } finally {
      setLoadingProfissionais(false);
    }
  };

  // Carregar profissionais na inicialização
  useEffect(() => {
    carregarProfissionais();
  }, []);

  // Funções para CRUD de profissionais
  const handleAdicionarProfissional = () => {
    setProfissionalSelecionado(null);
    setIsEditingProfissional(false);
    setShowProfissionalModal(true);
  };

  const handleEditarProfissional = (profissional: Profissional) => {
    setProfissionalSelecionado(profissional);
    setIsEditingProfissional(true);
    setShowProfissionalModal(true);
  };

  const handleExcluirProfissional = (profissional: Profissional) => {
    setProfissionalSelecionado(profissional);
    setShowDeleteModal(true);
  };

  const handleSalvarProfissional = async (dadosProfissional: Partial<Profissional>) => {
    try {
      if (isEditingProfissional && profissionalSelecionado) {
        // Atualizar profissional existente
        await profissionaisService.atualizarProfissional(profissionalSelecionado.id!.toString(), dadosProfissional);
        showToastMessage('Profissional atualizado com sucesso!', 'success');
      } else {
        // Criar novo profissional
        await profissionaisService.criarProfissional(dadosProfissional as Omit<Profissional, 'id' | 'origem' | 'tipo' | 'data_criacao' | 'data_atualizacao'>);
        showToastMessage('Profissional criado com sucesso!', 'success');
      }
      await carregarProfissionais();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro ao salvar profissional');
    }
  };

  const handleConfirmarExclusao = async (profissional: Profissional) => {
    try {
      await profissionaisService.excluirProfissional(profissional.id!.toString());
      await carregarProfissionais();
      showToastMessage('Profissional excluído com sucesso!', 'success');
    } catch (err) {
      showToastMessage(err instanceof Error ? err.message : 'Erro ao excluir profissional', 'danger');
      throw err;
    }
  };

  const showToastMessage = (message: string, variant: 'success' | 'danger') => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
  };

  // Carregar dados de filtros (projetos e anos)
  useEffect(() => {
    const carregarDadosFiltros = async () => {
      try {
        setLoadingData(true);
        setError(null);
        
        // Buscar projetos e anos usando o serviço de profissionais
        const [projetosData, anosData] = await Promise.all([
          profissionaisFilterService.getLocaisAlocacao(),
          profissionaisFilterService.getAnos()
        ]);
        
        setProjetos(projetosData);
        setAnos(anosData);
        
        console.log('[GestaoProfissionais] Dados de filtros carregados:', {
          projetos: projetosData.length,
          anos: anosData.length
        });
      } catch (error) {
        console.error('[GestaoProfissionais] Erro ao carregar dados de filtros:', error);
        setError('Erro ao carregar dados de filtros');
      } finally {
        setLoadingData(false);
      }
    };

    carregarDadosFiltros();
  }, []);

  // Carregar dados dos colaboradores quando filtros mudarem
  useEffect(() => {
    const carregarDadosColaboradores = async () => {
      setIsLoading(true);
      try {
        console.log('[GestaoProfissionais] Carregando dados dos colaboradores...');
        
        // Buscar todos os profissionais
        const response = await profissionaisService.listarProfissionais();
        
        // Garantir que sempre temos um array válido
        if (!response || !response.success || !Array.isArray(response.data)) {
          console.warn('[GestaoProfissionais] Resposta inválida do serviço:', response);
          setCustosPorTipo({});
          return;
        }
        
        const profissionais = response.data;
        
        // Filtrar colaboradores baseado nos filtros selecionados
        const colaboradoresFiltrados = profissionais.filter(prof => {
          // Filtro por local de alocação (usado como "projeto")
          const localMatch = projetoSelecionado.length === 0 || 
            projetoSelecionado.includes(prof.local_alocacao || '');
          
          // Filtro por ano (baseado na data de criação)
          const anoColaborador = new Date(prof.data_criacao).getFullYear();
          const anoMatch = anoColaborador === anoSelecionado;
          
          // Filtro por mês (baseado na data de criação)
          const mesColaborador = new Date(prof.data_criacao).getMonth() + 1;
          const mesMatch = !mesSelecionado || mesColaborador.toString() === mesSelecionado;
          
          return localMatch && anoMatch && mesMatch;
        });

        // Agrupar por regime (CLT, PJ, etc.)
        const custosAgrupados: { [key: string]: { items: ProfissionalCusto[]; total: number; percentual: number; } } = {};

        colaboradoresFiltrados.forEach(prof => {
          const tipo = prof.regime || 'Não Informado';
          if (!custosAgrupados[tipo]) {
            custosAgrupados[tipo] = {
              items: [],
              total: 0,
              percentual: 0
            };
          }

          // Usar valor mensal ou valor hora * 160 horas como estimativa
          const valorEstimado = prof.valor_mensal || (prof.valor_hora ? prof.valor_hora * 160 : 0);

          const custo: ProfissionalCusto = {
            tipo,
            descricao: prof.nome || 'Nome não informado',
            valor: valorEstimado,
            periodo: new Date(prof.data_criacao).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })
          };

          custosAgrupados[tipo].items.push(custo);
          custosAgrupados[tipo].total += valorEstimado;
        });

        // Calcular total geral
        const totalGeral = Object.values(custosAgrupados).reduce((acc, grupo) => acc + grupo.total, 0);

        // Calcular percentuais
        Object.values(custosAgrupados).forEach(grupo => {
          grupo.percentual = totalGeral > 0 ? (grupo.total / totalGeral) * 100 : 0;
          // Ordenar items do grupo
          grupo.items.sort((a, b) => {
            if (ordenacao === 'valor') {
              return direcaoOrdenacao === 'desc' ? b.valor - a.valor : a.valor - b.valor;
            }
            if (ordenacao === 'descricao') {
              return direcaoOrdenacao === 'desc' 
                ? b.descricao.localeCompare(a.descricao)
                : a.descricao.localeCompare(b.descricao);
            }
            // periodo
            return direcaoOrdenacao === 'desc'
              ? b.periodo.localeCompare(a.periodo)
              : a.periodo.localeCompare(b.periodo);
          });
        });

        setCustosPorTipo(custosAgrupados);
        
        console.log('[GestaoProfissionais] Dados carregados:', {
          colaboradores: colaboradoresFiltrados.length,
          grupos: Object.keys(custosAgrupados).length,
          totalGeral
        });
      } catch (error) {
        console.error('[GestaoProfissionais] Erro ao carregar dados dos colaboradores:', error);
      } finally {
        setIsLoading(false);
      }
    };

    carregarDadosColaboradores();
  }, [projetoSelecionado, anoSelecionado, mesSelecionado, ordenacao, direcaoOrdenacao]); // Removendo dependência de transacoes

  const handleSort = (column: 'valor' | 'descricao' | 'periodo') => {
    if (ordenacao === column) {
      setDirecaoOrdenacao(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setOrdenacao(column);
      setDirecaoOrdenacao('desc');
    }
  };

  // Calcular total geral
  const totalGeral = Object.values(custosPorTipo).reduce((acc, { total }) => acc + total, 0);

  // Ordenar os tipos de custo por total
  const tiposOrdenados = Object.entries(custosPorTipo)
    .sort(([, a], [, b]) => b.total - a.total);

  if (loadingData) {
    return (
      <Container fluid className="py-3">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="mt-2">Carregando dados...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid className="py-3">
        <Alert variant="danger">
          <Alert.Heading>Erro ao carregar dados</Alert.Heading>
          <p>{error.message}</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-3">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1>Gestão de Profissionais</h1>
              <p className="text-muted">Gerencie os profissionais alocados nos projetos</p>
            </div>
            <Button 
              variant="primary" 
              onClick={() => setShowUploadModal(true)}
              className="align-self-start"
            >
              <i className="bi bi-upload me-2"></i>
              Importar Profissionais
            </Button>
          </div>
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k || 'custos')}
        className="mb-4"
      >
        <Tab eventKey="custos" title="Análise de Custos">
          <Row className="mb-4">
            <Col md={6}>
              <ProjectFilterReusable
                projects={projetos}
                selectedProjects={projetoSelecionado}
                onChange={setProjetoSelecionado}
                isLoading={loadingData}
                label="Filtrar Projetos"
              />
            </Col>
            <Col md={3}>
              <YearFilterReusable
                years={anos}
                selectedYear={anoSelecionado}
                onChange={setAnoSelecionado}
                isLoading={loadingData}
                label="Filtrar Ano"
              />
            </Col>
            <Col md={3}>
              <MonthFilterReusable
                months={[]}
                selectedMonth={mesSelecionado}
                onChange={setMesSelecionado}
                isLoading={loadingData}
                label="Filtrar Mês"
              />
            </Col>
          </Row>

          <Row className="mt-4">
            <Col lg={5}>
              <div className="sticky-top" style={{ top: '1rem', zIndex: 100 }}>
                <CustosGrafico custosPorTipo={custosPorTipo} />
              </div>
            </Col>
            <Col lg={7}>
              <Card>
                <Card.Body>
                  <Card.Title className="d-flex justify-content-between align-items-center mb-4">
                    <span>Custos por Profissional</span>
                    <span className="text-primary">Total Geral: {formatCurrency(totalGeral)}</span>
                  </Card.Title>

                  {isLoading ? (
                    <div className="text-center">Carregando...</div>
                  ) : tiposOrdenados.length === 0 ? (
                    <div className="text-center">Nenhum dado encontrado</div>
                  ) : (
                    tiposOrdenados.map(([tipo, { items, total, percentual }]) => (
                      <div key={tipo} className="mb-4">
                        <h5 className="d-flex justify-content-between align-items-center mb-3">
                          <span className="fw-bold">{tipo}</span>
                          <div>
                            <span className="text-muted me-3">
                              {percentual.toFixed(1)}%
                            </span>
                            <span className="text-primary fw-bold">
                              {formatCurrency(total)}
                            </span>
                          </div>
                        </h5>
                        <div className="table-responsive">
                          <table className="table table-striped table-hover">
                            <thead>
                              <tr>
                                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('descricao')}>
                                  Descrição {ordenacao === 'descricao' && (direcaoOrdenacao === 'asc' ? '↑' : '↓')}
                                </th>
                                <th style={{ cursor: 'pointer' }} onClick={() => handleSort('periodo')}>
                                  Período {ordenacao === 'periodo' && (direcaoOrdenacao === 'asc' ? '↑' : '↓')}
                                </th>
                                <th 
                                  className="text-end" 
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => handleSort('valor')}
                                >
                                  Custo {ordenacao === 'valor' && (direcaoOrdenacao === 'asc' ? '↑' : '↓')}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((custo, index) => (
                                <tr key={index}>
                                  <td>{custo.descricao}</td>
                                  <td>{custo.periodo}</td>
                                  <td className="text-end">{formatCurrency(custo.valor)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="profissionais" title="Gestão de Profissionais">
          <TabelaProfissionais
            profissionais={profissionaisList}
            isLoading={loadingProfissionais}
            error={errorProfissionais}
            onEdit={handleEditarProfissional}
            onDelete={handleExcluirProfissional}
            onAdd={handleAdicionarProfissional}
          />
        </Tab>
      </Tabs>

      {/* Modais */}
      <UploadProfissionais 
        show={showUploadModal} 
        onHide={() => setShowUploadModal(false)} 
        onSuccess={() => {
          carregarProfissionais();
        }}
      />

      <ProfissionalModal
        show={showProfissionalModal}
        onHide={() => setShowProfissionalModal(false)}
        onSave={handleSalvarProfissional}
        profissional={profissionalSelecionado}
        isLoading={loadingProfissionais}
      />

      <ConfirmDeleteModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmarExclusao}
        profissional={profissionalSelecionado}
      />

      {/* Toast de notificações */}
      <ToastContainer position="top-end" className="p-3">
        <Toast 
          show={showToast} 
          onClose={() => setShowToast(false)}
          delay={4000}
          autohide
          bg={toastVariant}
        >
          <Toast.Header>
            <strong className="me-auto">
              {toastVariant === 'success' ? 'Sucesso' : 'Erro'}
            </strong>
          </Toast.Header>
          <Toast.Body className="text-white">
            {toastMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
};

export default GestaoProfissionais;