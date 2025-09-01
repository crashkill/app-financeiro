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