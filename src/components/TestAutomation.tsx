import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';

interface DreRow {
  id?: string;
  ano: number;
  mes: string;
  conta: string;
  descricao: string;
  valor: number;
  project_reference: string;
  created_at?: string;
  updated_at?: string;
}

const TestAutomation: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [projectReference, setProjectReference] = useState('HITSS-2024');
  const [ano, setAno] = useState(2024);

  const downloadAndProcessHitssData = async () => {
    setLoading(true);
    setMessage('Iniciando automação...');

    try {
      // URL do HITSS (simulada - substitua pela URL real)
      const hitssUrl = 'https://example.com/hitss-data.xlsx';
      
      setMessage('Baixando arquivo do HITSS...');
      
      // Simular download (em produção, usar fetch para baixar o arquivo)
      // Por enquanto, vamos usar um arquivo local ou dados mockados
      const mockData: DreRow[] = [
        {
          ano: ano,
          mes: 'Janeiro',
          conta: '1.01.01',
          descricao: 'Receita de Vendas',
          valor: 100000,
          project_reference: projectReference
        },
        {
          ano: ano,
          mes: 'Janeiro',
          conta: '2.01.01',
          descricao: 'Custo dos Produtos Vendidos',
          valor: -60000,
          project_reference: projectReference
        },
        {
          ano: ano,
          mes: 'Fevereiro',
          conta: '1.01.01',
          descricao: 'Receita de Vendas',
          valor: 110000,
          project_reference: projectReference
        },
        {
          ano: ano,
          mes: 'Fevereiro',
          conta: '2.01.01',
          descricao: 'Custo dos Produtos Vendidos',
          valor: -65000,
          project_reference: projectReference
        }
      ];

      setMessage('Processando dados...');
      
      // Limpar dados existentes para o projeto e ano
      const { error: deleteError } = await supabase
        .from('dre_hitss')
        .delete()
        .eq('project_reference', projectReference)
        .eq('ano', ano);

      if (deleteError) {
        console.warn('Erro ao limpar dados existentes:', deleteError);
      }

      setMessage('Inserindo dados no banco...');
      
      // Inserir dados em lotes
      const batchSize = 100;
      let insertedCount = 0;
      
      for (let i = 0; i < mockData.length; i += batchSize) {
        const batch = mockData.slice(i, i + batchSize);
        
        const { data, error } = await supabase
          .from('dre_hitss')
          .insert(batch)
          .select();

        if (error) {
          console.error('Erro no lote:', error);
          // Tentar inserir individualmente
          for (const row of batch) {
            try {
              const { error: individualError } = await supabase
                .from('dre_hitss')
                .insert([row]);
              
              if (!individualError) {
                insertedCount++;
              } else {
                console.error('Erro individual:', individualError, row);
              }
            } catch (err) {
              console.error('Erro ao inserir linha individual:', err, row);
            }
          }
        } else {
          insertedCount += data?.length || 0;
        }
      }

      setMessage(`Automação concluída! ${insertedCount} registros inseridos.`);
      
    } catch (error) {
      console.error('Erro na automação:', error);
      setMessage(`Erro na automação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Teste de Automação HITSS</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Referência do Projeto
          </label>
          <input
            type="text"
            value={projectReference}
            onChange={(e) => setProjectReference(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: HITSS-2024"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ano
          </label>
          <input
            type="number"
            value={ano}
            onChange={(e) => setAno(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="2024"
          />
        </div>
        
        <button
          onClick={downloadAndProcessHitssData}
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          {loading ? 'Processando...' : 'Executar Automação'}
        </button>
        
        {message && (
          <div className={`p-3 rounded ${message.includes('Erro') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestAutomation;