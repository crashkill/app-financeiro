import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button } from 'react-bootstrap';
import FilterPanel from '../components/FilterPanel';
import CustosGrafico from '../components/gestao-profissionais/CustosGrafico';
import UploadProfissionais from '../components/gestao-profissionais/UploadProfissionais';
import { useProfissionaisData } from '../hooks/useProfissionaisData';
import { formatCurrency } from '../utils/formatters';

interface ProfissionalCusto {
  tipo: string;
  descricao: string;
  valor: number;
  periodo: string;
}

interface CustosPorTipo {
  [key: string]: {
    items: ProfissionalCusto[];
    total: number;
    percentual: number;
  }
}

const GestaoProfissionais: React.FC = () => {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [projects, setProjects] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [custosPorTipo, setCustosPorTipo] = useState<CustosPorTipo>({});
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'valor' | 'descricao' | 'periodo'>('valor');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { data, isLoading: isLoadingData, error, refetch } = useProfissionaisData();

  // Carregar projetos e anos disponíveis
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const transacoes = data?.transacoes || [];

        // Extrair projetos únicos
        const uniqueProjects = Array.from(new Set(transacoes.map(t => t.projeto || t.descricao || 'Sem Projeto')));
        setProjects(uniqueProjects);

        // Extrair anos únicos
        const uniqueYears = Array.from(new Set(transacoes.map(t => {
          const [, ano] = (t.periodo || '').split('/');
          return parseInt(ano);
        }))).filter(year => !isNaN(year)).sort((a, b) => b - a);

        setYears(uniqueYears);
        if (uniqueYears.length > 0) {
          setSelectedYear(uniqueYears[0]);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    carregarDados();
  }, [data]);

  // Carregar custos dos profissionais quando projeto, ano ou mês mudar
  useEffect(() => {
    const carregarCustosProfissionais = async () => {
      setIsLoading(true);
      try {
        const transacoes = data?.transacoes || [];

        // Filtrar transações por projeto, ano e mês selecionados
        const custosFiltrados = transacoes.filter(t => {
          const [mes, ano] = (t.periodo || '').split('/');
          const anoMatch = parseInt(ano) === selectedYear;
          const mesMatch = !selectedMonth || mes === selectedMonth;
          const projetoMatch = selectedProjects.length === 0 || selectedProjects.includes(t.projeto || t.descricao || '');
          const contaResumo = (t.contaResumo || '').toUpperCase();
          const tipoMatch = ['CLT', 'OUTROS', 'SUBCONTRATADOS'].some(tipo => 
            contaResumo === tipo || contaResumo.includes(tipo)
          );

          return anoMatch && mesMatch && projetoMatch && tipoMatch;
        });

        // Calcular total geral primeiro
        const totalGeral = custosFiltrados.reduce((acc, t) => acc + Math.abs(t.valor), 0);

        // Agrupar por tipo
        const custosAgrupados: CustosPorTipo = {};

        custosFiltrados.forEach(t => {
          const tipo = t.contaResumo || 'Outros';
          if (!custosAgrupados[tipo]) {
            custosAgrupados[tipo] = {
              items: [],
              total: 0,
              percentual: 0
            };
          }

          const custo: ProfissionalCusto = {
            tipo,
            descricao: t.denominacaoConta || t.descricao,
            valor: Math.abs(t.valor),
            periodo: t.periodo
          };

          custosAgrupados[tipo].items.push(custo);
          custosAgrupados[tipo].total += Math.abs(t.valor);
        });

        // Calcular percentuais
        Object.values(custosAgrupados).forEach(grupo => {
          grupo.percentual = (grupo.total / totalGeral) * 100;
          // Ordenar items do grupo
          grupo.items.sort((a, b) => {
            if (sortBy === 'valor') {
              return sortDirection === 'desc' ? b.valor - a.valor : a.valor - b.valor;
            }
            if (sortBy === 'descricao') {
              return sortDirection === 'desc' 
                ? b.descricao.localeCompare(a.descricao)
                : a.descricao.localeCompare(b.descricao);
            }
            // periodo
            return sortDirection === 'desc'
              ? b.periodo.localeCompare(a.periodo)
              : a.periodo.localeCompare(b.periodo);
          });
        });

        setCustosPorTipo(custosAgrupados);
      } catch (error) {
        console.error('Erro ao carregar custos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    carregarCustosProfissionais();
  }, [selectedProjects, selectedYear, selectedMonth, sortBy, sortDirection, data]);

  const handleSort = (column: 'valor' | 'descricao' | 'periodo') => {
    if (sortBy === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  // Calcular total geral
  const totalGeral = Object.values(custosPorTipo).reduce((acc, { total }) => acc + total, 0);

  // Ordenar os tipos de custo por total
  const tiposOrdenados = Object.entries(custosPorTipo)
    .sort(([, a], [, b]) => b.total - a.total);

  if (isLoadingData) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div>Erro ao carregar dados: {error.message}</div>;
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

      <FilterPanel
        projects={projects}
        selectedProjects={selectedProjects}
        years={years}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onProjectChange={setSelectedProjects}
        onYearChange={setSelectedYear}
        onMonthChange={setSelectedMonth}
      />

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
                          R$ {formatCurrency(total)}
                        </span>
                      </div>
                    </h5>
                    <Table responsive striped hover>
                      <thead>
                        <tr>
                          <th style={{ cursor: 'pointer' }} onClick={() => handleSort('descricao')}>
                            Descrição {sortBy === 'descricao' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                          <th style={{ cursor: 'pointer' }} onClick={() => handleSort('periodo')}>
                            Período {sortBy === 'periodo' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </th>
                          <th 
                            className="text-end" 
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleSort('valor')}
                          >
                            Custo {sortBy === 'valor' && (sortDirection === 'asc' ? '↑' : '↓')}
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
                    </Table>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <UploadProfissionais 
        show={showUploadModal} 
        onHide={() => setShowUploadModal(false)} 
        onSuccess={refetch}
      />
    </Container>
  );
};

export default GestaoProfissionais;