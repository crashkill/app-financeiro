import { useState, useEffect } from 'react';
import { db, Transacao } from '../db/database';
import { Table } from 'dexie';

interface UseTransacoesParams {
  tipo?: 'receita' | 'despesa';
  projeto?: string;
  periodo?: string;
}

interface UseTransacoesResult {
  transacoes: Transacao[];
  loading: boolean;
  error: Error | null;
  total: number;
  isLoading: boolean;
  adicionarTransacao: (transacao: Omit<Transacao, 'id'>) => Promise<void>;
  editarTransacao: (id: number, transacao: Partial<Transacao>) => Promise<void>;
  excluirTransacao: (id: number) => Promise<void>;
}

export const useTransacoes = (params: UseTransacoesParams = {}): UseTransacoesResult => {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { tipo, projeto, periodo } = params;

  useEffect(() => {
    const fetchTransacoes = async () => {
      try {
        setLoading(true);
        let query = db.transacoes as Table<Transacao, number>;

        const result = await query.toArray();
        
        // Aplicar filtros após buscar os dados
        let filteredResult = result;
        
        if (tipo) {
          filteredResult = filteredResult.filter(t => t.tipo === tipo);
        }
        
        if (projeto && periodo) {
          filteredResult = filteredResult.filter(t => t.projeto === projeto && t.periodo === periodo);
        } else {
          if (projeto) {
            filteredResult = filteredResult.filter(t => t.projeto === projeto);
          }
          if (periodo) {
            filteredResult = filteredResult.filter(t => t.periodo === periodo);
          }
        }

        setTransacoes(filteredResult);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar transações:', err);
        setError(err instanceof Error ? err : new Error('Erro desconhecido'));
        setTransacoes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransacoes();
  }, [tipo, projeto, periodo]);

  const total = transacoes.reduce((acc, t) => acc + t.valor, 0);

  const adicionarTransacao = async (transacao: Omit<Transacao, 'id'>) => {
    try {
      await db.transacoes.add(transacao);
      const novasTransacoes = await db.transacoes.toArray();
      setTransacoes(novasTransacoes);
    } catch (err) {
      console.error('Erro ao adicionar transação:', err);
      throw err;
    }
  };

  const editarTransacao = async (id: number, transacao: Partial<Transacao>) => {
    try {
      await db.transacoes.update(id, transacao);
      const novasTransacoes = await db.transacoes.toArray();
      setTransacoes(novasTransacoes);
    } catch (err) {
      console.error('Erro ao editar transação:', err);
      throw err;
    }
  };

  const excluirTransacao = async (id: number) => {
    try {
      await db.transacoes.delete(id);
      const novasTransacoes = await db.transacoes.toArray();
      setTransacoes(novasTransacoes);
    } catch (err) {
      console.error('Erro ao excluir transação:', err);
      throw err;
    }
  };

  return {
    transacoes,
    loading,
    error,
    total,
    isLoading: loading,
    adicionarTransacao,
    editarTransacao,
    excluirTransacao
  };
};
