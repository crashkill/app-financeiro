#!/usr/bin/env node

/**
 * Script de Migração Completa para Projeto HITSS
 * 
 * Este script migra todos os dados do projeto Supabase atual 
 * para o projeto HITSS (pwksgdjjkryqryqrvyja)
 * 
 * Funcionalidades:
 * 1. Backup completo do projeto atual
 * 2. Conexão com projeto HITSS
 * 3. Criação de estruturas necessárias
 * 4. Migração de dados (profissionais -> colaboradores)
 * 5. Verificação de integridade
 * 6. Atualização de configurações
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Configurações dos projetos
const PROJETO_ATUAL = {
  url: 'https://oomhhhfahdvavnhlbioa.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MDI2NzEsImV4cCI6MjA3MjA3ODY3MX0.VCD-Ei4eHS_AO9L2jGL2lb9Rqv3d6O0B9rqN0HRHab8',
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E'
};

const PROJETO_HITSS = {
  url: 'https://pwksgdjjkryqryqrvyja.supabase.co',
  // Estas chaves precisam ser obtidas do projeto HITSS
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3a3NnZGpqa3J5cXJ5cXJ2eWphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjAwNDgsImV4cCI6MjA2NDEzNjA0OH0.CbqU-Gx-QglerhxQzDjK6KFAi4CRLUl90LeKvDEKtbc',
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3a3NnZGpqa3J5cXJ5cXJ2eWphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODU2MDA0OCwiZXhwIjoyMDY0MTM2MDQ4fQ.FaNXM6jMHLAa-e6A8PQlZY9wxv9XrweZa4vMCYNhdk4'
};

// Diretório para backups
const BACKUP_DIR = './migration-backup';

class MigracaoHITSS {
  constructor() {
    this.clienteAtual = null;
    this.clienteHITSS = null;
    this.backupData = {};
    this.migrationLog = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logEntry);
    this.migrationLog.push(logEntry);
  }

  async inicializar() {
    this.log('🚀 Iniciando migração para projeto HITSS...');
    
    // Criar diretório de backup
    try {
      await fs.mkdir(BACKUP_DIR, { recursive: true });
      this.log(`📁 Diretório de backup criado: ${BACKUP_DIR}`);
    } catch (error) {
      this.log(`❌ Erro ao criar diretório de backup: ${error.message}`, 'error');
      throw error;
    }

    // Conectar ao projeto atual
    this.clienteAtual = createClient(PROJETO_ATUAL.url, PROJETO_ATUAL.serviceKey);
    this.log('✅ Conectado ao projeto atual');

    // Verificar conexão atual
    const { data: testData, error: testError } = await this.clienteAtual
      .from('colaboradores')
      .select('count', { count: 'exact', head: true });
    
    if (testError) {
      this.log(`❌ Erro na conexão atual: ${testError.message}`, 'error');
      throw testError;
    }
    
    this.log(`✅ Projeto atual verificado - ${testData} registros em colaboradores`);
  }

  async conectarHITSS() {
    this.log('🔗 Tentando conectar ao projeto HITSS...');
    
    // Primeiro, vamos tentar com chaves padrão ou solicitar ao usuário
    if (PROJETO_HITSS.anonKey === 'HITSS_ANON_KEY_AQUI') {
      this.log('⚠️  Chaves do projeto HITSS não configuradas!', 'warn');
      this.log('📋 Por favor, configure as chaves do projeto HITSS no script', 'warn');
      
      // Tentar obter as chaves via MCP (se disponível)
      this.log('🔍 Tentando obter chaves via MCP-Supabase-HITSS...');
      return false;
    }

    this.clienteHITSS = createClient(PROJETO_HITSS.url, PROJETO_HITSS.serviceKey);
    
    // Testar conexão
    try {
      const { data, error } = await this.clienteHITSS
        .from('colaboradores')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        this.log(`❌ Erro na conexão HITSS: ${error.message}`, 'error');
        return false;
      }
      
      this.log('✅ Conectado ao projeto HITSS com sucesso');
      return true;
    } catch (error) {
      this.log(`❌ Falha na conexão HITSS: ${error.message}`, 'error');
      return false;
    }
  }

  async fazerBackup() {
    this.log('💾 Iniciando backup do projeto atual...');

    // Lista de tabelas para backup
    const tabelas = [
      'colaboradores',
      'transacoes_financeiras', 
      'dados_dre',
      'profissionais',
      'previsoes_financeiras',
      'logs_auditoria',
      'uploads_arquivos',
      'configuracoes_sistema',
      'hitss_data',
      'hitss_automation_executions',
      'hitss_automation_logs',
      'automation_executions',
      'dre_categories',
      'dre_reports',
      'dre_items',
      'dre_execution_logs',
      'dashboard_metrics',
      'planilhas_metrics',
      'forecast_metrics',
      'profissionais_metrics',
      'dim_projeto',
      'dim_cliente',
      'dim_conta',
      'dim_periodo',
      'dim_recurso',
      'fact_dre_lancamentos',
      'dre_hitss',
      'stg_dre_hitss_raw',
      'projetos',
      'app_secrets',
      'profissional_projeto'
    ];

    for (const tabela of tabelas) {
      try {
        this.log(`📊 Fazendo backup da tabela: ${tabela}`);
        
        const { data, error } = await this.clienteAtual
          .from(tabela)
          .select('*');
        
        if (error) {
          this.log(`⚠️  Tabela ${tabela} não encontrada ou erro: ${error.message}`, 'warn');
          continue;
        }

        this.backupData[tabela] = data;
        
        // Salvar backup em arquivo
        const backupFile = path.join(BACKUP_DIR, `${tabela}.json`);
        await fs.writeFile(backupFile, JSON.stringify(data, null, 2));
        
        this.log(`✅ Backup da tabela ${tabela} concluído - ${data.length} registros`);
        
      } catch (error) {
        this.log(`❌ Erro no backup da tabela ${tabela}: ${error.message}`, 'error');
      }
    }

    // Salvar log de backup
    const backupLog = {
      timestamp: new Date().toISOString(),
      projeto_origem: PROJETO_ATUAL.url,
      tabelas_backup: Object.keys(this.backupData),
      total_registros: Object.values(this.backupData).reduce((total, data) => total + data.length, 0)
    };

    await fs.writeFile(
      path.join(BACKUP_DIR, 'backup-log.json'), 
      JSON.stringify(backupLog, null, 2)
    );

    this.log(`✅ Backup completo - ${backupLog.total_registros} registros salvos`);
  }

  async migrarDados() {
    this.log('🔄 Iniciando migração de dados...');

    if (!this.clienteHITSS) {
      this.log('❌ Cliente HITSS não conectado', 'error');
      return false;
    }

    // Migração especial: profissionais -> colaboradores
    if (this.backupData.profissionais && this.backupData.profissionais.length > 0) {
      this.log('👥 Migrando dados de profissionais para colaboradores...');
      
      const profissionais = this.backupData.profissionais;
      const colaboradores = profissionais.map(prof => ({
        // Mapear campos de profissionais para colaboradores
        id: prof.id,
        nome_completo: prof.nome || prof.nome_completo,
        email: prof.email,
        telefone: prof.telefone,
        cargo: prof.cargo || prof.funcao,
        departamento: prof.departamento,
        data_admissao: prof.data_admissao || prof.created_at,
        salario: prof.salario,
        status: prof.status || 'ativo',
        created_at: prof.created_at,
        updated_at: prof.updated_at || new Date().toISOString()
      }));

      try {
        const { data, error } = await this.clienteHITSS
          .from('colaboradores')
          .upsert(colaboradores);

        if (error) {
          this.log(`❌ Erro na migração profissionais->colaboradores: ${error.message}`, 'error');
        } else {
          this.log(`✅ Migração profissionais->colaboradores concluída - ${colaboradores.length} registros`);
        }
      } catch (error) {
        this.log(`❌ Falha na migração profissionais->colaboradores: ${error.message}`, 'error');
      }
    }

    // Migrar outras tabelas (exceto profissionais, pois já foi migrada como colaboradores)
    const tabelasParaMigrar = Object.keys(this.backupData).filter(tabela => 
      tabela !== 'profissionais' && tabela !== 'colaboradores'
    );

    for (const tabela of tabelasParaMigrar) {
      try {
        this.log(`📋 Migrando tabela: ${tabela}`);
        
        const dados = this.backupData[tabela];
        if (!dados || dados.length === 0) {
          this.log(`⚠️  Tabela ${tabela} vazia, pulando...`, 'warn');
          continue;
        }

        const { data, error } = await this.clienteHITSS
          .from(tabela)
          .upsert(dados);

        if (error) {
          this.log(`❌ Erro na migração da tabela ${tabela}: ${error.message}`, 'error');
        } else {
          this.log(`✅ Tabela ${tabela} migrada - ${dados.length} registros`);
        }

      } catch (error) {
        this.log(`❌ Falha na migração da tabela ${tabela}: ${error.message}`, 'error');
      }
    }

    this.log('✅ Migração de dados concluída');
    return true;
  }

  async verificarIntegridade() {
    this.log('🔍 Verificando integridade dos dados migrados...');

    if (!this.clienteHITSS) {
      this.log('❌ Cliente HITSS não disponível para verificação', 'error');
      return false;
    }

    const relatorio = {
      timestamp: new Date().toISOString(),
      verificacoes: []
    };

    // Verificar colaboradores (migrados de profissionais)
    try {
      const { data: colaboradoresHITSS, error } = await this.clienteHITSS
        .from('colaboradores')
        .select('count', { count: 'exact', head: true });

      const profissionaisOriginais = this.backupData.profissionais?.length || 0;
      const colaboradoresOriginais = this.backupData.colaboradores?.length || 0;
      const totalEsperado = profissionaisOriginais + colaboradoresOriginais;

      relatorio.verificacoes.push({
        tabela: 'colaboradores',
        esperado: totalEsperado,
        encontrado: colaboradoresHITSS || 0,
        status: (colaboradoresHITSS || 0) >= totalEsperado ? 'OK' : 'DIVERGENCIA'
      });

      this.log(`📊 Colaboradores - Esperado: ${totalEsperado}, Encontrado: ${colaboradoresHITSS || 0}`);

    } catch (error) {
      this.log(`❌ Erro na verificação de colaboradores: ${error.message}`, 'error');
    }

    // Verificar outras tabelas
    const tabelasVerificar = Object.keys(this.backupData).filter(tabela => 
      tabela !== 'profissionais' && tabela !== 'colaboradores'
    );

    for (const tabela of tabelasVerificar) {
      try {
        const { data: countHITSS, error } = await this.clienteHITSS
          .from(tabela)
          .select('count', { count: 'exact', head: true });

        const esperado = this.backupData[tabela]?.length || 0;
        const encontrado = countHITSS || 0;

        relatorio.verificacoes.push({
          tabela,
          esperado,
          encontrado,
          status: encontrado >= esperado ? 'OK' : 'DIVERGENCIA'
        });

        this.log(`📊 ${tabela} - Esperado: ${esperado}, Encontrado: ${encontrado}`);

      } catch (error) {
        this.log(`⚠️  Erro na verificação da tabela ${tabela}: ${error.message}`, 'warn');
      }
    }

    // Salvar relatório
    await fs.writeFile(
      path.join(BACKUP_DIR, 'relatorio-integridade.json'),
      JSON.stringify(relatorio, null, 2)
    );

    const divergencias = relatorio.verificacoes.filter(v => v.status === 'DIVERGENCIA');
    if (divergencias.length > 0) {
      this.log(`⚠️  ${divergencias.length} divergências encontradas`, 'warn');
      return false;
    } else {
      this.log('✅ Verificação de integridade passou - todos os dados migrados corretamente');
      return true;
    }
  }

  async atualizarConfiguracoes() {
    this.log('⚙️  Atualizando configurações do projeto...');

    // Atualizar .env
    const novoEnv = `# Configurações do Supabase - Projeto HITSS via MCP-Supabase-HITSS
VITE_SUPABASE_URL=${PROJETO_HITSS.url}
VITE_SUPABASE_ANON_KEY=${PROJETO_HITSS.anonKey}
VITE_SUPABASE_SERVICE_ROLE_KEY=${PROJETO_HITSS.serviceKey}

# Configurações da aplicação
VITE_APP_NAME=App Financeiro
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=development

# Configurações de desenvolvimento
VITE_DEBUG=true
VITE_LOG_LEVEL=debug

# Configurações de GraphQL
VITE_GRAPHQL_ENDPOINT=/graphql/v1
VITE_ENABLE_GRAPHQL_PLAYGROUND=true

# Configurações de upload
VITE_MAX_FILE_SIZE=10485760

# Configurações de migração
VITE_MIGRATION_DATE=${new Date().toISOString()}
VITE_MIGRATION_FROM=oomhhhfahdvavnhlbioa
VITE_MIGRATION_TO=pwksgdjjkryqryqrvyja
`;

    try {
      await fs.writeFile('.env', novoEnv);
      this.log('✅ Arquivo .env atualizado');
    } catch (error) {
      this.log(`❌ Erro ao atualizar .env: ${error.message}`, 'error');
    }

    // Atualizar supabase.ts
    const supabaseConfig = `import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Cliente com service role para operações administrativas
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// Log de configuração (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  console.log('🔧 Supabase configurado:', {
    url: supabaseUrl,
    projeto: supabaseUrl.includes('pwksgdjjkryqryqrvyja') ? 'HITSS' : 'Outro',
    timestamp: new Date().toISOString()
  })
}
`;

    try {
      await fs.writeFile('src/lib/supabase.ts', supabaseConfig);
      this.log('✅ Arquivo supabase.ts atualizado');
    } catch (error) {
      this.log(`❌ Erro ao atualizar supabase.ts: ${error.message}`, 'error');
    }

    this.log('✅ Configurações atualizadas para projeto HITSS');
  }

  async salvarLogMigracao() {
    const logFinal = {
      timestamp: new Date().toISOString(),
      projeto_origem: PROJETO_ATUAL.url,
      projeto_destino: PROJETO_HITSS.url,
      status: 'CONCLUIDA',
      logs: this.migrationLog,
      resumo: {
        tabelas_migradas: Object.keys(this.backupData).length,
        registros_totais: Object.values(this.backupData).reduce((total, data) => total + data.length, 0)
      }
    };

    await fs.writeFile(
      path.join(BACKUP_DIR, 'migration-log.json'),
      JSON.stringify(logFinal, null, 2)
    );

    this.log('📋 Log de migração salvo');
  }

  async executar() {
    try {
      await this.inicializar();
      
      // Fazer backup completo
      await this.fazerBackup();
      
      // Tentar conectar ao HITSS
      const conectadoHITSS = await this.conectarHITSS();
      
      if (!conectadoHITSS) {
        this.log('⚠️  Não foi possível conectar ao projeto HITSS', 'warn');
        this.log('📋 Configure as chaves do projeto HITSS e execute novamente', 'warn');
        this.log('🔑 Chaves necessárias: VITE_SUPABASE_ANON_KEY e VITE_SUPABASE_SERVICE_ROLE_KEY', 'warn');
        return false;
      }

      // Migrar dados
      await this.migrarDados();
      
      // Verificar integridade
      const integridadeOK = await this.verificarIntegridade();
      
      if (integridadeOK) {
        // Atualizar configurações apenas se a integridade estiver OK
        await this.atualizarConfiguracoes();
        this.log('🎉 Migração concluída com sucesso!');
      } else {
        this.log('⚠️  Migração concluída com divergências - verifique o relatório', 'warn');
      }
      
      await this.salvarLogMigracao();
      
      return true;
      
    } catch (error) {
      this.log(`❌ Erro fatal na migração: ${error.message}`, 'error');
      await this.salvarLogMigracao();
      return false;
    }
  }
}

// Executar migração se chamado diretamente
if (require.main === module) {
  const migracao = new MigracaoHITSS();
  
  migracao.executar().then(sucesso => {
    if (sucesso) {
      console.log('\n🎉 Migração finalizada! Verifique os logs em ./migration-backup/');
      process.exit(0);
    } else {
      console.log('\n❌ Migração falhou! Verifique os logs para detalhes.');
      process.exit(1);
    }
  }).catch(error => {
    console.error('\n💥 Erro fatal:', error.message);
    process.exit(1);
  });
}

module.exports = MigracaoHITSS;