import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

const Documentacao: React.FC = () => {
  return (
    <Container fluid className="py-3">
      <h1 className="mb-4">Documentação do Sistema Financeiro</h1>

      {/* Planilhas Financeiras */}
      <Card className="mb-4">
        <Card.Header>
          <h2>Planilhas Financeiras</h2>
        </Card.Header>
        <Card.Body>
          <h3>Visão Geral</h3>
          <p>Página que exibe os dados financeiros históricos dos projetos, organizados por mês, com valores mensais e acumulados.</p>

          <h4>Regras de Visualização</h4>
          <ul>
            <li><strong>Seleção de Dados</strong>
              <ul>
                <li>Filtro por projeto(s)</li>
                <li>Filtro por ano</li>
                <li>Possibilidade de selecionar múltiplos projetos</li>
                <li>Exibição em formato de tabela com valores mensais e acumulados</li>
              </ul>
            </li>
            <li><strong>Layout da Tabela</strong>
              <ul>
                <li>Linhas: Receita, Desoneração, Custo e Margem</li>
                <li>Colunas: Meses do ano (Jan a Dez)</li>
                <li>Cada mês possui duas colunas: Mensal e Acumulado</li>
                <li>Valores são centralizados nas células</li>
              </ul>
            </li>
          </ul>

          <h4>Regras de Cálculo</h4>
          <ul>
            <li><strong>Receita</strong>
              <ul>
                <li>Considera apenas transações com conta resumo "RECEITA DEVENGADA"</li>
                <li>Valor mantido como está no banco (positivo ou negativo)</li>
                <li>Acumulado: Soma das receitas até o mês atual</li>
              </ul>
            </li>
            <li><strong>Desoneração</strong>
              <ul>
                <li>Considera apenas transações com conta resumo "DESONERAÇÃO DA FOLHA"</li>
                <li>Valor mantido como está no banco</li>
                <li>Acumulado: Soma das desonerações até o mês atual</li>
              </ul>
            </li>
            <li><strong>Custo</strong>
              <ul>
                <li>Considera transações com conta resumo: "CLT", "OUTROS", "SUBCONTRATADOS"</li>
                <li>Valor mantido como está no banco (negativo)</li>
                <li>Acumulado: Soma dos custos até o mês atual</li>
              </ul>
            </li>
            <li><strong>Margem</strong>
              <ul>
                <li>Mensal: ((Receita - |Custo| + Desoneração) / Receita) * 100</li>
                <li>Acumulada: ((Receita Acumulada - |Custo Acumulado| + Desoneração Acumulada) / Receita Acumulada) * 100</li>
                <li>Se não houver receita, margem é 0%</li>
              </ul>
            </li>
          </ul>

          <h4>Regras de Cores</h4>
          <Row>
            <Col md={6}>
              <ul>
                <li><strong>Receita</strong>: <span style={{ color: '#198754' }}>Verde (#198754)</span></li>
                <li><strong>Desoneração</strong>: <span style={{ color: '#0dcaf0' }}>Azul claro (#0dcaf0)</span></li>
                <li><strong>Custo</strong>: <span style={{ color: '#dc3545' }}>Vermelho (#dc3545)</span></li>
                <li><strong>Margem</strong>:
                  <ul>
                    <li><span style={{ color: '#28a745', fontWeight: 'bold' }}>Verde (#28a745)</span> quando &gt;= 7%</li>
                    <li><span style={{ color: '#dc3545', fontWeight: 'bold' }}>Vermelho (#dc3545)</span> quando &lt; 7%</li>
                  </ul>
                </li>
              </ul>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Forecast */}
      <Card className="mb-4">
        <Card.Header>
          <h2>Forecast</h2>
        </Card.Header>
        <Card.Body>
          <h3>Visão Geral</h3>
          <p>Página que permite visualizar e editar previsões financeiras futuras dos projetos.</p>

          <h4>Regras de Visualização</h4>
          <ul>
            <li><strong>Seleção de Dados</strong>
              <ul>
                <li>Filtro por projeto(s)</li>
                <li>Filtro por ano</li>
                <li>Possibilidade de selecionar múltiplos projetos</li>
                <li>Exibição em formato de tabela com valores mensais</li>
              </ul>
            </li>
            <li><strong>Layout da Tabela</strong>
              <ul>
                <li>Linhas: Receita, Custo Total, Margem Bruta e Margem %</li>
                <li>Colunas: Meses do ano (Jan a Dez) + Total</li>
                <li>Valores são centralizados nas células</li>
              </ul>
            </li>
          </ul>

          <h4>Regras de Cálculo</h4>
          <ul>
            <li><strong>Receita</strong>
              <ul>
                <li>Considera apenas transações com "RECEITA DEVENGADA"</li>
                <li>Mantém o sinal original do valor</li>
                <li>Total: Soma de todas as receitas mensais</li>
              </ul>
            </li>
            <li><strong>Custo Total</strong>
              <ul>
                <li>Considera apenas transações de natureza "CUSTO"</li>
                <li>Mantém o sinal original do valor (negativo)</li>
                <li>Total: Soma de todos os custos mensais</li>
              </ul>
            </li>
            <li><strong>Margem Bruta</strong>
              <ul>
                <li>Mensal: Receita + Custo (custo já é negativo)</li>
                <li>Total: Soma de todas as margens brutas mensais</li>
              </ul>
            </li>
            <li><strong>Margem %</strong>
              <ul>
                <li>Mensal: (Margem Bruta / |Receita|) * 100</li>
                <li>Total: (Margem Bruta Total / |Receita Total|) * 100</li>
                <li>Se não houver receita, margem é 0%</li>
              </ul>
            </li>
          </ul>

          <h4>Regras de Cores</h4>
          <Row>
            <Col md={6}>
              <ul>
                <li><strong>Receita</strong>: <span style={{ color: '#28a745' }}>Verde (#28a745)</span></li>
                <li><strong>Custo Total</strong>: <span style={{ color: '#dc3545' }}>Vermelho (#dc3545)</span></li>
                <li><strong>Margem Bruta</strong>: <span style={{ color: '#4A90E2' }}>Azul (#4A90E2)</span></li>
                <li><strong>Margem %</strong>:
                  <ul>
                    <li><span style={{ color: '#28a745', fontWeight: 'bold' }}>Verde (#28a745)</span> quando &gt;= 7%</li>
                    <li><span style={{ color: '#dc3545', fontWeight: 'bold' }}>Vermelho (#dc3545)</span> quando &lt; 7%</li>
                  </ul>
                </li>
              </ul>
            </Col>
          </Row>

          <h4>Regras de Edição</h4>
          <ul>
            <li><strong>Campos Editáveis</strong>
              <ul>
                <li>Apenas receita e custo são editáveis</li>
                <li>Apenas meses futuros podem ser editados</li>
                <li>Meses passados são somente leitura</li>
              </ul>
            </li>
            <li><strong>Validação de Entrada</strong>
              <ul>
                <li>Aceita apenas valores numéricos</li>
                <li>Formata automaticamente como moeda</li>
                <li>Atualiza margens automaticamente ao editar</li>
              </ul>
            </li>
            <li><strong>Persistência</strong>
              <ul>
                <li>Valores editados são salvos automaticamente</li>
                <li>Recalcula totais e margens após cada edição</li>
              </ul>
            </li>
          </ul>
        </Card.Body>
      </Card>

      {/* Importação */}
      <Card className="mb-4">
        <Card.Header>
          <h2>Importação</h2>
        </Card.Header>
        <Card.Body>
          <h3>Visão Geral</h3>
          <p>Página responsável pela importação de dados financeiros através de arquivos Excel.</p>

          <h4>Regras de Importação</h4>
          <ul>
            <li><strong>Formato do Arquivo</strong>
              <ul>
                <li>Arquivo Excel (.xlsx)</li>
                <li>Estrutura de colunas específica</li>
                <li>Dados organizados por período e conta</li>
              </ul>
            </li>
            <li><strong>Validações</strong>
              <ul>
                <li>Verifica existência de todas as colunas obrigatórias</li>
                <li>Valida formato das datas (MM/YYYY)</li>
                <li>Verifica se os valores são numéricos</li>
                <li>Confirma se o projeto existe no sistema</li>
              </ul>
            </li>
          </ul>

          <h4>Colunas Obrigatórias</h4>
          <ul>
            <li><strong>Projeto</strong>: Código do projeto</li>
            <li><strong>ContaResumo</strong>: Tipo de lançamento (RECEITA DEVENGADA, CLT, etc)</li>
            <li><strong>Periodo</strong>: Mês/Ano do lançamento (MM/YYYY)</li>
            <li><strong>Lancamento</strong>: Valor do lançamento</li>
          </ul>

          <h4>Processo de Importação</h4>
          <ol>
            <li>Upload do arquivo Excel</li>
            <li>Validação do formato e estrutura</li>
            <li>Processamento dos dados</li>
            <li>Confirmação da importação</li>
            <li>Exibição do resultado (sucesso/erros)</li>
          </ol>
        </Card.Body>
      </Card>

      {/* Dashboard */}
      <Card className="mb-4">
        <Card.Header>
          <h2>Dashboard</h2>
        </Card.Header>
        <Card.Body>
          <h3>Visão Geral</h3>
          <p>Página que apresenta indicadores e gráficos consolidados dos dados financeiros.</p>

          <h4>Componentes</h4>
          <ul>
            <li><strong>Filtros</strong>
              <ul>
                <li>Seleção de período (ano)</li>
                <li>Seleção de projeto(s)</li>
                <li>Tipo de visualização</li>
              </ul>
            </li>
            <li><strong>Gráficos</strong>
              <ul>
                <li>Evolução da Receita</li>
                <li>Evolução do Custo</li>
                <li>Margem por Período</li>
                <li>Comparativo Anual</li>
              </ul>
            </li>
            <li><strong>Indicadores</strong>
              <ul>
                <li>Receita Total</li>
                <li>Custo Total</li>
                <li>Margem Média</li>
                <li>Tendência de Crescimento</li>
              </ul>
            </li>
          </ul>

          <h4>Regras de Cálculo</h4>
          <ul>
            <li><strong>Receita Total</strong>: Soma de todas as receitas do período</li>
            <li><strong>Custo Total</strong>: Soma de todos os custos do período</li>
            <li><strong>Margem Média</strong>: (Receita Total - |Custo Total|) / Receita Total * 100</li>
            <li><strong>Tendência</strong>: Comparação com o mesmo período do ano anterior</li>
          </ul>

          <h4>Regras de Cores</h4>
          <Row>
            <Col md={6}>
              <ul>
                <li><strong>Receita</strong>: <span style={{ color: '#28a745' }}>Verde (#28a745)</span></li>
                <li><strong>Custo</strong>: <span style={{ color: '#dc3545' }}>Vermelho (#dc3545)</span></li>
                <li><strong>Margem</strong>: <span style={{ color: '#4A90E2' }}>Azul (#4A90E2)</span></li>
                <li><strong>Tendência</strong>:
                  <ul>
                    <li><span style={{ color: '#28a745' }}>Verde</span>: Crescimento</li>
                    <li><span style={{ color: '#dc3545' }}>Vermelho</span>: Queda</li>
                    <li><span style={{ color: '#ffc107' }}>Amarelo</span>: Estável</li>
                  </ul>
                </li>
              </ul>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Projetos */}
      <Card className="mb-4">
        <Card.Header>
          <h2>Projetos</h2>
        </Card.Header>
        <Card.Body>
          <h3>Visão Geral</h3>
          <p>Página de gerenciamento de projetos do sistema.</p>

          <h4>Funcionalidades</h4>
          <ul>
            <li><strong>Cadastro de Projeto</strong>
              <ul>
                <li>Código do projeto</li>
                <li>Nome do projeto</li>
                <li>Cliente</li>
                <li>Data de início</li>
                <li>Status (Ativo/Inativo)</li>
              </ul>
            </li>
            <li><strong>Listagem de Projetos</strong>
              <ul>
                <li>Filtros por status</li>
                <li>Busca por código ou nome</li>
                <li>Ordenação por colunas</li>
              </ul>
            </li>
            <li><strong>Edição de Projeto</strong>
              <ul>
                <li>Atualização de dados cadastrais</li>
                <li>Alteração de status</li>
                <li>Histórico de modificações</li>
              </ul>
            </li>
          </ul>

          <h4>Regras de Negócio</h4>
          <ul>
            <li>Código do projeto deve ser único</li>
            <li>Não permite exclusão de projetos com lançamentos</li>
            <li>Inativação mantém histórico de lançamentos</li>
            <li>Registro de data e usuário das alterações</li>
          </ul>

          <h4>Validações</h4>
          <ul>
            <li>Código: Alfanumérico, máximo 10 caracteres</li>
            <li>Nome: Obrigatório, máximo 100 caracteres</li>
            <li>Cliente: Obrigatório</li>
            <li>Data de início: Data válida, não futura</li>
          </ul>
        </Card.Body>
      </Card>

      {/* Configurações */}
      <Card className="mb-4">
        <Card.Header>
          <h2>Configurações</h2>
        </Card.Header>
        <Card.Body>
          <h3>Visão Geral</h3>
          <p>Página de configurações gerais do sistema.</p>

          <h4>Parâmetros Configuráveis</h4>
          <ul>
            <li><strong>Margem</strong>
              <ul>
                <li>Percentual mínimo aceitável</li>
                <li>Cores de indicação (faixas)</li>
              </ul>
            </li>
            <li><strong>Contas</strong>
              <ul>
                <li>Tipos de conta resumo</li>
                <li>Classificação (Receita/Custo)</li>
                <li>Ordem de exibição</li>
              </ul>
            </li>
            <li><strong>Relatórios</strong>
              <ul>
                <li>Período padrão</li>
                <li>Formato de exportação</li>
                <li>Campos incluídos</li>
              </ul>
            </li>
          </ul>

          <h4>Permissões</h4>
          <ul>
            <li>Apenas administradores podem alterar configurações</li>
            <li>Alterações são registradas em log</li>
            <li>Algumas configurações requerem confirmação</li>
          </ul>
        </Card.Body>
      </Card>

      {/* Segurança */}
      <Card className="mb-4">
        <Card.Header>
          <h2>Segurança</h2>
        </Card.Header>
        <Card.Body>
          <h3>Medidas de Segurança Implementadas</h3>
          
          <h4>Proteção da Aplicação</h4>
          <ul>
            <li><strong>Headers de Segurança</strong>
              <ul>
                <li>X-Frame-Options: Proteção contra clickjacking</li>
                <li>Content Security Policy (CSP): Controle de recursos</li>
                <li>HSTS: Força conexões HTTPS</li>
                <li>X-Content-Type-Options: Previne MIME-type sniffing</li>
              </ul>
            </li>
            <li><strong>Autenticação</strong>
              <ul>
                <li>JWT com refresh tokens</li>
                <li>Cookies httpOnly para tokens</li>
                <li>Timeout por inatividade</li>
                <li>Proteção contra força bruta</li>
              </ul>
            </li>
          </ul>

          <h4>Proteção de Dados</h4>
          <ul>
            <li><strong>Conformidade LGPD</strong>
              <ul>
                <li>Criptografia de dados sensíveis</li>
                <li>Política de retenção de dados</li>
                <li>Processo de exclusão de dados</li>
              </ul>
            </li>
            <li><strong>Auditoria</strong>
              <ul>
                <li>Log de ações sensíveis</li>
                <li>Monitoramento de tentativas de acesso</li>
                <li>Backup regular dos dados</li>
              </ul>
            </li>
          </ul>

          <h4>Boas Práticas</h4>
          <ul>
            <li>Validação de entrada em todos os formulários</li>
            <li>Sanitização de dados antes da renderização</li>
            <li>Proteção contra injeção de código</li>
            <li>Atualizações regulares de dependências</li>
          </ul>
        </Card.Body>
      </Card>

    </Container>
  );
};

export default Documentacao;
