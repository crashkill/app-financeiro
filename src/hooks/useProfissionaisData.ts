import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Colaborador {
  id: string;
  email: string;
  nome_completo: string;
  regime: string;
  local_alocacao: string;
  proficiencia_cargo: string;
  java: string;
  javascript: string;
  python: string;
  typescript: string;
  php: string;
  dotnet: string;
  react: string;
  angular: string;
  ionic: string;
  flutter: string;
  mysql: string;
  postgres: string;
  oracle_db: string;
  sql_server: string;
  mongodb: string;
  aws: string;
  azure: string;
  gcp: string;
  outras_tecnologias: string;
  disponivel_compartilhamento: boolean;
  percentual_compartilhamento: string;
  created_at: string;
  hora_ultima_modificacao: string;
}

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

  // Função para mapear colaborador para profissional
  const mapearColaboradorParaProfissional = (colaborador: Colaborador): Profissional => {
    // Criar um ID numérico baseado no hash do UUID
    const id = Math.abs(colaborador.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0));

    // Mapear cargo baseado na proficiência
    const cargo = colaborador.proficiencia_cargo || 'Desenvolvedor';
    
    // Mapear projeto baseado na alocação
    const projeto = colaborador.local_alocacao || 'Não definido';
    
    // Calcular custo baseado no regime (simulado)
    const custo = colaborador.regime === 'CLT' ? 8000 : 
                  colaborador.regime === 'PJ' ? 12000 : 6000;
    
    // Determinar tipo baseado nas tecnologias
    const tecnologias = [
      colaborador.java, colaborador.javascript, colaborador.python,
      colaborador.typescript, colaborador.php, colaborador.dotnet,
      colaborador.react, colaborador.angular
    ].filter(tech => tech && tech !== 'Não possui');
    
    const tipo = tecnologias.length > 3 ? 'Sênior' : 
                 tecnologias.length > 1 ? 'Pleno' : 'Júnior';

    return {
      id,
      nome: colaborador.nome_completo || '',
      cargo,
      projeto,
      custo,
      tipo
    };
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Buscar colaboradores do Supabase
      const { data: colaboradoresData, error: colaboradoresError } = await supabase
        .from('colaboradores')
        .select('*');

      if (colaboradoresError) {
        throw new Error(`Erro ao buscar colaboradores: ${colaboradoresError.message}`);
      }

      // Buscar transações do Supabase (mantém a mesma tabela)
      const { data: transacoesData, error: transacoesError } = await supabase
        .from('transacoes')
        .select('*');

      if (transacoesError) {
        console.warn('Erro ao buscar transações:', transacoesError.message);
      }

      // Mapear colaboradores para profissionais
      const profissionaisMapeados: Profissional[] = (colaboradoresData || []).map(mapearColaboradorParaProfissional);

      setData({
        profissionais: profissionaisMapeados,
        transacoes: transacoesData || []
      });
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
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
