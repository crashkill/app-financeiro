const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configurações dos projetos
const SOURCE_PROJECT = {
  url: process.env.VITE_SUPABASE_URL || 'https://your-source-project.supabase.co',
  anonKey: process.env.VITE_SUPABASE_ANON_KEY || 'your-source-anon-key',
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-source-service-key'
};

const HITSS_PROJECT = {
  url: 'https://pwksgdjjkryqryqrvyja.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3a3NnZGpqa3J5cXJ5cXJ2eWphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjAwNDgsImV4cCI6MjA2NDEzNjA0OH0.CbqU-Gx-QglerhxQzDjK6KFAi4CRLUl90LeKvDEKtbc',
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3a3NnZGpqa3J5cXJ5cXJ2eWphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODU2MDA0OCwiZXhwIjoyMDY0MTM2MDQ4fQ.FaNXM6jMHLAa-e6A8PQlZY9wxv9XrweZa4vMCYNhdk4'
};

// Mapeamento de tabelas (origem -> destino)
const TABLE_MAPPING = {
  'profissionais': 'colaboradores',
  'transacoes_financeiras': 'transacoes_financeiras',
  'dados_dre': 'dados_dre',
  'previsoes_financeiras': 'previsoes_financeiras',
  'logs_auditoria': 'logs_auditoria',
  'uploads_arquivos': 'uploads_arquivos',
  'configuracoes_sistema': 'configuracoes_sistema'
};

// Mapeamento de campos para tabela profissionais -> colaboradores
const FIELD_MAPPING = {
  'profissionais': {
    'id': 'id',
    'nome': 'nome',
    'email': 'email',
    'telefone': 'telefone',
    'especialidade': 'cargo', // especialidade vira cargo
    'status': 'status',
    'data_cadastro': 'data_cadastro',
    'data_atualizacao': 'data_atualizacao'
  }
};

class MigrationManager {
  constructor() {
    this.sourceClient = createClient(SOURCE_PROJECT.url, SOURCE_PROJECT.serviceKey);
    this.hitssClient = createClient(HITSS_PROJECT.url, HITSS_PROJECT.serviceKey);
    this.migrationLog = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      message
    };
    this.migrationLog.push(logEntry);
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  async testConnections() {
    this.log('Testando conexões...');
    
    try {
      // Testar conexão com projeto origem
      const { data: sourceData, error: sourceError } = await this.sourceClient
        .from('profissionais')
        .select('count', { count: 'exact', head: true });
      
      if (sourceError) throw new Error(`Erro na conexão origem: ${sourceError.message}`);
      this.log(`Conexão origem OK - ${sourceData} registros em profissionais`);

      // Testar conexão com projeto HITSS
      const { data: hitssData, error: hitssError } = await this.hitssClient
        .from('colaboradores')
        .select('count', { count: 'exact', head: true });
      
      if (hitssError) throw new Error(`Erro na conexão HITSS: ${hitssError.message}`);
      this.log(`Conexão HITSS OK - ${hitssData} registros em colaboradores`);

      return true;
    } catch (error) {
      this.log(`Erro ao testar conexões: ${error.message}`, 'error');
      return false;
    }
  }

  async backupTable(tableName) {
    this.log(`Fazendo backup da tabela: ${tableName}`);
    
    try {
      const { data, error } = await this.sourceClient
        .from(tableName)
        .select('*');
      
      if (error) throw error;
      
      // Salvar backup em arquivo
      const backupPath = `backup_${tableName}_${Date.now()}.json`;
      fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
      
      this.log(`Backup salvo: ${backupPath} (${data.length} registros)`);
      return data;
    } catch (error) {
      this.log(`Erro no backup de ${tableName}: ${error.message}`, 'error');
      this.errors.push({ table: tableName, operation: 'backup', error: error.message });
      return null;
    }
  }

  transformData(data, sourceTable) {
    if (sourceTable === 'profissionais') {
      // Transformar dados de profissionais para colaboradores
      return data.map(item => {
        const transformed = {};
        const mapping = FIELD_MAPPING.profissionais;
        
        for (const [sourceField, targetField] of Object.entries(mapping)) {
          if (item[sourceField] !== undefined) {
            transformed[targetField] = item[sourceField];
          }
        }
        
        return transformed;
      });
    }
    
    return data; // Para outras tabelas, retornar sem transformação
  }

