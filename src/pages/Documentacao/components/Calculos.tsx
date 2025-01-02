import React from 'react';
import { Card } from 'react-bootstrap';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const Calculos: React.FC = () => {
  return (
    <div>
      <h2 className="mb-4">Cálculos e Regras de Negócio</h2>

      <Card className="mb-4">
        <Card.Header>
          <h3 className="h5 mb-0">Cálculo de Margem e Tratamento de Custos</h3>
        </Card.Header>
        <Card.Body>
          <div className="alert alert-warning mb-4">
            <i className="bi bi-exclamation-triangle me-2"></i>
            <strong>Atenção aos Sinais:</strong> O tratamento incorreto dos sinais dos custos pode levar a cálculos de margem incorretos.
            Sempre verifique se os custos estão sendo mantidos como valores negativos durante todo o processamento.
          </div>

          <h4 className="h6">Regras para Custos</h4>
          <ul>
            <li>Custos são sempre mantidos como valores negativos no sistema</li>
            <li>Apenas custos do tipo CLT, Outros e Subcontratados são considerados</li>
            <li>O valor absoluto do custo só é utilizado no momento do cálculo da margem</li>
            <li>Custos acumulados preservam o sinal negativo na soma</li>
          </ul>

          <h4 className="h6 mt-4">Validação de Custos</h4>
          <p>Os seguintes tipos de custo são considerados válidos:</p>
          <SyntaxHighlighter language="typescript" style={docco}>
            {`// Função de validação de custos
const isCustoValido = (contaResumo: string) => {
  const normalizado = contaResumo.toLowerCase().trim();
  return (
    normalizado.includes('clt') ||
    normalizado.includes('outros') ||
    normalizado.includes('subcontratados')
  );
};`}
          </SyntaxHighlighter>

          <h4 className="h6 mt-4">Fórmula da Margem</h4>
          <p>O cálculo da margem segue a seguinte fórmula:</p>
          <SyntaxHighlighter language="typescript" style={docco}>
            {`// 1. Custo ajustado = |Custo| - Desoneração
// 2. Margem = (1 - (Custo ajustado / Receita)) * 100

// Exemplo 1: Margem Positiva
const exemplo1 = {
  custo: -100000,        // Custo sempre negativo
  desoneracao: 10000,    // Desoneração sempre positiva
  receita: 150000        // Receita sempre positiva
};
const custoAjustado1 = Math.abs(exemplo1.custo) - exemplo1.desoneracao;  // 90000
const margem1 = (1 - (custoAjustado1 / exemplo1.receita)) * 100;        // 40%

// Exemplo 2: Margem Negativa
const exemplo2 = {
  custo: -120000,        // Custo maior que receita
  desoneracao: 5000,
  receita: 100000
};
const custoAjustado2 = Math.abs(exemplo2.custo) - exemplo2.desoneracao;  // 115000
const margem2 = (1 - (custoAjustado2 / exemplo2.receita)) * 100;        // -15%`}
          </SyntaxHighlighter>

          <h4 className="h6 mt-4">Importante: Tratamento de Sinais</h4>
          <div className="alert alert-info">
            <i className="bi bi-info-circle me-2"></i>
            <p className="mb-2">Os custos são mantidos como valores negativos durante todo o processamento para garantir a integridade dos dados.
            O valor absoluto (Math.abs) é aplicado apenas no momento do cálculo da margem.</p>
            <p className="mb-0">Exemplo de verificação: Se um custo aparecer como positivo em Jun/24, isso indica um problema no processamento dos dados.</p>
          </div>

          <h4 className="h6 mt-4">Processamento de Custos</h4>
          <SyntaxHighlighter language="typescript" style={docco}>
            {`// Exemplo completo de processamento
// 1. Recebimento e validação da transação
if (transacao.natureza === 'CUSTO' && isCustoValido(transacao.contaResumo)) {
  // Mantém o valor negativo original
  dadosMensais[mes].custo += valor;  // valor já deve ser negativo
}

// 2. Processamento mensal
const processarDadosMensais = (dadosMes) => {
  // Garantir que custos sejam negativos
  if (dadosMes.custo > 0) {
    dadosMes.custo = -dadosMes.custo;
  }

  // Cálculo da margem
  const custoAjustado = Math.abs(dadosMes.custo) - dadosMes.desoneracao;
  dadosMes.margem = dadosMes.receita > 0 
    ? (1 - (custoAjustado / dadosMes.receita)) * 100 
    : 0;
};

// 3. Processamento acumulado
const processarAcumulados = (meses) => {
  let custoAcumulado = 0;
  let receitaAcumulada = 0;
  let desoneracaoAcumulada = 0;

  meses.forEach(mes => {
    custoAcumulado += dadosMensais[mes].custo;        // Mantém negativo
    receitaAcumulada += dadosMensais[mes].receita;    // Sempre positivo
    desoneracaoAcumulada += dadosMensais[mes].desoneracao;  // Sempre positivo
    
    // Cálculo da margem acumulada
    const custoAjustadoAcum = Math.abs(custoAcumulado) - desoneracaoAcumulada;
    const margemAcumulada = receitaAcumulada > 0
      ? (1 - (custoAjustadoAcum / receitaAcumulada)) * 100
      : 0;
  });
};`}
          </SyntaxHighlighter>

          <h4 className="h6 mt-4">Checklist de Validação</h4>
          <div className="alert alert-secondary">
            <p className="mb-2">Ao analisar os dados, verifique:</p>
            <ol className="mb-0">
              <li>Todos os custos estão negativos?</li>
              <li>A desoneração está sendo subtraída corretamente?</li>
              <li>Os valores acumulados mantêm os sinais corretos?</li>
              <li>As margens estão sendo calculadas com o módulo do custo?</li>
              <li>Apenas custos válidos (CLT, Outros, Subcontratados) estão sendo considerados?</li>
            </ol>
          </div>

          <h4 className="h6 mt-4">Exibição da Margem</h4>
          <p>A margem é exibida com cores diferentes baseadas no valor:</p>
          <ul>
            <li><span className="fw-bold" style={{ color: '#198754' }}>Verde</span>: Margem maior ou igual a 7% (dentro do esperado)</li>
            <li><span className="fw-bold" style={{ color: '#dc3545' }}>Vermelho</span>: Margem menor que 7% (requer atenção)</li>
          </ul>

          <div className="alert alert-info mt-4">
            <i className="bi bi-lightbulb me-2"></i>
            <strong>Dica:</strong> Para facilitar a análise, os valores são centralizados na tabela e formatados com cores 
            indicativas (verde para receitas, vermelho para custos, azul para desoneração).
          </div>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>
          <h3 className="h5 mb-0">Custos Válidos</h3>
        </Card.Header>
        <Card.Body>
          <p>São considerados custos válidos apenas:</p>
          <ul>
            <li>CLT</li>
            <li>Outros</li>
            <li>Subcontratados</li>
          </ul>
          <p>A validação é feita normalizando a string (removendo acentos e convertendo para minúsculo):</p>
          <SyntaxHighlighter language="typescript" style={docco}>
            {`const contaResumoNormalizada = contaResumo
  .normalize('NFD')
  .replace(/[\\u0300-\\u036f]/g, '')
  .toLowerCase()
  .trim();

const isCLT = contaResumoNormalizada.includes('clt');
const isOutros = contaResumoNormalizada.includes('outros');
const isSubcontratados = contaResumoNormalizada.includes('subcontratados');
const isCustoValido = isCLT || isOutros || isSubcontratados;`}
          </SyntaxHighlighter>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>
          <h3 className="h5 mb-0">Regras de Edição</h3>
        </Card.Header>
        <Card.Body>
          <h4 className="h6">1. Edição de Meses Futuros</h4>
          <SyntaxHighlighter language="typescript" style={docco}>
            {`const podeEditar = (mes: string) => {
  const [mesStr] = mes.split('/');
  const mesIndex = parseInt(mesStr) - 1;
  return selectedYear > anoAtual || 
    (selectedYear === anoAtual && mesIndex > mesAtual);
};`}
          </SyntaxHighlighter>

          <h4 className="h6 mt-4">2. Formatação Automática</h4>
          <ul>
            <li>Valores monetários: R$ XX.XXX,XX</li>
            <li>Percentuais: XX,XX%</li>
            <li>Valores em milhões: X,XX Mi</li>
          </ul>

          <h4 className="h6 mt-4">3. Recálculo Automático</h4>
          <p>Ao editar um valor:</p>
          <ul>
            <li>A margem do mês é recalculada</li>
            <li>Todos os valores acumulados são recalculados</li>
            <li>O gráfico é atualizado automaticamente</li>
          </ul>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Calculos;
