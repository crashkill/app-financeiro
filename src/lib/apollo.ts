// Este arquivo foi simplificado para remover dependências do GraphQL
// O projeto usa Supabase diretamente para operações de banco de dados

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL e Anon Key são obrigatórios');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Apollo Client foi removido - use Supabase diretamente
export const apolloClient = null;