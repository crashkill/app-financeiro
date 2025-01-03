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

  // Carregar dados financeiros
  useEffect(() => {
    const carregarDadosFinanceiros = async () => {
      if (!selectedYear) return;
      
      setIsLoading(true);
      try {
        const projetosParaCarregar = selectedProjects.length > 0 ? selectedProjects : projects;
        const dadosProjetos: DadosProjeto[] = [];

        // Buscar todas as transações de uma vez
        const transacoes = await db.transacoes
          .where('periodo')
          .between(`1/${selectedYear}`, `12/${selectedYear}`)
          .toArray();

        console.log('Todas as transações:', transacoes);

        // Agrupar transações por projeto
        const transacoesPorProjeto = transacoes.reduce((acc, transacao) => {
          const projeto = transacao.projeto || transacao.descricao || 'Sem Projeto';
          if (!acc[projeto]) {
            acc[projeto] = [];
          }
          acc[projeto].push(transacao);
          return acc;
        }, {} as { [key: string]: Transacao[] });

        // Processar apenas os projetos selecionados
        for (const projeto of projetosParaCarregar) {
          console.log(`\nProcessando projeto: ${projeto}`);
          if (!transacoesPorProjeto[projeto]) continue;

          const dadosProjeto: DadosProjeto = {
            projeto,
            dados: {}
          };

          // Inicializar dados mensais
          for (let mes = 1; mes <= 12; mes++) {
            dadosProjeto.dados[mes] = {
              mensal: { receita: 0, desoneracao: 0, custo: 0, margem: 0 },
              acumulado: { receita: 0, desoneracao: 0, custo: 0, margem: 0 }
            };
          }

          // Processar transações do projeto
          for (const transacao of transacoesPorProjeto[projeto]) {
            if (!transacao.periodo) continue;
            
            const [mes] = transacao.periodo.split('/').map(Number);
            if (!dadosProjeto.dados[mes]) continue;

            const valor = transacao.valor || 0;
            const contaResumo = (transacao.contaResumo || '').toLowerCase().trim()
              .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            
            console.log(`Mês: ${mes}, ContaResumo: ${contaResumo}, Valor: ${valor}`);

            // Receita Devengada
            if (contaResumo === 'receita devengada') {
              dadosProjeto.dados[mes].mensal.receita += valor;
              console.log(`Adicionando receita: ${valor} ao mês ${mes}`);
            }
            // Desoneração da Folha
            else if (contaResumo === 'desoneracao da folha') {
              dadosProjeto.dados[mes].mensal.desoneracao += valor;
              console.log(`Adicionando desoneração: ${valor} ao mês ${mes}`);
            }
            // CLT, Outros e Subcontratados
            else if (['clt', 'outros', 'subcontratados'].includes(contaResumo)) {
              dadosProjeto.dados[mes].mensal.custo += valor;
              console.log(`Adicionando custo: ${valor} ao mês ${mes}`);
            }
          }

          // Log dos dados mensais
          for (let mes = 1; mes <= 12; mes++) {
            console.log(`\nMês ${mes}:`, dadosProjeto.dados[mes].mensal);
          }

          // Calcular margens e acumulados
          let receitaAcum = 0;
          let custoAcum = 0;
          let desoneracaoAcum = 0;

          for (let mes = 1; mes <= 12; mes++) {
            const dadosMes = dadosProjeto.dados[mes].mensal;
            
            // Calcular margem mensal
            const custoAjustado = Math.abs(dadosMes.custo) - dadosMes.desoneracao;
            dadosMes.margem = dadosMes.receita !== 0 
              ? (1 - (custoAjustado / dadosMes.receita)) * 100 
              : 0;

            // Calcular acumulados
            receitaAcum += dadosMes.receita;
            custoAcum += dadosMes.custo;
            desoneracaoAcum += dadosMes.desoneracao;

            const custoAjustadoAcum = Math.abs(custoAcum) - desoneracaoAcum;
            dadosProjeto.dados[mes].acumulado = {
              receita: receitaAcum,
              custo: custoAcum,
              desoneracao: desoneracaoAcum,
              margem: receitaAcum !== 0 
                ? (1 - (custoAjustadoAcum / receitaAcum)) * 100 
                : 0
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
  }, [selectedProjects, selectedYear, projects]);

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
                            const dados = dadosProjeto.dados[mes];
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
                            const dados = dadosProjeto.dados[mes];
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
                            const dados = dadosProjeto.dados[mes];
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
                            const dados = dadosProjeto.dados[mes];
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
