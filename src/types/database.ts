export interface Database {
  public: {
    Tables: {
      colaboradores: {
        Row: {
          id: string;
          nome: string;
          email: string;
          cargo: string;
          departamento: string;
          salario: number;
          data_admissao: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          email: string;
          cargo: string;
          departamento: string;
          salario: number;
          data_admissao: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          email?: string;
          cargo?: string;
          departamento?: string;
          salario?: number;
          data_admissao?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      transacoes_financeiras: {
        Row: {
          id: string;
          tipo: string;
          categoria: string;
          valor: number;
          descricao: string;
          data_transacao: string;
          colaborador_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tipo: string;
          categoria: string;
          valor: number;
          descricao: string;
          data_transacao: string;
          colaborador_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tipo?: string;
          categoria?: string;
          valor?: number;
          descricao?: string;
          data_transacao?: string;
          colaborador_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      hitss_automation_executions: {
        Row: {
          id: string;
          execution_id: string;
          success: boolean;
          file_downloaded: boolean;
          file_name: string | null;
          file_size: number | null;
          records_processed: number;
          records_imported: number;
          execution_time: number;
          errors: string | null;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          execution_id: string;
          success: boolean;
          file_downloaded: boolean;
          file_name?: string | null;
          file_size?: number | null;
          records_processed: number;
          records_imported: number;
          execution_time: number;
          errors?: string | null;
          timestamp: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          execution_id?: string;
          success?: boolean;
          file_downloaded?: boolean;
          file_name?: string | null;
          file_size?: number | null;
          records_processed?: number;
          records_imported?: number;
          execution_time?: number;
          errors?: string | null;
          timestamp?: string;
          created_at?: string;
        };
      };
      hitss_automation_logs: {
        Row: {
          id: string;
          execution_id: string;
          level: string;
          message: string;
          context: any | null;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          execution_id: string;
          level: string;
          message: string;
          context?: any | null;
          timestamp: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          execution_id?: string;
          level?: string;
          message?: string;
          context?: any | null;
          timestamp?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type TransacaoFinanceira = Database['public']['Tables']['transacoes_financeiras']['Row'];
export type Colaborador = Database['public']['Tables']['colaboradores']['Row'];
export type TransacaoFinanceiraInsert = Database['public']['Tables']['transacoes_financeiras']['Insert'];
export type ColaboradorInsert = Database['public']['Tables']['colaboradores']['Insert'];
export type TransacaoFinanceiraUpdate = Database['public']['Tables']['transacoes_financeiras']['Update'];
export type ColaboradorUpdate = Database['public']['Tables']['colaboradores']['Update'];

export type HitssAutomationExecution = Database['public']['Tables']['hitss_automation_executions']['Row'];
export type HitssAutomationLog = Database['public']['Tables']['hitss_automation_logs']['Row'];
export type HitssAutomationExecutionInsert = Database['public']['Tables']['hitss_automation_executions']['Insert'];
export type HitssAutomationLogInsert = Database['public']['Tables']['hitss_automation_logs']['Insert'];