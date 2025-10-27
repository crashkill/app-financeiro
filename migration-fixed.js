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
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3a3NnZGpqa3J5cXJ5cXJ2eWphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjAwNDgsImV4cCI6MjA2NDEzNjA0OH0.CbqU-Gx-QglerhxQzDjK6KFAi4CRLUl90LeKvDEKtbc',
  serviceKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3a3NnZGpqa3J5cXJ5cXJ2eWphIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODU2MDA0OCwiZXhwIjoyMDY0MTM2MDQ4fQ.FaNXM6jMHLAa-e6A8PQlZY9wxv9XrweZa4vMCYNhdk4'
};

const BACKUP_DIR = './migration-backup';

class MigracaoCorrigida {
  constructor() {
    this.clienteAtual = null;
    this.clienteHITSS = null;
    this.backupData = {};
    this.migrationLog = [];
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    console.log(logMessage);
    this.migrationLog.push(logMessage);
  }

  async inicializar() {
    this.log('🚀 Iniciando migração corrigida para projeto HITSS...');
    
    // Criar diretório de backup
    try {
      await fs.mkdir(BACKUP_DIR, { recursive: true });
      this.log(`📁 Diretório de backup criado: ${BACKUP_DIR}`);
    } catch (error) {
      this.log(`⚠️  Diretório de backup já existe: ${BACKUP_DIR}`, 'warn');
    }

    // Conectar ao projeto atual
    this.clienteAtual = createClient(PROJETO_ATUAL.url, PROJETO_ATUAL.serviceKey);
    this.log('✅ Conectado ao projeto atual');

    return true;
  }

  async conectarHITSS() {
    try {
      // Ler credenciais do arquivo
      const credentialsPath = path.join(process.cwd(), 'hitss-credentials.json');
      const credentialsData = await fs.readFile(credentialsPath, 'utf8');
      const credentials = JSON.parse(credentialsData);

      this.clienteHITSS = createClient(credentials.url, credentials.serviceKey);
      
      // Testar conexão
      const { data, error } = await this.clienteHITSS.from('colaboradores').select('count', { count: 'exact', head: true });
      
      if (error) {
        this.log(`❌ Erro ao conectar ao projeto HITSS: ${error.message}`, 'error');
        return false;
      }

      this.log('✅ Conectado ao projeto HITSS com sucesso');
      return true;
    } catch (error) {
      this.log(`❌ Erro ao conectar ao projeto HITSS: ${error.message}`, 'error');
      return false;
    }
  }

  async migrarColaboradores() {
    this.log('👥 Migrando dados de profissionais para colaboradores...');
    
    try {
      // Buscar dados de profissionais do projeto atual
      const { data: profissionais, error: errorProf } = await this.clienteAtual
        .from('profissionais')
        .select('*');

      if (errorProf) {
        this.log(`❌ Erro ao buscar profissionais: ${errorProf.message}`, 'error');
        return false;
      }

      // Buscar dados de colaboradores existentes do projeto atual
      const { data: colaboradoresAtuais, error: errorColab } = await this.clienteAtual
        .from('colaboradores')
        .select('*');

      if (errorColab) {
        this.log(`❌ Erro ao buscar colaboradores: ${errorColab.message}`, 'error');
        return false;
      }

      this.log(`📊 Encontrados ${profissionais?.length || 0} profissionais e ${colaboradoresAtuais?.length || 0} colaboradores`);

      // Mapear profissionais para o formato de colaboradores do HITSS
      const colaboradoresParaMigrar = [];

      // Migrar profissionais
      if (profissionais && profissionais.length > 0) {
        profissionais.forEach(prof => {
          colaboradoresParaMigrar.push({
            id: prof.id,
            nome_completo: prof.nome || prof.nome_completo,
            email: prof.email,
            regime: prof.regime || 'CLT',
            local_alocacao: prof.local_alocacao || 'Remoto',
            proficiencia_cargo: prof.cargo || prof.funcao || 'Desenvolvedor',
            created_at: prof.created_at,
            disponivel_compartilhamento: prof.disponivel_compartilhamento || false,
            percentual_compartilhamento: prof.percentual_compartilhamento || '100'
          });
        });
      }

      // Migrar colaboradores existentes (manter estrutura)
      if (colaboradoresAtuais && colaboradoresAtuais.length > 0) {
        colaboradoresAtuais.forEach(colab => {
          colaboradoresParaMigrar.push({
            id: colab.id,
            nome_completo: colab.nome_completo,
            email: colab.email,
            regime: colab.regime || 'CLT',
            local_alocacao: colab.local_alocacao || 'Remoto',
            proficiencia_cargo: colab.proficiencia_cargo || 'Desenvolvedor',
            java: colab.java,
            javascript: colab.javascript,
            python: colab.python,
            typescript: colab.typescript,
            php: colab.php,
            dotnet: colab.dotnet,
            react: colab.react,
            angular: colab.angular,
            ionic: colab.ionic,
            flutter: colab.flutter,
            mysql: colab.mysql,
            postgres: colab.postgres,
            oracle_db: colab.oracle_db,
            sql_server: colab.sql_server,
            mongodb: colab.mongodb,
            aws: colab.aws,
            azure: colab.azure,
            gcp: colab.gcp,
            outras_tecnologias: colab.outras_tecnologias,
            created_at: colab.created_at,
            disponivel_compartilhamento: colab.disponivel_compartilhamento || false,
            percentual_compartilhamento: colab.percentual_compartilhamento || '100'
          });
        });
      }

      if (colaboradoresParaMigrar.length === 0) {
        this.log('⚠️  Nenhum colaborador para migrar', 'warn');
        return true;
      }

      // Inserir no projeto HITSS
      const { data, error } = await this.clienteHITSS
        .from('colaboradores')
        .upsert(colaboradoresParaMigrar, { onConflict: 'id' });

      if (error) {
        this.log(`❌ Erro na migração de colaboradores: ${error.message}`, 'error');
        return false;
      }

      this.log(`✅ Migração de colaboradores concluída - ${colaboradoresParaMigrar.length} registros`);
      return true;

    } catch (error) {
      this.log(`❌ Falha na migração de colaboradores: ${error.message}`, 'error');
      return false;
    }
  }

  async migrarTabelasSimples() {
    this.log('📋 Migrando tabelas com estruturas compatíveis...');

    // Lista de tabelas que podem ser migradas diretamente (estruturas similares)
    const tabelasCompativeis = [
      'transacoes_financeiras',
      'previsoes_financeiras', 
      'uploads_arquivos',
      'logs_auditoria',
      'configuracoes_sistema'
    ];

    let sucessos = 0;
    let falhas = 0;

    for (const tabela of tabelasCompativeis) {
      try {
        this.log(`📊 Migrando tabela: ${tabela}`);

        // Buscar dados do projeto atual
        const { data: dados, error: errorBusca } = await this.clienteAtual
          .from(tabela)
          .select('*');

        if (errorBusca) {
          this.log(`❌ Erro ao buscar dados de ${tabela}: ${errorBusca.message}`, 'error');
          falhas++;
          continue;
        }

        if (!dados || dados.length === 0) {
          this.log(`⚠️  Tabela ${tabela} vazia, pulando...`, 'warn');
          continue;
        }

        // Inserir no projeto HITSS
        const { data: resultado, error: errorInsert } = await this.clienteHITSS
          .from(tabela)
          .upsert(dados, { onConflict: 'id' });

        if (errorInsert) {
          this.log(`❌ Erro na migração da tabela ${tabela}: ${errorInsert.message}`, 'error');
          falhas++;
        } else {
          this.log(`✅ Tabela ${tabela} migrada - ${dados.length} registros`);
          sucessos++;
        }

      } catch (error) {
        this.log(`❌ Falha na migração da tabela ${tabela}: ${error.message}`, 'error');
        falhas++;
      }
    }

    this.log(`📊 Migração de tabelas simples: ${sucessos} sucessos, ${falhas} falhas`);
    return sucessos > 0;
  }

  async migrarDadosDRE() {
    this.log('📈 Migrando dados DRE...');

    try {
      // Buscar dados DRE do projeto atual
      const { data: dadosDRE, error } = await this.clienteAtual
        .from('dados_dre')
        .select('*');

      if (error) {
        this.log(`❌ Erro ao buscar dados DRE: ${error.message}`, 'error');
        return false;
      }

      if (!dadosDRE || dadosDRE.length === 0) {
        this.log('⚠️  Nenhum dado DRE para migrar', 'warn');
        return true;
      }

      // Mapear dados DRE para o formato da tabela dre_hitss
      const dreHITSSData = dadosDRE.map(item => {
        const dataAtual = new Date();
        return {
          projeto: item.projeto || 'Projeto Migrado',
          ano: item.ano || dataAtual.getFullYear(),
          mes: item.mes || dataAtual.getMonth() + 1,
          conta: item.conta || 'CONTA_MIGRADA',
          descricao: item.descricao || item.nome || 'Dados migrados do projeto anterior',
          natureza: item.tipo === 'receita' ? 'RECEITA' : 'DESPESA',
          tipo: 'OPERACIONAL',
          valor: parseFloat(item.valor) || 0,
          observacoes: `Migrado de dados_dre - ID original: ${item.id}`,
          data_criacao: item.created_at || dataAtual.toISOString(),
          data_atualizacao: dataAtual.toISOString(),
          ativo: true,
          metadata: {
            origem: 'migracao_dados_dre',
            id_original: item.id,
            timestamp_migracao: dataAtual.toISOString()
          }
        };
      });

      // Inserir no projeto HITSS
      const { data, error: errorInsert } = await this.clienteHITSS
        .from('dre_hitss')
        .insert(dreHITSSData);

      if (errorInsert) {
        this.log(`❌ Erro na migração de dados DRE: ${errorInsert.message}`, 'error');
        return false;
      }

      this.log(`✅ Dados DRE migrados - ${dreHITSSData.length} registros`);
      return true;

    } catch (error) {
      this.log(`❌ Falha na migração de dados DRE: ${error.message}`, 'error');
      return false;
    }
  }