  async migrateTable(sourceTable, targetTable, data) {
    this.log(`Migrando ${sourceTable} -> ${targetTable} (${data.length} registros)`);
    
    try {
      // Transformar dados se necessário
      const transformedData = this.transformData(data, sourceTable);
      
      // Limpar tabela de destino primeiro
      const { error: deleteError } = await this.hitssClient
        .from(targetTable)
        .delete()
        .neq('id', 0); // Deletar todos os registros
      
      if (deleteError) {
        this.log(`Aviso: Não foi possível limpar ${targetTable}: ${deleteError.message}`, 'warning');
      }

      // Inserir dados em lotes de 100
      const batchSize = 100;
      let successCount = 0;
      
      for (let i = 0; i < transformedData.length; i += batchSize) {
        const batch = transformedData.slice(i, i + batchSize);
        
        const { data: insertedData, error } = await this.hitssClient
          .from(targetTable)
          .insert(batch)
          .select();
        
        if (error) {
          this.log(`Erro no lote ${Math.floor(i/batchSize) + 1}: ${error.message}`, 'error');
          this.errors.push({ 
            table: targetTable, 
            operation: 'insert', 
            batch: Math.floor(i/batchSize) + 1,
            error: error.message 
          });
        } else {
          successCount += insertedData.length;
          this.log(`Lote ${Math.floor(i/batchSize) + 1} inserido: ${insertedData.length} registros`);
        }
      }
      
      this.log(`Migração concluída: ${successCount}/${transformedData.length} registros`);
      return successCount;
    } catch (error) {
      this.log(`Erro na migração de ${sourceTable}: ${error.message}`, 'error');
      this.errors.push({ table: sourceTable, operation: 'migrate', error: error.message });
      return 0;
    }
  }

  async verifyMigration(sourceTable, targetTable, originalCount) {
    this.log(`Verificando migração: ${sourceTable} -> ${targetTable}`);
    
    try {
      const { count, error } = await this.hitssClient
        .from(targetTable)
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      
      const isValid = count === originalCount;
      this.log(`Verificação ${targetTable}: ${count}/${originalCount} registros ${isValid ? '✓' : '✗'}`);
      
      return { table: targetTable, expected: originalCount, actual: count, valid: isValid };
    } catch (error) {
      this.log(`Erro na verificação de ${targetTable}: ${error.message}`, 'error');
      return { table: targetTable, expected: originalCount, actual: 0, valid: false, error: error.message };
    }
  }

  async updateProjectConfig() {
    this.log('Atualizando configurações do projeto...');
    
    try {
      // Ler arquivo .env atual
      const envPath = '.env';
      let envContent = '';
      
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }
      
      // Atualizar variáveis do Supabase
      const newEnvContent = envContent
        .replace(/VITE_SUPABASE_URL=.*/g, `VITE_SUPABASE_URL=${HITSS_PROJECT.url}`)
        .replace(/VITE_SUPABASE_ANON_KEY=.*/g, `VITE_SUPABASE_ANON_KEY=${HITSS_PROJECT.anonKey}`);
      
      // Se não existiam as variáveis, adicionar
      if (!envContent.includes('VITE_SUPABASE_URL')) {
        newEnvContent += `\nVITE_SUPABASE_URL=${HITSS_PROJECT.url}`;
      }
      if (!envContent.includes('VITE_SUPABASE_ANON_KEY')) {
        newEnvContent += `\nVITE_SUPABASE_ANON_KEY=${HITSS_PROJECT.anonKey}`;
      }
      
      // Salvar backup do .env original
      if (fs.existsSync(envPath)) {
        fs.copyFileSync(envPath, `.env.backup.${Date.now()}`);
      }
      
      // Escrever novo .env
      fs.writeFileSync(envPath, newEnvContent);
      
      this.log('Configurações atualizadas com sucesso');
      return true;
    } catch (error) {
      this.log(`Erro ao atualizar configurações: ${error.message}`, 'error');
      return false;
    }
  }

  async run() {
    this.log('=== INICIANDO MIGRAÇÃO COMPLETA ===');
    
    // 1. Testar conexões
    if (!(await this.testConnections())) {
      this.log('Falha nas conexões. Abortando migração.', 'error');
      return false;
    }
    
    // 2. Fazer backup e migrar cada tabela
    const results = [];
    
    for (const [sourceTable, targetTable] of Object.entries(TABLE_MAPPING)) {
      this.log(`\n--- Processando ${sourceTable} ---`);
      
      // Backup
      const data = await this.backupTable(sourceTable);
      if (!data) continue;
      
      // Migração
      const migratedCount = await this.migrateTable(sourceTable, targetTable, data);
      
      // Verificação
      const verification = await this.verifyMigration(sourceTable, targetTable, data.length);
      results.push(verification);
    }
    
    // 3. Atualizar configurações do projeto
    await this.updateProjectConfig();
    
    // 4. Relatório final
    this.log('\n=== RELATÓRIO FINAL ===');
    
    const successfulMigrations = results.filter(r => r.valid).length;
    const totalMigrations = results.length;
    
    this.log(`Migrações bem-sucedidas: ${successfulMigrations}/${totalMigrations}`);
    
    if (this.errors.length > 0) {
      this.log(`\nErros encontrados (${this.errors.length}):`);
      this.errors.forEach(error => {
        this.log(`- ${error.table} (${error.operation}): ${error.error}`, 'error');
      });
    }
    
    // Salvar relatório
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        successful: successfulMigrations,
        total: totalMigrations,
        errors: this.errors.length
      },
      results,
      errors: this.errors,
      log: this.migrationLog
    };
    
    fs.writeFileSync(`migration-report-${Date.now()}.json`, JSON.stringify(report, null, 2));
    
    this.log('\n=== MIGRAÇÃO CONCLUÍDA ===');
    return successfulMigrations === totalMigrations;
  }
}

// Executar migração
if (require.main === module) {
  const migration = new MigrationManager();
  migration.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Erro fatal na migração:', error);
    process.exit(1);
  });
}

module.exports = MigrationManager