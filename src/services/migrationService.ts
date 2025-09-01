import { db, Transacao, Profissional } from '../db/database';
import { supabase } from '../lib/supabase';
import { TransacaoFinanceira, Colaborador } from '../types/database';

export interface MigrationProgress {
  step: string;
  current: number;
  total: number;
  percentage: number;
  message: string;
}

export interface MigrationResult {
  success: boolean;
  transacoesMigradas: number;
  profissionaisMigrados: number;
  errors: string[];
  warnings: string[];
}

class MigrationService {
  private onProgress?: (progress: MigrationProgress) => void;

  constructor(onProgress?: (progress: MigrationProgress) => void) {
    this.onProgress = onProgress;
  }

  private updateProgress(step: string, current: number, total: number, message: string) {
    if (this.onProgress) {
      this.onProgress({
        step,
        current,
        total,
        percentage: total > 0 ? Math.round((current / total) * 100) : 0,
        message
      });
    }
  }

  async migrateData(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      transacoesMigradas: 0,
      profissionaisMigrados: 0,
      errors: [],
      warnings: []
    };

    try {
      // Verificar se o usuário está autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        result.errors.push('Usuário não autenticado. Faça login antes de migrar os dados.');
        return result;
      }

      this.updateProgress('init', 0, 100, 'Iniciando migração de dados...');

      // Verificar se há dados no IndexedDB
      const transacoesIndexedDB = await db.transacoes.toArray();
      const profissionaisIndexedDB = await db.profissionais.toArray();

      const totalItems = transacoesIndexedDB.length + profissionaisIndexedDB.length;
      
      if (totalItems === 0) {
        result.warnings.push('Nenhum dado encontrado no IndexedDB para migrar.');
        result.success = true;
        return result;
      }

      this.updateProgress('checking', 10, 100, `Encontrados ${totalItems} registros para migrar...`);

      // Verificar se já existem dados no Supabase
      const { data: existingTransacoes } = await supabase
        .from('transacoes_financeiras')
        .select('id')
        .limit(1);

      const { data: existingColaboradores } = await supabase
        .from('colaboradores')
        .select('id')
        .limit(1);

      if (existingTransacoes && existingTransacoes.length > 0) {
        result.warnings.push('Já existem transações no Supabase. A migração irá adicionar novos dados.');
      }

      if (existingColaboradores && existingColaboradores.length > 0) {
        result.warnings.push('Já existem colaboradores no Supabase. A migração irá adicionar novos dados.');
      }

      // Migrar profissionais primeiro (para ter os IDs de colaboradores)
      if (profissionaisIndexedDB.length > 0) {
        this.updateProgress('professionals', 20, 100, 'Migrando profissionais...');
        const profissionaisMigrados = await this.migrateProfissionais(profissionaisIndexedDB, user.id);
        result.profissionaisMigrados = profissionaisMigrados;
      }

      // Migrar transações
      if (transacoesIndexedDB.length > 0) {
        this.updateProgress('transactions', 60, 100, 'Migrando transações financeiras...');
        const transacoesMigradas = await this.migrateTransacoes(transacoesIndexedDB, user.id);
        result.transacoesMigradas = transacoesMigradas;
      }

