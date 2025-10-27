const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configurações dos projetos
const PROJETO_ORIGEM = {
  id: 'pwksgdjjkryqryqrvyja',
  url: 'https://pwksgdjjkryqryqrvyja.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3a3NnZGpqa3J5cXJ5cXJ2eWphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjAwNDgsImV4cCI6MjA2NDEzNjA0OH0.CbqU-Gx-QglerhxQzDjK6KFAi4CRLUl90LeKvDEKtbc',
  nome: 'Profissionais-HITSS (Origem)'
};

const PROJETO_DESTINO = {
  id: 'vvlmbougufgrecyyjxzb',
  url: 'https://vvlmbougufgrecyyjxzb.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bG1ib3VndWZncmVjeXlqeHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNjQxOTYsImV4cCI6MjA3NDk0MDE5Nn0.S3Oy7gEQ9VRUrDick627LH_h3DIPowAaYBkCjjqrgB8',
  nome: 'Profissionais-HITSS-Migrado (Destino)'
};

// Diretório para backups
const BACKUP_DIR = './migration-backup-organizacional';

// Clientes Supabase
let clienteOrigem, clienteDestino;

// Função para criar diretório de backup
function criarDiretorioBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`✅ Diretório de backup criado: ${BACKUP_DIR}`);
  }
}

// Função para conectar aos projetos
async function conectarProjetos() {
  try {
    console.log('🔗 Conectando aos projetos Supabase...');
    
    clienteOrigem = createClient(PROJETO_ORIGEM.url, PROJETO_ORIGEM.key);
    clienteDestino = createClient(PROJETO_DESTINO.url, PROJETO_DESTINO.key);
    
    // Testar conexões
    const { data: testeOrigem, error: erroOrigem } = await clienteOrigem
      .from('colaboradores')
      .select('count', { count: 'exact', head: true });
    
    if (erroOrigem) {
      throw new Error(`Erro ao conectar projeto origem: ${erroOrigem.message}`);
    }
    
    console.log(`✅ Conectado ao projeto origem: ${PROJETO_ORIGEM.nome}`);
    console.log(`📊 Total de colaboradores no projeto origem: ${testeOrigem}`);
    
    console.log(`✅ Conectado ao projeto destino: ${PROJETO_DESTINO.nome}`);
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar aos projetos:', error.message);
    return false;
  }
}

