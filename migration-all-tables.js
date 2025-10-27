const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configurações dos projetos
const SOURCE_PROJECT = {
  url: 'https://pwksgdjjkryqryqrvyja.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3a3NnZGpqa3J5cXJ5cXJ2eWphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MjU1NzQsImV4cCI6MjA1MTUwMTU3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'
};

const TARGET_PROJECT = {
  url: 'https://vvlmbougufgrecyyjxzb.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bG1ib3VndWZncmVjeXlqeHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNjU5NzIsImV4cCI6MjA3NDk0MTk3Mn0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8'
};

// Diretório para backups
const BACKUP_DIR = './migration-backup-all-tables';

// Lista de tabelas para migrar (baseado nas migrações encontradas)
const TABLES_TO_MIGRATE = [
  'colaboradores', // já migrada
  'dre_hitss',
  'automation_executions',
  'system_logs',
  'hitss_projetos'
];

// Criar diretório de backup se não existir
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Conectar aos projetos
const sourceSupabase = createClient(SOURCE_PROJECT.url, SOURCE_PROJECT.key);
const targetSupabase = createClient(TARGET_PROJECT.url, TARGET_PROJECT.key);

async function backupTable(tableName) {
  try {
    console.log(`📦 Fazendo backup da tabela: ${tableName}`);
    
    const { data, error } = await sourceSupabase
      .from(tableName)
      .select('*');
    
    if (error) {
      console.log(`⚠️  Tabela ${tableName} não encontrada ou sem dados:`, error.message);
      return { success: true, count: 0, data: [] };
    }
    
    // Salvar backup
    const backupFile = path.join(BACKUP_DIR, `${tableName}_backup_${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
    
    console.log(`✅ Backup da tabela ${tableName} salvo: ${data.length} registros`);
    return { success: true, count: data.length, data };
    
  } catch (error) {
    console.error(`❌ Erro no backup da tabela ${tableName}:`, error);
    return { success: false, count: 0, data: [] };
  }
}

async function createTableStructures() {
  console.log('🏗️  Criando estruturas das tabelas no projeto de destino...');
  
  // Estrutura da tabela dre_hitss
  const dreHitssStructure = `
    CREATE TABLE IF NOT EXISTS public.dre_hitss (
      id BIGSERIAL PRIMARY KEY,
      execution_id TEXT NOT NULL,
      conta TEXT,
      descricao TEXT,
      valor DECIMAL(15,2),
      tipo TEXT,
      periodo TEXT,
      empresa TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_dre_hitss_execution_id ON public.dre_hitss(execution_id);
    CREATE INDEX IF NOT EXISTS idx_dre_hitss_empresa ON public.dre_hitss(empresa);
    CREATE INDEX IF NOT EXISTS idx_dre_hitss_periodo ON public.dre_hitss(periodo);
    
    ALTER TABLE public.dre_hitss ENABLE ROW LEVEL SECURITY;
    CREATE POLICY IF NOT EXISTS "Usuários autenticados podem acessar dre_hitss" ON public.dre_hitss
      FOR ALL USING (auth.role() = 'authenticated');
  `;
  
  // Estrutura da tabela automation_executions
  const automationExecutionsStructure = `
    CREATE TABLE IF NOT EXISTS public.automation_executions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      records_processed INTEGER DEFAULT 0,
      records_failed INTEGER DEFAULT 0,
      error_message TEXT,
      execution_details JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_automation_executions_status ON public.automation_executions(status);
    CREATE INDEX IF NOT EXISTS idx_automation_executions_started_at ON public.automation_executions(started_at DESC);
    
    ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;
    CREATE POLICY IF NOT EXISTS "Usuários autenticados podem acessar automation_executions" ON public.automation_executions
      FOR ALL USING (auth.role() = 'authenticated');
  `;
  
  // Estrutura da tabela hitss_projetos
  const hitssProjetosStructure = `
    CREATE TABLE IF NOT EXISTS public.hitss_projetos (
      id SERIAL PRIMARY KEY,
      projeto TEXT,
      cliente TEXT,
      responsavel TEXT,
      status TEXT,
      data_inicio DATE,
      data_fim DATE,
      valor DECIMAL(15,2),
      categoria TEXT,
      tipo TEXT,
      descricao TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_hitss_projetos_cliente ON public.hitss_projetos(cliente);
    CREATE INDEX IF NOT EXISTS idx_hitss_projetos_status ON public.hitss_projetos(status);
    
    ALTER TABLE public.hitss_projetos ENABLE ROW LEVEL SECURITY;
    CREATE POLICY IF NOT EXISTS "Usuários autenticados podem acessar hitss_projetos" ON public.hitss_projetos
      FOR ALL USING (auth.role() = 'authenticated');
  `;
  
  // Estrutura da tabela system_logs
  const systemLogsStructure = `
    CREATE TABLE IF NOT EXISTS public.system_logs (
      id BIGSERIAL PRIMARY KEY,
      level VARCHAR(10) NOT NULL,
      message TEXT NOT NULL,
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs(level);
    CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at DESC);
    
    ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
    CREATE POLICY IF NOT EXISTS "Usuários autenticados podem acessar system_logs" ON public.system_logs
      FOR ALL USING (auth.role() = 'authenticated');
  `;
  
  const structures = {
    dre_hitss: dreHitssStructure,
    automation_executions: automationExecutionsStructure,
    hitss_projetos: hitssProjetosStructure,
    system_logs: systemLogsStructure
  };
  
  for (const [tableName, sql] of Object.entries(structures)) {
    try {
      const { error } = await targetSupabase.rpc('exec_sql', { sql });
      if (error) {
        console.log(`⚠️  Erro ao criar estrutura da tabela ${tableName}:`, error);
      } else {
        console.log(`✅ Estrutura da tabela ${tableName} criada com sucesso`);
      }
    } catch (error) {
      console.log(`⚠️  Erro ao criar estrutura da tabela ${tableName}:`, error.message);
    }
  }
}

async function migrateTableData(tableName, data) {
  if (!data || data.length === 0) {
    console.log(`⏭️  Tabela ${tableName} não possui dados para migrar`);
    return { success: true, migrated: 0 };
  }
  
  try {
    console.log(`🔄 Migrando dados da tabela ${tableName}: ${data.length} registros`);
    
    // Migrar em lotes de 100
    const batchSize = 100;
    let totalMigrated = 0;
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      const { error } = await targetSupabase
        .from(tableName)
        .insert(batch);
      
      if (error) {
        console.error(`❌ Erro ao migrar lote da tabela ${tableName}:`, error);
        return { success: false, migrated: totalMigrated };
      }
      
      totalMigrated += batch.length;
      console.log(`📊 Migrados ${totalMigrated}/${data.length} registros da tabela ${tableName}`);
    }
    
    console.log(`✅ Migração da tabela ${tableName} concluída: ${totalMigrated} registros`);
    return { success: true, migrated: totalMigrated };
    
  } catch (error) {
    console.error(`❌ Erro na migração da tabela ${tableName}:`, error);
    return { success: false, migrated: 0 };
  }
}

async function verifyMigration() {
  console.log('🔍 Verificando integridade da migração...');
  
  for (const tableName of TABLES_TO_MIGRATE) {
    try {
      const { data, error } = await targetSupabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`⚠️  Erro ao verificar tabela ${tableName}:`, error.message);
      } else {
        console.log(`✅ Tabela ${tableName}: ${data?.length || 0} registros no destino`);
      }
    } catch (error) {
      console.log(`⚠️  Erro ao verificar tabela ${tableName}:`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 Iniciando migração completa de todas as tabelas...');
  console.log(`📂 Projeto origem: ${SOURCE_PROJECT.url}`);
  console.log(`📂 Projeto destino: ${TARGET_PROJECT.url}`);
  console.log(`📋 Tabelas para migrar: ${TABLES_TO_MIGRATE.join(', ')}`);
  
  // 1. Fazer backup de todas as tabelas
  const backups = {};
  for (const tableName of TABLES_TO_MIGRATE) {
    if (tableName === 'colaboradores') {
      console.log(`⏭️  Pulando backup da tabela ${tableName} (já migrada)`);
      continue;
    }
    backups[tableName] = await backupTable(tableName);
  }
  
  // 2. Criar estruturas das tabelas no destino
  await createTableStructures();
  
  // 3. Migrar dados das tabelas
  for (const tableName of TABLES_TO_MIGRATE) {
    if (tableName === 'colaboradores') {
      console.log(`⏭️  Pulando migração da tabela ${tableName} (já migrada)`);
      continue;
    }
    
    if (backups[tableName]?.success && backups[tableName].data.length > 0) {
      await migrateTableData(tableName, backups[tableName].data);
    }
  }
  
  // 4. Verificar migração
  await verifyMigration();
  
  console.log('🎉 Migração completa de todas as tabelas finalizada!');
  console.log(`📁 Backups salvos em: ${BACKUP_DIR}`);
}

// Executar migração
main().catch(console.error);