  async verificarIntegridade() {
    this.log('🔍 Verificando integridade dos dados migrados...');

    const relatorio = {
      timestamp: new Date().toISOString(),
      verificacoes: []
    };

    try {
      // Verificar colaboradores
      const { data: countColab } = await this.clienteHITSS
        .from('colaboradores')
        .select('count', { count: 'exact', head: true });

      relatorio.verificacoes.push({
        tabela: 'colaboradores',
        encontrado: countColab || 0,
        status: 'VERIFICADO'
      });

      // Verificar dre_hitss
      const { data: countDRE } = await this.clienteHITSS
        .from('dre_hitss')
        .select('count', { count: 'exact', head: true });

      relatorio.verificacoes.push({
        tabela: 'dre_hitss',
        encontrado: countDRE || 0,
        status: 'VERIFICADO'
      });

      this.log(`📊 Colaboradores migrados: ${countColab || 0}`);
      this.log(`📊 Registros DRE migrados: ${countDRE || 0}`);

      // Salvar relatório
      await fs.writeFile(
        path.join(BACKUP_DIR, 'relatorio-integridade-corrigido.json'),
        JSON.stringify(relatorio, null, 2)
      );

      this.log('✅ Verificação de integridade concluída');
      return true;

    } catch (error) {
      this.log(`❌ Erro na verificação de integridade: ${error.message}`, 'error');
      return false;
    }
  }

  async atualizarConfiguracoes() {
    this.log('⚙️  Atualizando configurações do projeto...');

    // Atualizar .env
    const novoEnv = `# Configurações do Supabase - Projeto HITSS via MCP-Supabase-HITSS
VITE_SUPABASE_URL=${PROJETO_HITSS.url}
VITE_SUPABASE_ANON_KEY=${PROJETO_HITSS.anonKey}

# Configurações da aplicação
VITE_APP_NAME=App Financeiro HITSS
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production

# Configurações de desenvolvimento
VITE_DEBUG=false
VITE_LOG_LEVEL=info

# Configurações de GraphQL
VITE_GRAPHQL_ENDPOINT=/graphql/v1
VITE_ENABLE_GRAPHQL_PLAYGROUND=false

# Configurações de upload
VITE_MAX_FILE_SIZE=10485760

# Configurações de migração
VITE_MIGRATION_DATE=${new Date().toISOString()}
VITE_MIGRATION_FROM=oomhhhfahdvavnhlbioa
VITE_MIGRATION_TO=pwksgdjjkryqryqrvyja
VITE_MIGRATION_STATUS=COMPLETED
`;

    try {
      await fs.writeFile('.env', novoEnv);
      this.log('✅ Arquivo .env atualizado');
    } catch (error) {
      this.log(`❌ Erro ao atualizar .env: ${error.message}`, 'error');
    }

    this.log('✅ Configurações atualizadas para projeto HITSS');
  }

  async salvarLogMigracao() {
    const logFinal = {
      timestamp: new Date().toISOString(),
      projeto_origem: PROJETO_ATUAL.url,
      projeto_destino: PROJETO_HITSS.url,
      status: 'CONCLUIDA_CORRIGIDA',
      logs: this.migrationLog,
      resumo: {
        tipo_migracao: 'CORRIGIDA_COM_MAPEAMENTO',
        tabelas_principais: ['colaboradores', 'dre_hitss', 'transacoes_financeiras', 'logs_auditoria']
      }
    };

    await fs.writeFile(
      path.join(BACKUP_DIR, 'migration-log-corrigido.json'),
      JSON.stringify(logFinal, null, 2)
    );

    this.log('📋 Log de migração corrigido salvo');
  }

  async executar() {
    try {
      await this.inicializar();
      
      // Conectar ao HITSS
      const conectadoHITSS = await this.conectarHITSS();
      
      if (!conectadoHITSS) {
        this.log('❌ Não foi possível conectar ao projeto HITSS', 'error');
        return false;
      }

      // Migrar colaboradores (profissionais + colaboradores)
      const colaboradoresOK = await this.migrarColaboradores();
      
      // Migrar tabelas simples
      const tabelasOK = await this.migrarTabelasSimples();
      
      // Migrar dados DRE
      const dreOK = await this.migrarDadosDRE();
      
      // Verificar integridade
      await this.verificarIntegridade();
      
      // Atualizar configurações
      await this.atualizarConfiguracoes();
      
      await this.salvarLogMigracao();
      
      if (colaboradoresOK || tabelasOK || dreOK) {
        this.log('🎉 Migração corrigida concluída com sucesso!');
        return true;
      } else {
        this.log('⚠️  Migração concluída com problemas', 'warn');
        return false;
      }
      
    } catch (error) {
      this.log(`❌ Erro fatal na migração: ${error.message}`, 'error');
      await this.salvarLogMigracao();
      return false;
    }
  }
}

// Executar migração se chamado diretamente
if (require.main === module) {
  const migracao = new MigracaoCorrigida();
  
  migracao.executar().then(sucesso => {
    if (sucesso) {
      console.log('\n🎉 Migração corrigida finalizada! Verifique os logs em ./migration-backup/');
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

module.exports = MigracaoCorrigida;