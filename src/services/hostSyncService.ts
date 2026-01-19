/**
 * Serviço de Sincronização com HOST GlobalHitss
 * ==============================================
 * Gerencia a comunicação com a Edge Function host-sync para
 * sincronização automática de profissionais.
 */

import { supabase } from '../lib/supabase';

export interface SyncRequest {
    reportType: 'recursos_projeto' | 'colaboradores' | 'altas' | 'baixas';
    ano?: number;
    mes?: number;
}

export interface SyncResult {
    success: boolean;
    recordsProcessed: number;
    recordsInserted: number;
    recordsUpdated: number;
    recordsSkipped: number;
    errors: string[];
    executionTimeMs: number;
}

export interface SyncLog {
    id: string;
    sync_type: string;
    report_name: string;
    ano: number;
    mes: number;
    status: 'INICIADO' | 'PROCESSANDO' | 'SUCESSO' | 'ERRO' | 'PARCIAL';
    records_processed: number;
    records_inserted: number;
    records_updated: number;
    records_skipped: number;
    error_message?: string;
    execution_time_ms?: number;
    created_at: string;
    completed_at?: string;
}

export interface ProfissionalResumo {
    total: number;
    ativos: number;
    disponiveis: number;
    inativos: number;
    ferias: number;
    afastados: number;
    projetos_ativos: number;
    companhias: number;
    total_horas_mes: number;
}

class HostSyncService {
    /**
     * Dispara sincronização com HOST GlobalHitss
     */
    async triggerSync(request: SyncRequest): Promise<SyncResult> {
        const { data, error } = await supabase.functions.invoke('host-sync', {
            body: request,
        });

        if (error) {
            throw new Error(`Erro ao sincronizar: ${error.message}`);
        }

        return data as SyncResult;
    }

    /**
     * Sincroniza todos os relatórios disponíveis
     */
    async syncAll(ano?: number, mes?: number): Promise<SyncResult[]> {
        const reportTypes: SyncRequest['reportType'][] = [
            'recursos_projeto',
            'colaboradores',
            'altas',
            'baixas',
        ];

        const results: SyncResult[] = [];

        for (const reportType of reportTypes) {
            try {
                const result = await this.triggerSync({ reportType, ano, mes });
                results.push(result);
            } catch (error) {
                results.push({
                    success: false,
                    recordsProcessed: 0,
                    recordsInserted: 0,
                    recordsUpdated: 0,
                    recordsSkipped: 0,
                    errors: [(error as Error).message],
                    executionTimeMs: 0,
                });
            }
        }

        return results;
    }

    /**
     * Obtém logs de sincronização recentes
     */
    async getSyncLogs(limit = 10): Promise<SyncLog[]> {
        const { data, error } = await supabase
            .from('host_sync_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            throw new Error(`Erro ao buscar logs: ${error.message}`);
        }

        return data as SyncLog[];
    }

    /**
     * Obtém último log de sincronização por tipo
     */
    async getLastSyncByType(syncType: string): Promise<SyncLog | null> {
        const { data, error } = await supabase
            .from('host_sync_logs')
            .select('*')
            .eq('sync_type', syncType)
            .eq('status', 'SUCESSO')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw new Error(`Erro ao buscar último sync: ${error.message}`);
        }

        return data as SyncLog | null;
    }

    /**
     * Obtém resumo estatístico dos profissionais
     */
    async getResumo(): Promise<ProfissionalResumo> {
        const { data, error } = await supabase
            .from('v_profissionais_resumo')
            .select('*')
            .single();

        if (error) {
            // Retorna zeros se a view não existir ainda
            return {
                total: 0,
                ativos: 0,
                disponiveis: 0,
                inativos: 0,
                ferias: 0,
                afastados: 0,
                projetos_ativos: 0,
                companhias: 0,
                total_horas_mes: 0,
            };
        }

        return data as ProfissionalResumo;
    }

    /**
     * Obtém profissionais por projeto
     */
    async getProfissionaisPorProjeto(): Promise<{ projeto: string; total_profissionais: number; total_horas: number }[]> {
        const { data, error } = await supabase
            .from('v_profissionais_por_projeto')
            .select('*')
            .limit(20);

        if (error) {
            return [];
        }

        return data;
    }

    /**
     * Busca profissionais com filtros
     */
    async searchProfissionais(filters: {
        nome?: string;
        status?: string;
        projeto?: string;
        gerente?: string;
        companhia?: string;
        limit?: number;
        offset?: number;
    }) {
        let query = supabase
            .from('profissionais')
            .select('*', { count: 'exact' });

        if (filters.nome) {
            query = query.ilike('nome', `%${filters.nome}%`);
        }
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        if (filters.projeto) {
            query = query.ilike('projeto_atual', `%${filters.projeto}%`);
        }
        if (filters.gerente) {
            query = query.ilike('gerente', `%${filters.gerente}%`);
        }
        if (filters.companhia) {
            query = query.eq('companhia', filters.companhia);
        }

        query = query
            .order('nome', { ascending: true })
            .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50) - 1);

        const { data, error, count } = await query;

        if (error) {
            throw new Error(`Erro ao buscar profissionais: ${error.message}`);
        }

        return { data, count };
    }
}

export const hostSyncService = new HostSyncService();
export default hostSyncService;
