import React from 'react';
import { Container, Card, Row, Col } from 'react-bootstrap';

const Documentacao = () => {
  return (
    <Container fluid>
      <h1 className="mb-4">Documentação do Sistema</h1>

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header as="h2">Regras de Preenchimento</Card.Header>
            <Card.Body>
              <h3>Linha de Receita</h3>
              <p>
                A linha de receita é preenchida de acordo com as seguintes regras:
              </p>
              <ul>
                <li>
                  <strong>Valor:</strong> Utiliza o valor da coluna "lancamento" do relatório
                </li>
                <li>
                  <strong>Condição:</strong> O item da coluna "ContaResumo" deve ser igual a "Receita Devengada"
                </li>
                <li>
                  <strong>Distribuição:</strong> Os valores são distribuídos mês a mês de acordo com a coluna "Periodo" do relatório
                </li>
                <li>
                  <strong>Importante:</strong> Os valores podem ser positivos ou negativos e devem ser considerados exatamente como estão no lançamento
                </li>
              </ul>

              <h4>Exemplo</h4>
              <p>
                Para os lançamentos:
              </p>
              <ul>
                <li>
                  Lançamento positivo:
                  <ul>
                    <li>ContaResumo = "Receita Devengada"</li>
                    <li>Lancamento = 10000</li>
                    <li>Periodo = "6/2023"</li>
                    <li>Resultado: +10000 em Junho/2023</li>
                  </ul>
                </li>
                <li>
                  Lançamento negativo (ex: estorno):
                  <ul>
                    <li>ContaResumo = "Receita Devengada"</li>
                    <li>Lancamento = -5000</li>
                    <li>Periodo = "6/2023"</li>
                    <li>Resultado: -5000 em Junho/2023</li>
                  </ul>
                </li>
              </ul>

              <h4>Observações</h4>
              <ul>
                <li>Apenas lançamentos com "Receita Devengada" são considerados para a linha de receita</li>
                <li>O período determina em qual coluna (mês) o valor será exibido</li>
                <li>Valores de outros tipos de ContaResumo não afetam a linha de receita</li>
                <li>Valores negativos (como estornos) devem ser mantidos negativos na exibição</li>
                <li>O total da receita será a soma algébrica de todos os lançamentos (positivos e negativos)</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Documentacao;
