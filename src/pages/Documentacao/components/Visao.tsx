import React from 'react';
import { Card } from 'react-bootstrap';

const Visao: React.FC = () => {
  return (
    <div>
      <h2 className="mb-4">Visão Geral do Sistema</h2>

      <Card className="mb-4">
        <Card.Header>
          <h3 className="h5 mb-0">Objetivo</h3>
        </Card.Header>
        <Card.Body>
          <p>O App Financeiro é uma aplicação web desenvolvida para gerenciar e visualizar dados financeiros de projetos, 
          com foco em análise de receitas, custos e margens.</p>
          
          <h4 className="h6 mt-4">Principais Funcionalidades</h4>
          <ul>
            <li>Visualização de dados financeiros por projeto</li>
            <li>Análise de margens e desempenho</li>
            <li>Projeções financeiras</li>
            <li>Gestão de custos e receitas</li>
          </ul>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>
          <h3 className="h5 mb-0">Módulos Principais</h3>
        </Card.Header>
        <Card.Body>
          <h4 className="h6">1. Dashboard</h4>
          <ul>
            <li>Visão geral do desempenho financeiro</li>
            <li>Gráficos interativos</li>
            <li>Indicadores principais</li>
            <li>Filtros dinâmicos</li>
          </ul>

          <h4 className="h6 mt-3">2. Planilhas Financeiras</h4>
          <ul>
            <li>Visualização detalhada por projeto</li>
            <li>Edição de valores futuros</li>
            <li>Cálculos automáticos de margens</li>
            <li>Análise mensal e acumulada</li>
          </ul>

          <h4 className="h6 mt-3">3. Relatórios</h4>
          <ul>
            <li>Exportação de dados</li>
            <li>Análises comparativas</li>
            <li>Histórico de desempenho</li>
          </ul>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>
          <h3 className="h5 mb-0">Usuários e Permissões</h3>
        </Card.Header>
        <Card.Body>
          <h4 className="h6">Administrador</h4>
          <ul>
            <li>Acesso completo ao sistema</li>
            <li>Gerenciamento de usuários</li>
            <li>Acesso à documentação técnica</li>
            <li>Configurações do sistema</li>
          </ul>

          <h4 className="h6 mt-3">Usuário Padrão</h4>
          <ul>
            <li>Visualização de dados financeiros</li>
            <li>Edição de projeções futuras</li>
            <li>Acesso aos relatórios básicos</li>
          </ul>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>
          <h3 className="h5 mb-0">Fluxo de Trabalho</h3>
        </Card.Header>
        <Card.Body>
          <ol>
            <li>Importação/cadastro de dados financeiros</li>
            <li>Processamento e cálculos automáticos</li>
            <li>Visualização em dashboard e planilhas</li>
            <li>Análise e ajustes de projeções</li>
            <li>Geração de relatórios e exportações</li>
          </ol>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Visao;
