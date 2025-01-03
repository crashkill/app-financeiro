import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table } from 'react-bootstrap';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { db } from '../db/database';
import type { Transacao } from '../db/database';
import FilterPanel from '../components/FilterPanel';

interface DadosMes {
  receita: number;
  desoneracao: number;
  custo: number;
  margem: number;
}

interface DadosProjeto {
  projeto: string;
  dados: { [key: string]: { mensal: DadosMes; acumulado: DadosMes } };
}

const PlanilhasFinanceiras: React.FC = () => {
  const [dados, setDados] = useState<DadosProjeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [meses] = useState(['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']);

  // Carregar projetos e anos disponíveis
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const transacoes = await db.transacoes.toArray();
        
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
  }, []);

  // Função para validar receita
  const isReceitaValida = (contaResumo: string) => {
    const normalizado = contaResumo.toLowerCase().trim();
    return normalizado.includes('receita devengada');
  };

  // Função para validar tipos de custo
  const isCustoValido = (contaResumo: string): boolean => {
    const custoNormalizado = contaResumo.toUpperCase().trim();
    return ['CLT', 'OUTROS', 'SUBCONTRATADOS'].includes(custoNormalizado);
  };

  // Função para processar transações do mês
  const processarTransacoesMes = (transacoes: Transacao[]): DadosMes => {
    const dadosMes: DadosMes = {
      receita: 0,
      desoneracao: 0,
      custo: 0,
      margem: 0
    };

    transacoes.forEach(transacao => {
      const valor = Number(transacao.valor) || 0;
      const contaResumo = (transacao.contaResumo || '').trim();

      // Processamento de Receita
      if (contaResumo.toUpperCase() === 'RECEITA DEVENGADA') {
        // Receita deve ser positiva
        dadosMes.receita += valor;
      }
      // Processamento de Desoneração
      else if (contaResumo.toUpperCase() === 'DESONERAÇÃO DA FOLHA') {
        // Desoneração deve ser positiva
        dadosMes.desoneracao += valor;
      } 
      // Processamento de Custos
      else if (isCustoValido(contaResumo)) {
        // Custos devem ser mantidos como estão no banco
        dadosMes.custo += valor;
        console.log(`Processando custo para ${contaResumo}:`, {
          valorOriginal: valor,
          custoAcumulado: dadosMes.custo
        });
      }
    });

    // Log para debug
    console.log('Dados processados do mês:', {
      receita: dadosMes.receita,
      desoneracao: dadosMes.desoneracao,
      custo: dadosMes.custo,
      custoAbsoluto: Math.abs(dadosMes.custo)
    });

    // Cálculo da margem usando o valor absoluto do custo
    const custoAjustado = Math.abs(dadosMes.custo) - dadosMes.desoneracao;
    dadosMes.margem = dadosMes.receita > 0 ? (1 - (custoAjustado / dadosMes.receita)) * 100 : 0;

    return dadosMes;
  };

  // Carregar dados financeiros
  useEffect(() => {
    const carregarDadosFinanceiros = async () => {
      if (!selectedYear) return;
      
      setIsLoading(true);
      try {
        const projetosParaCarregar = selectedProjects.length > 0 ? selectedProjects : projects;
        const dadosProjetos: DadosProjeto[] = [];

        // Buscar todas as transações do ano
        const transacoes = await db.transacoes.toArray();

        // Processar transações por projeto
        for (const projeto of projetosParaCarregar) {
          const transacoesProjeto = transacoes.filter(t => 
            (t.projeto || t.descricao || 'Sem Projeto') === projeto
          );

          const dadosProjeto: DadosProjeto = {
            projeto,
            dados: {}
          };

          // Processar dados mensais e acumulados
          let acumulado: DadosMes = {
            receita: 0,
            desoneracao: 0,
            custo: 0,
            margem: 0
          };

          // Processar cada mês
          for (let mes = 1; mes <= 12; mes++) {
            // Filtrar transações do mês atual
            const transacoesMes = transacoesProjeto.filter(t => {
              const [mesTransacao, anoTransacao] = (t.periodo || '').split('/');
              return parseInt(mesTransacao) === mes && parseInt(anoTransacao) === selectedYear;
            });

            // Processar dados do mês
            const dadosMes = processarTransacoesMes(transacoesMes);

            // Se não houver dados para o mês, verificar se há dados em meses anteriores
            if (dadosMes.receita === 0 && mes > 1) {
              // Buscar último mês com dados
              for (let mesAnterior = mes - 1; mesAnterior >= 1; mesAnterior--) {
                const dadosMesAnterior = dadosProjeto.dados[`${mesAnterior}/${selectedYear}`]?.mensal;
                if (dadosMesAnterior && dadosMesAnterior.receita > 0) {
                  // Usar os mesmos valores do último mês com dados
                  dadosMes.receita = dadosMesAnterior.receita;
                  dadosMes.desoneracao = dadosMesAnterior.desoneracao;
                  dadosMes.custo = dadosMesAnterior.custo;
                  break;
                }
              }
            }
            
            // Acumular valores
            acumulado.receita += dadosMes.receita;
            acumulado.desoneracao += dadosMes.desoneracao;
            acumulado.custo += dadosMes.custo;

            // Recalcular margem acumulada
            const custoAjustadoAcumulado = Math.abs(acumulado.custo) - acumulado.desoneracao;
            acumulado.margem = acumulado.receita > 0 
              ? (1 - (custoAjustadoAcumulado / acumulado.receita)) * 100 
              : 0;

            // Recalcular margem mensal
            const custoAjustado = Math.abs(dadosMes.custo) - dadosMes.desoneracao;
            dadosMes.margem = dadosMes.receita > 0 
              ? (1 - (custoAjustado / dadosMes.receita)) * 100 
              : 0;

            dadosProjeto.dados[`${mes}/${selectedYear}`] = {
              mensal: { ...dadosMes },
              acumulado: { ...acumulado }
            };
          }

          dadosProjetos.push(dadosProjeto);
        }

        setDados(dadosProjetos);
      } catch (error) {
        console.error('Erro ao carregar dados financeiros:', error);
      } finally {
        setIsLoading(false);
      }
    };

    carregarDadosFinanceiros();
  }, [selectedYear, selectedProjects, projects]);

  return (
    <Container fluid>
      <Row>
        <Col>
          <h1 className="mb-2">Planilhas Financeiras</h1>
          <p className="text-muted mb-4">Análise detalhada de receitas, custos e margens por projeto</p>
        </Col>
      </Row>

      <Row>
        <Col>
          <FilterPanel
            projects={projects}
            selectedProjects={selectedProjects}
            years={years}
            selectedYear={selectedYear}
            onProjectChange={setSelectedProjects}
            onYearChange={setSelectedYear}
          />
        </Col>
      </Row>

      {isLoading ? (
        <Row>
          <Col>
            <div className="text-center py-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
            </div>
          </Col>
        </Row>
      ) : (
        dados.map(dadosProjeto => (
          <Row key={dadosProjeto.projeto} className="mb-4">
            <Col>
              <Card className="shadow">
                <Card.Header>
                  <h5 className="mb-0">{dadosProjeto.projeto}</h5>
                </Card.Header>
                <Card.Body className="p-0">
                  <div className="table-responsive">
                    <Table hover className="align-middle mb-0" style={{ fontSize: '0.875rem' }}>
                      <thead>
                        <tr>
                          <th>Item</th>
                          {meses.map((mes, index) => (
                            <React.Fragment key={mes}>
                              <th colSpan={2} className="text-center">
                                {mes}/{selectedYear.toString().slice(-2)}
                              </th>
                            </React.Fragment>
                          ))}
                        </tr>
                        <tr>
                          <th></th>
                          {meses.map(mes => (
                            <React.Fragment key={mes}>
                              <th className="text-center">Mensal</th>
                              <th className="text-center">Acumulado</th>
                            </React.Fragment>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Receita</td>
                          {meses.map((_, index) => {
                            const mes = index + 1;
                            const dados = dadosProjeto.dados[`${mes}/${selectedYear}`];
                            return (
                              <React.Fragment key={mes}>
                                <td className="text-center" style={{ color: '#198754' }}>
                                  {formatCurrency(dados.mensal.receita)}
                                </td>
                                <td className="text-center" style={{ color: '#198754' }}>
                                  {formatCurrency(dados.acumulado.receita)}
                                </td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                        <tr>
                          <td>Desoneração</td>
                          {meses.map((_, index) => {
                            const mes = index + 1;
                            const dados = dadosProjeto.dados[`${mes}/${selectedYear}`];
                            return (
                              <React.Fragment key={mes}>
                                <td className="text-center" style={{ color: '#0dcaf0' }}>
                                  {formatCurrency(dados.mensal.desoneracao)}
                                </td>
                                <td className="text-center" style={{ color: '#0dcaf0' }}>
                                  {formatCurrency(dados.acumulado.desoneracao)}
                                </td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                        <tr>
                          <td>Custo</td>
                          {meses.map((_, index) => {
                            const mes = index + 1;
                            const dados = dadosProjeto.dados[`${mes}/${selectedYear}`];
                            return (
                              <React.Fragment key={mes}>
                                <td className="text-center" style={{ color: '#dc3545' }}>
                                  {formatCurrency(Math.abs(dados.mensal.custo))}
                                </td>
                                <td className="text-center" style={{ color: '#dc3545' }}>
                                  {formatCurrency(Math.abs(dados.acumulado.custo))}
                                </td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                        <tr>
                          <td>Margem</td>
                          {meses.map((_, index) => {
                            const mes = index + 1;
                            const dados = dadosProjeto.dados[`${mes}/${selectedYear}`];
                            const getMargemStyle = (margem: number) => ({
                              color: margem >= 7 ? '#198754' : '#dc3545',
                              fontWeight: 'bold'
                            });

                            return (
                              <React.Fragment key={mes}>
                                <td className="text-center" style={getMargemStyle(dados.mensal.margem)}>
                                  {formatPercent(dados.mensal.margem)}
                                </td>
                                <td className="text-center" style={getMargemStyle(dados.acumulado.margem)}>
                                  {formatPercent(dados.acumulado.margem)}
                                </td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        ))
      )}
    </Container>
  );
};

export default PlanilhasFinanceiras;
