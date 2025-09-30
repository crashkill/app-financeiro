import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { db, Transacao } from '../db/database';

const SimpleDashboard = () => {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Carregando...');

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setStatus('Iniciando carregamento...');
        console.log('SimpleDashboard: Iniciando carregamento');
        
        // Verificar se o banco está aberto
        if (!db.isOpen()) {
          setStatus('Abrindo banco de dados...');
          await db.open();
        }
        
        setStatus('Contando transações...');
        const count = await db.transacoes.count();
        console.log(`SimpleDashboard: ${count} transações encontradas`);
        
        if (count === 0) {
          setStatus('Banco vazio - nenhuma transação encontrada');
          setTransacoes([]);
          setLoading(false);
          return;
        }
        
        setStatus('Carregando transações...');
        const dados = await db.transacoes.toArray();
        console.log(`SimpleDashboard: ${dados.length} transações carregadas`);
        
        setTransacoes(dados);
        setStatus(`${dados.length} transações carregadas com sucesso`);
        setLoading(false);
        
      } catch (err: any) {
        console.error('SimpleDashboard: Erro ao carregar dados:', err);
        setError(`Erro: ${err.message || 'Erro desconhecido'}`);
        setStatus('Erro no carregamento');
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  const calcularTotais = () => {
    const receitas = transacoes
      .filter(t => t.natureza === 'RECEITA')
      .reduce((sum, t) => sum + (t.valor || 0), 0);
      
    const despesas = transacoes
      .filter(t => t.natureza === 'CUSTO')
      .reduce((sum, t) => sum + (t.valor || 0), 0);
      
    return { receitas, despesas, lucro: receitas - despesas };
  };

  const { receitas, despesas, lucro } = calcularTotais();

  return (
    <Container fluid className="p-4">
      <h2>Dashboard Simplificado</h2>
      
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Card.Title>Status</Card.Title>
              <Card.Text>{status}</Card.Text>
              {loading && <div className="spinner-border" role="status"></div>}
              {error && (
                <div className="alert alert-danger">
                  <strong>Erro:</strong> {error}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {!loading && !error && (
        <>
          <Row className="mb-4">
            <Col md={4}>
              <Card className="text-center">
                <Card.Body>
                  <Card.Title>Receitas</Card.Title>
                  <Card.Text className="h4 text-success">
                    R$ {receitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center">
                <Card.Body>
                  <Card.Title>Despesas</Card.Title>
                  <Card.Text className="h4 text-danger">
                    R$ {despesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center">
                <Card.Body>
                  <Card.Title>Lucro</Card.Title>
                  <Card.Text className={`h4 ${lucro >= 0 ? 'text-success' : 'text-danger'}`}>
                    R$ {lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col>
              <Card>
                <Card.Body>
                  <Card.Title>Transações ({transacoes.length})</Card.Title>
                  {transacoes.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Descrição</th>
                            <th>Valor</th>
                            <th>Natureza</th>
                            <th>Projeto</th>
                            <th>Período</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transacoes.slice(0, 10).map((t, index) => (
                            <tr key={t.id || index}>
                              <td>{t.descricao || 'N/A'}</td>
                              <td className={t.natureza === 'RECEITA' ? 'text-success' : 'text-danger'}>
                                R$ {(t.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td>
                                <span className={`badge ${t.natureza === 'RECEITA' ? 'bg-success' : 'bg-danger'}`}>
                                  {t.natureza || 'N/A'}
                                </span>
                              </td>
                              <td>{t.projeto || 'N/A'}</td>
                              <td>{t.periodo || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {transacoes.length > 10 && (
                        <p className="text-muted">Mostrando apenas as primeiras 10 transações...</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted">Nenhuma transação encontrada.</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default SimpleDashboard;