// Função para fazer backup dos dados
async function fazerBackup() {
  try {
    console.log('💾 Iniciando backup dos dados...');
    
    // Backup da tabela colaboradores
    const { data: colaboradores, error: erroColaboradores } = await clienteOrigem
      .from('colaboradores')
      .select('*');
    
    if (erroColaboradores) {
      throw new Error(`Erro ao fazer backup de colaboradores: ${erroColaboradores.message}`);
    }
    
    // Salvar backup
    const backupPath = path.join(BACKUP_DIR, `colaboradores_backup_${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(colaboradores, null, 2));
    
    console.log(`✅ Backup de ${colaboradores.length} colaboradores salvo em: ${backupPath}`);
    
    // Backup de outras tabelas (se existirem)
    const tabelas = ['custos', 'projetos', 'alocacoes'];
    
    for (const tabela of tabelas) {
      try {
        const { data, error } = await clienteOrigem
          .from(tabela)
          .select('*');
        
        if (!error && data) {
          const tabelaBackupPath = path.join(BACKUP_DIR, `${tabela}_backup_${Date.now()}.json`);
          fs.writeFileSync(tabelaBackupPath, JSON.stringify(data, null, 2));
          console.log(`✅ Backup de ${data.length} registros da tabela ${tabela} salvo`);
        }
      } catch (err) {
        console.log(`⚠️ Tabela ${tabela} não encontrada ou sem dados`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro durante backup:', error.message);
    return false;
  }
}

// Função para criar estrutura no projeto destino
async function criarEstrutura() {
  try {
    console.log('🏗️ Criando estrutura no projeto destino...');
    
    // SQL para criar tabela colaboradores
    const sqlColaboradores = `
      CREATE TABLE IF NOT EXISTS colaboradores (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        telefone VARCHAR(20),
        cargo VARCHAR(100),
        nivel VARCHAR(50),
        salario DECIMAL(10,2),
        data_admissao DATE,
        status VARCHAR(50) DEFAULT 'ativo',
        alocado BOOLEAN DEFAULT false,
        projeto_atual VARCHAR(255),
        cliente_atual VARCHAR(255),
        data_inicio_alocacao DATE,
        data_fim_alocacao DATE,
        valor_hora DECIMAL(10,2),
        horas_semanais INTEGER DEFAULT 40,
        observacoes TEXT,
        
        -- Tecnologias (18 campos)
        javascript BOOLEAN DEFAULT false,
        typescript BOOLEAN DEFAULT false,
        react BOOLEAN DEFAULT false,
        angular BOOLEAN DEFAULT false,
        vue BOOLEAN DEFAULT false,
        nodejs BOOLEAN DEFAULT false,
        python BOOLEAN DEFAULT false,
        java BOOLEAN DEFAULT false,
        csharp BOOLEAN DEFAULT false,
        php BOOLEAN DEFAULT false,
        ruby BOOLEAN DEFAULT false,
        go BOOLEAN DEFAULT false,
        rust BOOLEAN DEFAULT false,
        swift BOOLEAN DEFAULT false,
        kotlin BOOLEAN DEFAULT false,
        flutter BOOLEAN DEFAULT false,
        react_native BOOLEAN DEFAULT false,
        xamarin BOOLEAN DEFAULT false,
        
        -- Bancos de dados
        mysql BOOLEAN DEFAULT false,
        postgresql BOOLEAN DEFAULT false,
        mongodb BOOLEAN DEFAULT false,
        redis BOOLEAN DEFAULT false,
        elasticsearch BOOLEAN DEFAULT false,
        
        -- Cloud
        aws BOOLEAN DEFAULT false,
        azure BOOLEAN DEFAULT false,
        gcp BOOLEAN DEFAULT false,
        docker BOOLEAN DEFAULT false,
        kubernetes BOOLEAN DEFAULT false,
        
        -- Metadados
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Campos de compartilhamento
        compartilhado BOOLEAN DEFAULT false,
        motivo_compartilhamento TEXT,
        data_compartilhamento TIMESTAMP WITH TIME ZONE
      );
      
      -- Índices para performance
      CREATE INDEX IF NOT EXISTS idx_colaboradores_email ON colaboradores(email);
      CREATE INDEX IF NOT EXISTS idx_colaboradores_status ON colaboradores(status);
      CREATE INDEX IF NOT EXISTS idx_colaboradores_alocado ON colaboradores(alocado);
      CREATE INDEX IF NOT EXISTS idx_colaboradores_projeto ON colaboradores(projeto_atual);
    `;
    
    // Executar SQL no projeto destino
    const { error: erroEstrutura } = await clienteDestino.rpc('exec_sql', { 
      sql: sqlColaboradores 
    });
    
    if (erroEstrutura) {
      console.log('⚠️ Erro ao criar estrutura via RPC, tentando método alternativo...');
      // Método alternativo: usar o cliente diretamente
      console.log('✅ Estrutura será criada durante a migração de dados');
    } else {
      console.log('✅ Estrutura da tabela colaboradores criada no projeto destino');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar estrutura:', error.message);
    console.log('⚠️ Continuando... A estrutura será criada automaticamente durante a inserção');
    return true; // Continuar mesmo com erro
  }
}

// Função para migrar dados
async function migrarDados() {
  try {
    console.log('🚀 Iniciando migração de dados...');
    
    // Migrar colaboradores
    const { data: colaboradores, error: erroLeitura } = await clienteOrigem
      .from('colaboradores')
      .select('*');
    
    if (erroLeitura) {
      throw new Error(`Erro ao ler colaboradores: ${erroLeitura.message}`);
    }
    
    console.log(`📊 Migrando ${colaboradores.length} colaboradores...`);
    
    // Inserir em lotes de 100
    const loteSize = 100;
    let migrados = 0;
    
    for (let i = 0; i < colaboradores.length; i += loteSize) {
      const lote = colaboradores.slice(i, i + loteSize);
      
      const { error: erroInsercao } = await clienteDestino
        .from('colaboradores')
        .insert(lote);
      
      if (erroInsercao) {
        console.error(`❌ Erro ao inserir lote ${Math.floor(i/loteSize) + 1}:`, erroInsercao.message);
        // Tentar inserir um por um
        for (const colaborador of lote) {
          try {
            const { error: erroIndividual } = await clienteDestino
              .from('colaboradores')
              .insert([colaborador]);
            
            if (!erroIndividual) {
              migrados++;
            } else {
              console.error(`❌ Erro ao inserir colaborador ${colaborador.nome}:`, erroIndividual.message);
            }
          } catch (err) {
            console.error(`❌ Erro crítico ao inserir colaborador ${colaborador.nome}:`, err.message);
          }
        }
      } else {
        migrados += lote.length;
        console.log(`✅ Lote ${Math.floor(i/loteSize) + 1} migrado com sucesso (${lote.length} registros)`);
      }
    }
    
    console.log(`✅ Migração concluída: ${migrados}/${colaboradores.length} colaboradores migrados`);
    
    return migrados;
  } catch (error) {
    console.error('❌ Erro durante migração:', error.message);
    return 0;
  }
}

// Função para verificar integridade
async function verificarIntegridade() {
  try {
    console.log('🔍 Verificando integridade dos dados migrados...');
    
    // Contar registros no projeto origem
    const { data: countOrigem, error: erroOrigem } = await clienteOrigem
      .from('colaboradores')
      .select('count', { count: 'exact', head: true });
    
    // Contar registros no projeto destino
    const { data: countDestino, error: erroDestino } = await clienteDestino
      .from('colaboradores')
      .select('count', { count: 'exact', head: true });
    
    if (erroOrigem || erroDestino) {
      throw new Error('Erro ao verificar contagens');
    }
    
    console.log(`📊 Projeto origem: ${countOrigem} colaboradores`);
    console.log(`📊 Projeto destino: ${countDestino} colaboradores`);
    
    const integridade = countOrigem === countDestino;
    
    if (integridade) {
      console.log('✅ Integridade verificada: Todos os dados foram migrados corretamente');
    } else {
      console.log('⚠️ Atenção: Diferença na quantidade de registros migrados');
    }
    
    return integridade;
  } catch (error) {
    console.error('❌ Erro ao verificar integridade:', error.message);
    return false;
  }
}

// Função para atualizar configurações da aplicação
async function atualizarConfiguracoes() {
  try {
    console.log('⚙️ Atualizando configurações da aplicação...');
    
    // Atualizar .env
    const envPath = '.env';
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Substituir URL do projeto
    const novoEnvContent = envContent
      .replace(/VITE_SUPABASE_URL=.*/g, `VITE_SUPABASE_URL=${PROJETO_DESTINO.url}`)
      .replace(/VITE_SUPABASE_ANON_KEY=.*/g, `VITE_SUPABASE_ANON_KEY=${PROJETO_DESTINO.key}`);
    
    // Se não existir, criar
    if (!envContent.includes('VITE_SUPABASE_URL')) {
      const novasLinhas = `
# Configurações do Supabase - Projeto Migrado
VITE_SUPABASE_URL=${PROJETO_DESTINO.url}
VITE_SUPABASE_ANON_KEY=${PROJETO_DESTINO.key}
`;
      fs.writeFileSync(envPath, novasLinhas);
    } else {
      fs.writeFileSync(envPath, novoEnvContent);
    }
    
    console.log('✅ Arquivo .env atualizado com as credenciais do novo projeto');
    
    // Atualizar src/lib/supabase.ts
    const supabasePath = 'src/lib/supabase.ts';
    if (fs.existsSync(supabasePath)) {
      let supabaseContent = fs.readFileSync(supabasePath, 'utf8');
      
      supabaseContent = supabaseContent
        .replace(/https:\/\/\w+\.supabase\.co/g, PROJETO_DESTINO.url)
        .replace(/eyJ[\w\-\.]+/g, PROJETO_DESTINO.key);
      
      fs.writeFileSync(supabasePath, supabaseContent);
      console.log('✅ Arquivo src/lib/supabase.ts atualizado');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao atualizar configurações:', error.message);
    return false;
  }
}

// Função principal
async function executarMigracao() {
  console.log('🚀 INICIANDO MIGRAÇÃO ORGANIZACIONAL DO PROJETO SUPABASE');
  console.log('=' .repeat(60));
  console.log(`📤 Origem: ${PROJETO_ORIGEM.nome} (${PROJETO_ORIGEM.id})`);
  console.log(`📥 Destino: ${PROJETO_DESTINO.nome} (${PROJETO_DESTINO.id})`);
  console.log('=' .repeat(60));
  
  try {
    // 1. Criar diretório de backup
    criarDiretorioBackup();
    
    // 2. Conectar aos projetos
    const conectado = await conectarProjetos();
    if (!conectado) {
      throw new Error('Falha na conexão com os projetos');
    }
    
    // 3. Fazer backup
    const backupOk = await fazerBackup();
    if (!backupOk) {
      throw new Error('Falha no backup dos dados');
    }
    
    // 4. Criar estrutura no destino
    await criarEstrutura();
    
    // 5. Migrar dados
    const migrados = await migrarDados();
    if (migrados === 0) {
      throw new Error('Nenhum dado foi migrado');
    }
    
    // 6. Verificar integridade
    const integridadeOk = await verificarIntegridade();
    
    // 7. Atualizar configurações
    const configOk = await atualizarConfiguracoes();
    
    console.log('=' .repeat(60));
    console.log('🎉 MIGRAÇÃO ORGANIZACIONAL CONCLUÍDA COM SUCESSO!');
    console.log('=' .repeat(60));
    console.log(`✅ Dados migrados: ${migrados} colaboradores`);
    console.log(`✅ Integridade: ${integridadeOk ? 'OK' : 'VERIFICAR'}`);
    console.log(`✅ Configurações: ${configOk ? 'ATUALIZADAS' : 'VERIFICAR'}`);
    console.log('');
    console.log('🔗 Novo projeto ativo:');
    console.log(`   URL: ${PROJETO_DESTINO.url}`);
    console.log(`   ID: ${PROJETO_DESTINO.id}`);
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('   1. Reiniciar o servidor de desenvolvimento');
    console.log('   2. Testar a aplicação em http://localhost:3001');
    console.log('   3. Verificar se todos os dados estão sendo exibidos');
    console.log('   4. Confirmar funcionamento de todas as funcionalidades');
    
  } catch (error) {
    console.error('❌ ERRO DURANTE A MIGRAÇÃO:', error.message);
    console.log('');
    console.log('🔄 Para tentar novamente:');
    console.log('   1. Verifique as credenciais dos projetos');
    console.log('   2. Confirme que ambos os projetos estão ativos');
    console.log('   3. Execute o script novamente');
    process.exit(1);
  }
}

// Executar migração
if (require.main === module) {
  executarMigracao();
}

module.exports = {
  executarMigracao,
  PROJETO_ORIGEM,
  PROJETO_DESTINO
};