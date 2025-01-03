import { useState, useEffect, useCallback, useMemo } from 'react'
import { db, Transacao } from '../db/database'
import { useLiveQuery } from 'dexie-react-hooks'

interface TransacoesPorProjeto {
  [projeto: string]: {
    [periodo: string]: Transacao[]
  }
}

interface TransacoesCache {
  [key: string]: {
    data: Transacao[];
    timestamp: number;
    total: number;
  }
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const transacoesCache: TransacoesCache = {};

export const useTransacoes = (
  tipo?: 'receita' | 'despesa',
  projeto?: string,
  periodo?: string,
  useCache: boolean = true
) => {
  const [isLoading, setIsLoading] = useState(true);

  // Função para buscar transações com cache
  const fetchTransacoes = useCallback(async () => {
    const cacheKey = `${tipo || 'all'}-${projeto || 'all'}-${periodo || 'all'}`;
    
    // Verifica cache
    if (useCache && transacoesCache[cacheKey]) {
      const cache = transacoesCache[cacheKey];
      if (Date.now() - cache.timestamp < CACHE_DURATION) {
        return { data: cache.data, total: cache.total };
      }
    }

    // Constrói a query
    let query = db.transacoes;
    
    if (tipo) {
      query = query.where('tipo').equals(tipo);
    }

    if (projeto && periodo) {
      // Usa índice composto
      query = query.where('[projeto+periodo]').equals([projeto, periodo]);
    } else {
      if (projeto) {
        query = query.where('projeto').equals(projeto);
      }
      if (periodo) {
        query = query.where('periodo').equals(periodo);
      }
    }

    // Executa a query
    const data = await query.toArray();
    const total = data.reduce((sum, item) => sum + item.valor, 0);

    // Atualiza cache
    if (useCache) {
      transacoesCache[cacheKey] = {
        data,
        total,
        timestamp: Date.now()
      };
    }

    return { data, total };
  }, [tipo, projeto, periodo, useCache]);

  // Usa live query apenas se não estiver usando cache
  const liveQuery = useLiveQuery(
    () => {
      if (!useCache) {
        return fetchTransacoes();
      }
      return null;
    },
    [useCache, fetchTransacoes]
  );

  // Estado local para dados em cache
  const [cachedData, setCachedData] = useState<{ data: Transacao[], total: number }>({ data: [], total: 0 });

  // Carrega dados iniciais
  useEffect(() => {
    if (useCache) {
      setIsLoading(true);
      fetchTransacoes().then(result => {
        setCachedData(result);
        setIsLoading(false);
      });
    }
  }, [fetchTransacoes, useCache]);

  // Funções otimizadas para manipulação de dados
  const adicionarTransacao = useCallback(async (transacao: Omit<Transacao, 'id'>) => {
    const id = await db.transacoes.add(transacao);
    // Invalida cache relacionado
    Object.keys(transacoesCache).forEach(key => {
      if (key.includes(transacao.tipo) || key.includes(transacao.projeto || '') || key.includes(transacao.periodo || '')) {
        delete transacoesCache[key];
      }
    });
    return id;
  }, []);

  const editarTransacao = useCallback(async (id: number, transacao: Partial<Transacao>) => {
    await db.transacoes.update(id, transacao);
    // Invalida todo o cache pois a edição pode afetar múltiplos aspectos
    Object.keys(transacoesCache).forEach(key => delete transacoesCache[key]);
  }, []);

  const excluirTransacao = useCallback(async (id: number) => {
    await db.transacoes.delete(id);
    // Invalida todo o cache
    Object.keys(transacoesCache).forEach(key => delete transacoesCache[key]);
  }, []);

  // Dados finais
  const result = useCache ? cachedData : (liveQuery || { data: [], total: 0 });

  return {
    transacoes: result.data,
    total: result.total,
    adicionarTransacao,
    editarTransacao,
    excluirTransacao,
    isLoading: useCache ? isLoading : !liveQuery,
    recarregar: useCache ? fetchTransacoes : undefined
  }
}
