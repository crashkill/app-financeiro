import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import ForecastTable from '../components/ForecastTable';
import FilterPanel from '../components/FilterPanel';
import { db } from '../db/database';
import type { Transacao } from '../db/database';
import { ForecastData } from '../types/forecast';

const Forecast: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [projects, setProjects] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);

  const processarDadosProjeto = async (projeto: string, ano: number) => {
    const dados: ForecastData['dados'] = {};
    let totaisReceita = 0;
    let totaisCusto = 0;

    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const mesesNumericos = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    
    // Busca todas as transações do projeto no ano
    const transacoesProjeto = await db.transacoes
      .where('descricao')
      .equals(projeto)
      .filter(t => {
        const [, anoTransacao] = t.periodo.split('/');
        return parseInt(anoTransacao) === ano;
      })
      .toArray();

    // Inicializa dados para todos os meses
    meses.forEach((mes, index) => {
      dados[`${mes}/${ano}`] = {
        receita: 0,
        custoTotal: 0,
        margemBruta: 0,
        margemPercentual: 0
      };
    });

    // Processa transações por mês
    transacoesProjeto.forEach((transacao) => {
      if (!transacao.periodo) return;
      
      const [mesNumerico] = transacao.periodo.split('/');
      const mesIndex = mesesNumericos.indexOf(mesNumerico);
      if (mesIndex === -1) return;

      const mesAno = `${meses[mesIndex]}/${ano}`;
      const valor = transacao.lancamento || 0;

      if (transacao.natureza === 'RECEITA') {
        dados[mesAno].receita += valor;
        totaisReceita += valor;
      } else if (transacao.natureza === 'CUSTO') {
        dados[mesAno].custoTotal += valor;
        totaisCusto += valor;
      }
    });

    // Calcula margens para cada mês
    Object.keys(dados).forEach(mesAno => {
      const dadosMes = dados[mesAno];
      dadosMes.margemBruta = dadosMes.receita + dadosMes.custoTotal;
      dadosMes.margemPercentual = dadosMes.receita > 0 
        ? (dadosMes.margemBruta / dadosMes.receita) * 100 
        : 0;
    });

    // Calcula totais
    const totaisMargemBruta = totaisReceita + totaisCusto;
    const totaisMargemPercentual = totaisReceita > 0 
      ? (totaisMargemBruta / totaisReceita) * 100 
      : 0;

    return {
      projeto,
      dados,
      totais: {
        receita: totaisReceita,
        custoTotal: totaisCusto,
        margemBruta: totaisMargemBruta,
        margemPercentual: totaisMargemPercentual
      }
    };
  };

  // Carrega dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        
        // Busca todos os projetos únicos
        const transacoes = await db.transacoes.toArray();
        const uniqueProjects = [...new Set(transacoes.map(t => t.descricao || 'Sem Projeto'))].sort();
        setProjects(uniqueProjects);

        // Extrair lista única de anos
        const uniqueYears = Array.from(new Set(transacoes.map(t => {
          const [, ano] = (t.periodo || '').split('/');
          return parseInt(ano);
        }))).filter(year => !isNaN(year)).sort((a, b) => b - a); // Ordenar decrescente

        setYears(uniqueYears);

        // Processa dados de cada projeto
        const dadosIniciais = await Promise.all(
          uniqueProjects.map(projeto => processarDadosProjeto(projeto, selectedYear))
        );

        setForecastData(dadosIniciais);
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Atualiza quando os filtros mudam
  useEffect(() => {
    const loadForecastData = async () => {
      try {
        setIsLoading(true);
        
        // Define projetos a serem processados
        const projetosParaProcessar = selectedProjects.length > 0 
          ? selectedProjects 
          : projects;
        
        // Processa dados dos projetos filtrados
        const dadosProjetos = await Promise.all(
          projetosParaProcessar.map(projeto => processarDadosProjeto(projeto, selectedYear))
        );

        setForecastData(dadosProjetos);
      } catch (error) {
        console.error('Erro ao carregar dados do forecast:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (projects.length > 0) {
      loadForecastData();
    }
  }, [selectedProjects, selectedYear, projects]);

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
              ? ((valor + (novosDados[mes]?.custoTotal || 0)) / valor) * 100
              : (((novosDados[mes]?.receita || 0) + valor) / (novosDados[mes]?.receita || 1)) * 100
          };

          // Recalcula totais
          const totaisReceita = Object.values(novosDados).reduce((sum, d) => sum + (d.receita || 0), 0);
          const totaisCusto = Object.values(novosDados).reduce((sum, d) => sum + (d.custoTotal || 0), 0);
          const totaisMargemBruta = totaisReceita + totaisCusto;
          const totaisMargemPercentual = totaisReceita !== 0 
            ? (totaisMargemBruta / totaisReceita) * 100 
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

      // Salva no banco de dados
      await db.transacoes.add({
        descricao: projeto,
        periodo: `${mesNumerico}/${ano}`,
        natureza: tipo === 'receita' ? 'RECEITA' : 'CUSTO',
        tipo: tipo === 'receita' ? 'receita' : 'despesa',
        valor: valor,
        data: new Date().toISOString(),
        categoria: tipo === 'receita' ? 'Receita' : 'Custo',
        lancamento: valor
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

      <FilterPanel
        projects={projects}
        selectedProjects={selectedProjects}
        years={years}
        selectedYear={selectedYear}
        onProjectChange={setSelectedProjects}
        onYearChange={setSelectedYear}
      />

      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="mt-2 text-muted">Carregando dados...</p>
        </div>
      ) : (
        <ForecastTable 
          data={forecastData} 
          onValueChange={handleValueChange}
        />
      )}
    </Container>
  );
};

export default Forecast;
