import { useState, useEffect } from 'react';
import { db } from '../db/database';

interface Profissional {
  id: number;
  nome: string;
  cargo: string;
  projeto: string;
  custo: number;
  tipo: string;
}

interface ProfissionaisData {
  profissionais: Profissional[];
  transacoes: any[];
}

interface UseProfissionaisDataResult {
  data: ProfissionaisData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useProfissionaisData(): UseProfissionaisDataResult {
  const [data, setData] = useState<ProfissionaisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Buscar profissionais do banco
      const profissionais = await db.profissionais.toArray();
      const transacoes = await db.transacoes.toArray();

      setData({
        profissionais: profissionais.map(p => ({
          id: p.id || 0,
          nome: p.nome || '',
          cargo: '', // Campo não existe na interface original
          projeto: p.projeto || '',
          custo: p.custo || 0,
          tipo: p.tipo || 'CLT'
        })),
        transacoes
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao buscar dados dos profissionais'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData
  };
}
