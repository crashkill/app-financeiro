import { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { db } from '../db/database';
import type { Transacao } from '../db/database';
import ForecastFilters, { Filters } from '../components/ForecastFilters';
import ForecastTable from '../components/ForecastTable';
import '../styles/Forecast.css';

const Forecast = () => {
  const [data, setData] = useState<Transacao[]>([]);
  const [filteredData, setFilteredData] = useState<Transacao[]>([]);
  const [filters, setFilters] = useState<Filters>({
    year: new Date().getFullYear()
  });

  // Carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const transacoes = await db.transacoes.toArray();
        
        // Garantir que todos os registros tenham os campos necessários
        const processedData = transacoes.map(t => ({
          ...t,
          projeto: t.projeto || t.descricao || 'Sem Projeto',
          natureza: t.natureza || (t.tipo === 'receita' ? 'RECEITA' : 'CUSTO')
        }));

        setData(processedData);
        applyFilters(processedData, filters);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    loadInitialData();
  }, []);

  const applyFilters = (transactions: Transacao[], currentFilters: Filters) => {
    let filtered = [...transactions];

    // Filtrar por grupo (MERCADO/GRUPO)
    if (currentFilters.group) {
      filtered = filtered.filter(item => {
        const projectName = item.projeto || item.descricao || '';
        const isMarket = projectName.includes('MKT') || projectName.includes('MERCADO');
        return currentFilters.group === 'MERCADO' ? isMarket : !isMarket;
      });
    }

    // Filtrar por natureza (RECEITA/CUSTO)
    if (currentFilters.natureza) {
      filtered = filtered.filter(item => {
        const natureza = item.natureza || (item.tipo === 'receita' ? 'RECEITA' : 'CUSTO');
        return natureza === currentFilters.natureza;
      });
    }

    // Filtrar por projetos específicos
    if (currentFilters.projects && currentFilters.projects.length > 0) {
      filtered = filtered.filter(item => {
        const projectName = item.projeto || item.descricao || '';
        return currentFilters.projects?.includes(projectName);
      });
    }

    // Filtrar por ano
    if (currentFilters.year) {
      filtered = filtered.filter(item => {
        const [, ano] = (item.periodo || '').split('/');
        return parseInt(ano) === currentFilters.year;
      });
    }

    setFilteredData(filtered);
  };

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    applyFilters(data, newFilters);
  };

  const handleCellChange = async (rowIndex: number, field: string, value: string) => {
    const newData = [...filteredData];
    const numericValue = field === 'valor' ? parseFloat(value) || 0 : value;
    newData[rowIndex] = { ...newData[rowIndex], [field]: numericValue };
    setFilteredData(newData);
    
    // Atualizar também o conjunto de dados original
    const originalIndex = data.findIndex(item => 
      (item.projeto === filteredData[rowIndex].projeto || 
       item.descricao === filteredData[rowIndex].descricao) && 
      item.periodo === filteredData[rowIndex].periodo
    );

    if (originalIndex !== -1) {
      const newOriginalData = [...data];
      const updatedItem = { 
        ...newOriginalData[originalIndex], 
        [field]: numericValue 
      };
      newOriginalData[originalIndex] = updatedItem;
      setData(newOriginalData);

      // Atualizar no banco de dados
      try {
        if (updatedItem.id) {
          await db.transacoes.update(updatedItem.id, { [field]: numericValue });
        } else {
          console.error('Erro: Item sem ID não pode ser atualizado');
        }
      } catch (error) {
        console.error('Erro ao atualizar transação:', error);
      }
    }
  };

  // Agrupar dados por tipo
  const receitaData = filteredData.filter(item => 
    item.natureza === 'RECEITA' || item.tipo === 'receita'
  );
  const custoData = filteredData.filter(item => 
    item.natureza === 'CUSTO' || item.tipo === 'despesa'
  );

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="mb-4">
            <h1 className="mb-2">Forecast</h1>
            <p className="text-muted">Previsão de receitas e custos</p>
          </div>

          <ForecastFilters 
            onFilterChange={handleFilterChange} 
            initialFilters={filters}
          />
        </Col>
      </Row>

      {receitaData.length > 0 && (
        <ForecastTable
          data={receitaData}
          tipo="Receitas"
          onCellChange={handleCellChange}
        />
      )}

      {custoData.length > 0 && (
        <ForecastTable
          data={custoData}
          tipo="Custos"
          onCellChange={handleCellChange}
        />
      )}

      {filteredData.length === 0 && (
        <Row>
          <Col>
            <div className="text-center text-muted py-5">
              <h4>Nenhum dado encontrado</h4>
              <p>Tente ajustar os filtros para ver mais resultados</p>
            </div>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default Forecast;
