import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import ForecastTable from '../components/ForecastTable';
import ProjectFilterReusable from '../components/filters/ProjectFilterReusable';
import YearFilterReusable from '../components/filters/YearFilterReusable';
import { db } from '../db/database';
import type { Transacao } from '../db/database';
import { ForecastData } from '../types/forecast';

const Forecast: React.FC = () => {
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [projects, setProjects] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);

  // Função para validar receita
  const isReceitaValida = (contaResumo: string) => {
    const normalizado = contaResumo.toLowerCase().trim();
    return normalizado.includes('receita devengada');
  };

  const processarDadosProjeto = async (projeto: string, ano: number, todasTransacoes: Transacao[]) => {
    const dados: ForecastData['dados'] = {};
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const mesesNumericos = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    
    // Filtra as transações do projeto e ano específicos
    const transacoesProjeto = todasTransacoes.filter(t => {
      const projetoMatch = t.projeto === projeto || t.descricao === projeto;
      const [, anoTransacao] = (t.periodo || '').split('/');
      const anoMatch = parseInt(anoTransacao) === ano;
      return projetoMatch && anoMatch;
    });

    console.log(`[${projeto}] Total de transações:`, transacoesProjeto.length);

    // Processa cada mês
    mesesNumericos.forEach((mesNumerico, mesIndex) => {
      const mesAno = `${meses[mesIndex]}/${String(ano).slice(-2)}`;
      
      // Inicializa dados do mês se não existirem
      if (!dados[mesAno]) {
        dados[mesAno] = {
          receita: 0,
          custoTotal: 0,
          margemBruta: 0,
          margemPercentual: 0
        };
      }
      
      // Filtra transações do mês atual
      const transacoesMes = transacoesProjeto.filter(t => {
        const [mesTransacao] = (t.periodo || '').split('/');
        return mesTransacao === mesNumerico;
      });

      // Processa receitas válidas - mantém o sinal original
      const receitasValidas = transacoesMes.filter(t => isReceitaValida(t.contaResumo || ''));
      const receitasMes = receitasValidas.reduce((sum, t) => sum + (t.valor || 0), 0);

      // Processa custos do mês - mantém o sinal original (negativo)
      const custosMes = transacoesMes
        .filter(t => t.natureza === 'CUSTO')
        .reduce((sum, t) => sum + (t.valor || 0), 0);

      // Atualiza dados do mês
      dados[mesAno].receita = receitasMes;
      dados[mesAno].custoTotal = custosMes;
      dados[mesAno].margemBruta = receitasMes + custosMes; // Soma com o custo negativo
      dados[mesAno].margemPercentual = receitasMes !== 0 
        ? (dados[mesAno].margemBruta / Math.abs(receitasMes)) * 100 
        : 0;

      console.log(`[${projeto}] Dados do mês ${mesAno}:`, dados[mesAno]);
    });

    // Se não houver dados em algum mês, usa o último valor válido
    let ultimaReceitaValida = 0;
    let ultimoCustoValido = 0;

    meses.forEach((mes, index) => {
      const mesAno = `${mes}/${String(ano).slice(-2)}`;
      const dadosMes = dados[mesAno];

      if (dadosMes.receita !== 0) {
        ultimaReceitaValida = dadosMes.receita;
      }
      if (dadosMes.custoTotal !== 0) {
        ultimoCustoValido = dadosMes.custoTotal;
      }

      if (dadosMes.receita === 0 && index > 0) {
        dadosMes.receita = ultimaReceitaValida;
      }
      if (dadosMes.custoTotal === 0 && index > 0) {
        dadosMes.custoTotal = ultimoCustoValido;
      }

      // Recalcula margens
      dadosMes.margemBruta = dadosMes.receita + dadosMes.custoTotal;
      dadosMes.margemPercentual = dadosMes.receita !== 0 
        ? (dadosMes.margemBruta / Math.abs(dadosMes.receita)) * 100 
        : 0;
    });

    // Calcula os totais a partir dos dados mensais
    const totais = Object.values(dados).reduce((acc, mes) => {
      acc.receita += mes.receita;
      acc.custoTotal += mes.custoTotal;
      return acc;
    }, { receita: 0, custoTotal: 0 });

    // Calcula margem bruta e percentual dos totais
    const margemBrutaTotal = totais.receita + totais.custoTotal;
    const margemPercentualTotal = totais.receita !== 0 
      ? (margemBrutaTotal / Math.abs(totais.receita)) * 100 
      : 0;

    console.log(`[${projeto}] Totais finais:`, {
      receita: totais.receita,
      custoTotal: totais.custoTotal,
      margemBruta: margemBrutaTotal,
      margemPercentual: margemPercentualTotal
    });

    return {
      projeto,
      dados,
      totais: {
        receita: totais.receita,
        custoTotal: totais.custoTotal,
        margemBruta: margemBrutaTotal,
        margemPercentual: margemPercentualTotal
      }
    };
  };

  // Carrega dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Busca todos os projetos únicos e transações em uma única consulta
        const transacoes = await db.transacoes.toArray();
        const uniqueProjects = Array.from(new Set(transacoes.map(t => t.projeto || t.descricao || 'Sem Projeto'))).sort();
        setProjects(uniqueProjects);

        // Busca todos os anos únicos
        const uniqueYears = Array.from(new Set(transacoes.map(t => {
          const [, ano] = (t.periodo || '').split('/');
          return parseInt(ano);
        }))).filter(year => !isNaN(year)).sort((a, b) => b - a);
        setYears(uniqueYears);

        // Se não houver ano selecionado, seleciona o mais recente
        if (!selectedYear && uniqueYears.length > 0) {
          setSelectedYear(uniqueYears[0]);
        }

        // Processa os dados de todos os projetos selecionados de uma vez
        const projetosParaProcessar = selectedProjects.length > 0 ? selectedProjects : uniqueProjects;
        const dadosProcessados = await Promise.all(
          projetosParaProcessar.map(async (projeto) => {
            const dadosProjeto = await processarDadosProjeto(projeto, selectedYear, transacoes);
            return dadosProjeto;
          })
        );

        setForecastData(dadosProcessados);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    loadInitialData();
  }, [selectedYear, selectedProjects]);

  const handleValueChange = async (projeto: string, mes: string, tipo: 'receita' | 'custoTotal', valor: number) => {
    try {
      // Converte mês para formato numérico
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const [mesAbrev, ano] = mes.split('/');
      const mesNumerico = (meses.indexOf(mesAbrev) + 1).toString();
      
      // Atualiza o estado local
      setForecastData(prevData => {
        return prevData.map(item => {
          if (item.projeto !== projeto) return item;

          const novosDados = { ...item.dados };
          novosDados[mes] = {
            ...novosDados[mes],
            [tipo]: valor,
            margemBruta: tipo === 'receita' 
              ? valor + (novosDados[mes]?.custoTotal || 0)
              : (novosDados[mes]?.receita || 0) + valor,
            margemPercentual: tipo === 'receita'
              ? ((valor + (novosDados[mes]?.custoTotal || 0)) / Math.abs(valor)) * 100
              : (((novosDados[mes]?.receita || 0) + valor) / Math.abs(novosDados[mes]?.receita || 1)) * 100
          };

          // Recalcula totais
          const totaisReceita = Object.values(novosDados).reduce((sum, d) => sum + (d.receita || 0), 0);
          const totaisCusto = Object.values(novosDados).reduce((sum, d) => sum + (d.custoTotal || 0), 0);
          const totaisMargemBruta = totaisReceita + totaisCusto;
          const totaisMargemPercentual = totaisReceita !== 0 
            ? (totaisMargemBruta / Math.abs(totaisReceita)) * 100 
            : 0;

          return {
            ...item,
            dados: novosDados,
            totais: {
              receita: totaisReceita,
              custoTotal: totaisCusto,
              margemBruta: totaisMargemBruta,
              margemPercentual: totaisMargemPercentual
            }
          };
        });
      });

      console.log('Salvando transação:', {
        projeto,
        mes: `${mesNumerico}/${ano}`,
        tipo: tipo === 'receita' ? 'receita' : 'despesa',
        valor,
        contaResumo: tipo === 'receita' ? 'RECEITA DEVENGADA' : 'CUSTO'
      });

      // Salva no banco de dados
      await db.transacoes.add({
        tipo: tipo === 'receita' ? 'receita' : 'despesa',
        projeto: projeto,
        descricao: projeto,
        periodo: `${mesNumerico}/${ano}`,
        natureza: tipo === 'receita' ? 'RECEITA' : 'CUSTO',
        valor: valor,
        data: new Date().toISOString(),
        categoria: tipo === 'receita' ? 'RECEITA DEVENGADA' : 'CUSTO',
        lancamento: Date.now()
      });

    } catch (error) {
      console.error('Erro ao atualizar valor:', error);
    }
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h1>Forecast</h1>
          <p className="text-muted">Previsão de receitas e custos</p>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={8}>
          <ProjectFilterReusable
            projects={projects}
            selectedProjects={selectedProjects}
            onChange={setSelectedProjects}
            isLoading={false}
            label="Filtrar Projetos"
          />
        </Col>
        <Col md={4}>
          <YearFilterReusable
            years={years}
            selectedYear={selectedYear}
            onChange={setSelectedYear}
            isLoading={false}
            label="Filtrar Ano"
          />
        </Col>
      </Row>

      <ForecastTable 
        data={forecastData} 
        onValueChange={handleValueChange}
      />
    </Container>
  );
};

export default Forecast;