      this.updateProgress('complete', 100, 100, 'Migração concluída com sucesso!');
      result.success = true;

    } catch (error) {
      console.error('Erro durante a migração:', error);
      result.errors.push(`Erro durante a migração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    return result;
  }

  private async migrateProfissionais(profissionais: Profissional[], userId: string): Promise<number> {
    let migrados = 0;

    for (let i = 0; i < profissionais.length; i++) {
      const prof = profissionais[i];
      
      try {
        // Mapear dados do IndexedDB para o formato do Supabase
        const colaborador: Omit<Colaborador, 'id' | 'created_at' | 'updated_at'> = {
          nome: prof.nome,
          email: `${prof.nome.toLowerCase().replace(/\s+/g, '.')}@empresa.com`, // Email fictício
          cargo: prof.cargo || 'Não informado',
          departamento: prof.projeto || 'Geral',
          data_admissao: new Date().toISOString().split('T')[0], // Data atual como padrão
          salario: prof.custo,
          status: prof.tipo === 'CLT' ? 'ativo' : 'ativo'
        };

        const { error } = await supabase
          .from('colaboradores')
          .insert([colaborador]);

        if (error) {
          console.error(`Erro ao migrar profissional ${prof.nome}:`, error);
        } else {
          migrados++;
        }

        // Atualizar progresso
        const progress = 20 + Math.round((i / profissionais.length) * 40);
        this.updateProgress('professionals', progress, 100, `Migrando profissional ${i + 1}/${profissionais.length}: ${prof.nome}`);

      } catch (error) {
        console.error(`Erro ao processar profissional ${prof.nome}:`, error);
      }
    }

    return migrados;
  }

  private async migrateTransacoes(transacoes: Transacao[], userId: string): Promise<number> {
    let migradas = 0;

    // Buscar colaboradores para mapear por nome/projeto
    const { data: colaboradores } = await supabase
      .from('colaboradores')
      .select('id, nome, departamento');

    const colaboradoresMap = new Map<string, string>();
    colaboradores?.forEach(col => {
      colaboradoresMap.set(col.nome.toLowerCase(), col.id);
      colaboradoresMap.set(col.departamento.toLowerCase(), col.id);
    });

    for (let i = 0; i < transacoes.length; i++) {
      const trans = transacoes[i];
      
      try {
        // Mapear dados do IndexedDB para o formato do Supabase
        const transacao: Omit<TransacaoFinanceira, 'id' | 'created_at' | 'updated_at'> = {
          tipo: trans.tipo,
          categoria: trans.categoria,
          descricao: trans.descricao,
          valor: trans.valor,
          data_transacao: this.formatDate(trans.data),
          colaborador_id: this.findColaboradorId(trans, colaboradoresMap) || ''
        };

        const { error } = await supabase
          .from('transacoes_financeiras')
          .insert([transacao]);

        if (error) {
          console.error(`Erro ao migrar transação ${trans.id}:`, error);
        } else {
          migradas++;
        }

        // Atualizar progresso
        const progress = 60 + Math.round((i / transacoes.length) * 35);
        this.updateProgress('transactions', progress, 100, `Migrando transação ${i + 1}/${transacoes.length}`);

      } catch (error) {
        console.error(`Erro ao processar transação ${trans.id}:`, error);
      }
    }

    return migradas;
  }

  private formatDate(dateString: string): string {
    // Tentar diferentes formatos de data
    if (!dateString) return new Date().toISOString().split('T')[0];

    // Se já está no formato ISO
    if (dateString.includes('-') && dateString.length >= 10) {
      return dateString.split('T')[0];
    }

    // Se está no formato brasileiro (dd/mm/yyyy)
    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }

    // Fallback para data atual
    return new Date().toISOString().split('T')[0];
  }

  private findColaboradorId(transacao: Transacao, colaboradoresMap: Map<string, string>): string | undefined {
    // Tentar encontrar colaborador por projeto
    if (transacao.projeto) {
      const id = colaboradoresMap.get(transacao.projeto.toLowerCase());
      if (id) return id;
    }

    // Tentar encontrar por descrição
    if (transacao.descricao) {
      const id = colaboradoresMap.get(transacao.descricao.toLowerCase());
      if (id) return id;
    }

    return undefined;
  }

  async clearIndexedDBAfterMigration(): Promise<void> {
    try {
      await db.transacoes.clear();
      await db.profissionais.clear();
      console.log('Dados do IndexedDB limpos após migração bem-sucedida');
    } catch (error) {
      console.error('Erro ao limpar IndexedDB:', error);
      throw error;
    }
  }

  async checkMigrationStatus(): Promise<{
    hasIndexedDBData: boolean;
    hasSupabaseData: boolean;
    indexedDBCount: { transacoes: number; profissionais: number };
    supabaseCount: { transacoes: number; colaboradores: number };
  }> {
    try {
      // Verificar dados no IndexedDB
      const transacoesIndexedDB = await db.transacoes.count();
      const profissionaisIndexedDB = await db.profissionais.count();

      // Verificar dados no Supabase
      const { count: transacoesSupabase } = await supabase
        .from('transacoes_financeiras')
        .select('*', { count: 'exact', head: true });

      const { count: colaboradoresSupabase } = await supabase
        .from('colaboradores')
        .select('*', { count: 'exact', head: true });

      return {
        hasIndexedDBData: transacoesIndexedDB > 0 || profissionaisIndexedDB > 0,
        hasSupabaseData: (transacoesSupabase || 0) > 0 || (colaboradoresSupabase || 0) > 0,
        indexedDBCount: {
          transacoes: transacoesIndexedDB,
          profissionais: profissionaisIndexedDB
        },
        supabaseCount: {
          transacoes: transacoesSupabase || 0,
          colaboradores: colaboradoresSupabase || 0
        }
      };
    } catch (error) {
      console.error('Erro ao verificar status da migração:', error);
      throw error;
    }
  }
}

export { MigrationService };
export default MigrationService;