import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Form } from 'react-bootstrap';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { currencyMask } from '../utils/masks';
import { db } from '../db/database';
import type { Transacao } from '../db/database';
import FilterPanel from '../components/FilterPanel';

interface DadosMes {
  receita: number;
  desoneracao: number;
  custo: number;
  margem: number;
  custoOriginal: number;
}

interface DadosFinanceiros {
  mes: DadosMes;
  acumulado: DadosMes;
}

interface DadosProjeto {
  projeto: string;
  dados: { [key: string]: DadosFinanceiros };
}

const PlanilhasFinanceiras: React.FC = () => {
  const [dados, setDados] = useState<DadosProjeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingValues, setEditingValues] = useState<{ [key: string]: string }>({});
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2024);

  // Gerar array dos 12 meses do ano selecionado
  const gerarMeses = (ano: number) => {
    const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return mesesNomes.map(mes => `${mes}/${ano.toString().slice(-2)}`);
  };

  const [meses, setMeses] = useState(gerarMeses(selectedYear));
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  // Verifica se o mês pode ser editado (apenas meses futuros)
  const podeEditar = (mes: string) => {
    const [mesStr] = mes.split('/');
    const mesIndex = parseInt(mesStr) - 1;
    return selectedYear > anoAtual || (selectedYear === anoAtual && mesIndex > mesAtual);
  };

  // Atualiza o valor de um campo
  const atualizarValor = (projeto: string, mes: string, tipo: 'receita' | 'desoneracao' | 'custo', novoValor: number) => {
    const novosDados = [...dados];
    const projetoIndex = novosDados.findIndex(p => p.projeto === projeto);
    if (projetoIndex === -1) return;

    // Atualiza o valor do mês
    novosDados[projetoIndex].dados[mes].mes[tipo] = tipo === 'custo' ? -Math.abs(novoValor) : novoValor;

    // Recalcula acumulados
    let receitaAcumulada = 0;
    let desoneracaoAcumulada = 0;
    let custoAcumulado = 0;

    meses.forEach((m) => {
      const dadosMes = novosDados[projetoIndex].dados[m].mes;
      receitaAcumulada += dadosMes.receita;
      desoneracaoAcumulada += dadosMes.desoneracao;
      custoAcumulado += dadosMes.custo;

      const custoAjustadoAcumulado = Math.abs(custoAcumulado) - desoneracaoAcumulada;
      const margem = receitaAcumulada > 0 
        ? (1 - (custoAjustadoAcumulado / receitaAcumulada)) * 100 
        : 0;

      novosDados[projetoIndex].dados[m].acumulado = {
        receita: receitaAcumulada,
        desoneracao: desoneracaoAcumulada,
        custo: custoAcumulado,
        custoOriginal: custoAcumulado,
        margem
      };

      // Ajustar o custo mensal
      novosDados[projetoIndex].dados[m].mes.custo = dadosMes.custo - dadosMes.desoneracao;
    });

    setDados(novosDados);
  };

  // Renderiza o valor com o estilo do Forecast
  const renderizarValor = (valor: number, tipo: 'receita' | 'desoneracao' | 'custo', editable: boolean, projeto: string, mes: string) => {
    if (editable) {
      return (
        <div className="d-flex align-items-center">
          <span className="me-2">R$</span>
          <input
            type="text"
            className="form-control form-control-sm text-end"
            value={formatCurrency(Math.abs(valor)).replace('R$ ', '')}
            onChange={(e) => {
              const newValue = e.target.value.replace(/[^\d]/g, '');
              const numericValue = parseFloat(newValue) / 100;
              if (!isNaN(numericValue)) {
                atualizarValor(projeto, mes, tipo, numericValue);
              }
            }}
            style={{ maxWidth: '120px' }}
          />
        </div>
      );
    }
    return formatCurrency(Math.abs(valor));
  };

  // Função para normalizar strings (remover acentos e converter para minúsculo)
  const normalizeString = (str: string) => {
    return str.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  };

  // Carregar projetos e anos disponíveis
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const transacoes = await db.transacoes.toArray();

        // Extrair lista única de projetos
        const uniqueProjects = Array.from(new Set(transacoes.map(t => t.descricao || 'Sem Projeto')));
        setProjects(uniqueProjects);

        // Extrair lista única de anos
        const uniqueYears = Array.from(new Set(transacoes.map(t => {
          const [, ano] = (t.periodo || '').split('/');
          return parseInt(ano);
        }))).filter(year => !isNaN(year)).sort((a, b) => b - a);

        setYears(uniqueYears);

        // Definir apenas o ano inicial, sem selecionar projeto
        if (uniqueYears.length > 0) {
          setSelectedYear(uniqueYears[0]);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    carregarDados();
  }, []);

  useEffect(() => {
    setMeses(gerarMeses(selectedYear));
  }, [selectedYear]);

  useEffect(() => {
    const carregarDadosFinanceiros = async () => {
      setIsLoading(true);
      try {
        // Se não houver projetos selecionados, usar todos os projetos
        const projetosParaCarregar = selectedProjects.length > 0 ? selectedProjects : projects;
        const dadosProjetos: DadosProjeto[] = [];

        for (const projeto of projetosParaCarregar) {
          console.log(`Carregando projeto: ${projeto}`);
          
          const transacoes = await db.transacoes
            .where('descricao')
            .equals(projeto)
            .filter(t => {
              const [, ano] = (t.periodo || '').split('/');
              return parseInt(ano) === selectedYear;
            })
            .toArray();

          console.log(`Transações encontradas: ${transacoes.length}`);

          const dadosMensais: { [key: string]: DadosMes } = {};

          // Inicializar dados mensais
          meses.forEach(mes => {
            dadosMensais[mes] = {
              mes: { receita: 0, desoneracao: 0, custo: 0, margem: 0, custoOriginal: 0 },
              acumulado: { receita: 0, desoneracao: 0, custo: 0, margem: 0, custoOriginal: 0 }
            };
          });

          // Zerar os totais antes de processar
          Object.keys(dadosMensais).forEach(mes => {
            dadosMensais[mes].mes = {
              receita: 0,
              custo: 0,
              desoneracao: 0,
              custoOriginal: 0,
              margem: 0
            };
          });

          // Processar transações
          const desoneracao = {};

          transacoes.forEach(transacao => {
            if (!transacao.periodo) return;
            
            const valor = transacao.valor || 0;
            const [mesNum] = transacao.periodo.split('/');
            const mesIndex = parseInt(mesNum) - 1;
            const mesStr = meses[mesIndex];

            if (!mesStr || !dadosMensais[mesStr]) {
              console.log(`Mês não encontrado: ${transacao.periodo}`);
              return;
            }

            // Verificar se é desoneração (usando string normalizada)
            const contaResumoNormalizada = transacao.contaResumo ? normalizeString(transacao.contaResumo) : '';
            const isDesoneracao = contaResumoNormalizada === 'desoneracao da folha';
            
            // Verificar se é um custo válido (CLT, Outros ou Subcontratados)
            const isCLT = contaResumoNormalizada.includes('clt');
            const isOutros = contaResumoNormalizada.includes('outros');
            const isSubcontratados = contaResumoNormalizada.includes('subcontratados');
            const isCustoValido = isCLT || isOutros || isSubcontratados;

            if (isDesoneracao) {
              // Armazenar apenas o primeiro valor da desoneração para cada mês
              if (!desoneracao[mesStr]) {
                desoneracao[mesStr] = valor;
              }
            } else if (transacao.natureza === 'RECEITA') {
              dadosMensais[mesStr].mes.receita += valor;
            } else if (isCustoValido && transacao.natureza === 'CUSTO') {
              // Adicionar ao custo apenas se for CLT, Outros ou Subcontratados
              // Garantir que o custo seja sempre negativo
              dadosMensais[mesStr].mes.custo += valor;
              dadosMensais[mesStr].mes.custoOriginal += valor;
            }
          });

          // Aplicar o primeiro valor de desoneração para cada mês
          Object.entries(desoneracao).forEach(([mes, valor]) => {
            dadosMensais[mes].mes.desoneracao = valor;
          });

          // Cálculo da margem:
          // 1. Custo ajustado = |Custo| - Desoneração
          // 2. Margem = (1 - (Custo ajustado / Receita)) * 100
          Object.keys(dadosMensais).forEach(mes => {
            const dadosMes = dadosMensais[mes].mes;
            const custoAjustado = Math.abs(dadosMes.custo) - dadosMes.desoneracao;
            dadosMes.margem = dadosMes.receita > 0 
              ? (1 - (custoAjustado / dadosMes.receita)) * 100 
              : 0;
            
            // Garantir que o custo seja sempre negativo após os cálculos
            if (dadosMes.custo > 0) {
              dadosMes.custo = -dadosMes.custo;
              dadosMes.custoOriginal = -dadosMes.custoOriginal;
            }
          });

          // Calcular totais acumulados
          const calcularAcumulados = () => {
            let receitaAcumulada = 0;
            let custoAcumulado = 0;
            let desoneracaoAcumulada = 0;

            meses.forEach(mes => {
              if (dadosMensais[mes]) {
                receitaAcumulada += dadosMensais[mes].mes.receita;
                custoAcumulado += dadosMensais[mes].mes.custo;
                desoneracaoAcumulada += dadosMensais[mes].mes.desoneracao;

                const custoAjustadoAcumulado = Math.abs(custoAcumulado) - desoneracaoAcumulada;
                const margem = receitaAcumulada > 0 
                  ? (1 - (custoAjustadoAcumulado / receitaAcumulada)) * 100 
                  : 0;

                dadosMensais[mes].acumulado = {
                  receita: receitaAcumulada,
                  desoneracao: desoneracaoAcumulada,
                  custo: custoAcumulado,
                  custoOriginal: custoAcumulado,
                  margem
                };
              }
            });
          };

          calcularAcumulados();

          dadosProjetos.push({
            projeto,
            dados: dadosMensais
          });
        }

        console.log('Dados finais:', dadosProjetos);
        setDados(dadosProjetos);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    carregarDadosFinanceiros();
  }, [selectedProjects, selectedYear, projects, meses]);

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
                    <Table hover className="align-middle mb-0" style={{ fontSize: '0.875rem', minWidth: '100%' }}>
                      <thead>
                        <tr>
                          <th>Item</th>
                          {meses.map(mes => (
                            <React.Fragment key={mes}>
                              <th colSpan={2} className="text-center">{mes}</th>
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
                          {meses.map(mes => {
                            const dadosMes = dadosProjeto.dados[mes]?.mes;
                            const dadosAcumulado = dadosProjeto.dados[mes]?.acumulado;
                            const editable = podeEditar(mes);

                            return (
                              <React.Fragment key={mes}>
                                <td className="text-center" style={{ color: '#198754' }}>
                                  {renderizarValor(dadosMes?.receita || 0, 'receita', editable, dadosProjeto.projeto, mes)}
                                </td>
                                <td className="text-center" style={{ color: '#198754' }}>{formatCurrency(dadosAcumulado?.receita || 0)}</td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                        <tr>
                          <td>Desoneração</td>
                          {meses.map(mes => {
                            const dadosMes = dadosProjeto.dados[mes]?.mes;
                            const dadosAcumulado = dadosProjeto.dados[mes]?.acumulado;
                            const editable = podeEditar(mes);

                            return (
                              <React.Fragment key={mes}>
                                <td className="text-center" style={{ color: '#0dcaf0' }}>
                                  {renderizarValor(dadosMes?.desoneracao || 0, 'desoneracao', editable, dadosProjeto.projeto, mes)}
                                </td>
                                <td className="text-center" style={{ color: '#0dcaf0' }}>{formatCurrency(dadosAcumulado?.desoneracao || 0)}</td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                        <tr>
                          <td>Custo</td>
                          {meses.map(mes => {
                            const dadosMes = dadosProjeto.dados[mes]?.mes;
                            const dadosAcumulado = dadosProjeto.dados[mes]?.acumulado;
                            const editable = podeEditar(mes);

                            return (
                              <React.Fragment key={mes}>
                                <td className="text-center" style={{ color: '#dc3545' }}>
                                  {renderizarValor(dadosMes?.custo || 0, 'custo', editable, dadosProjeto.projeto, mes)}
                                </td>
                                <td className="text-center" style={{ color: '#dc3545' }}>{formatCurrency(dadosAcumulado?.custo || 0)}</td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                        <tr>
                          <td>Margem</td>
                          {meses.map(mes => {
                            const dadosMes = dadosProjeto.dados[mes]?.mes;
                            const dadosAcumulado = dadosProjeto.dados[mes]?.acumulado;
                            const getMargemStyle = (margem: number) => ({
                              color: margem >= 7 ? '#198754' : '#dc3545',
                              fontWeight: 'bold'
                            });

                            return (
                              <React.Fragment key={mes}>
                                <td className="text-center" style={getMargemStyle(dadosMes?.margem || 0)}>
                                  {formatPercent(dadosMes?.margem || 0)}
                                </td>
                                <td className="text-center" style={getMargemStyle(dadosAcumulado?.margem || 0)}>
                                  {formatPercent(dadosAcumulado?.margem || 0)}
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
