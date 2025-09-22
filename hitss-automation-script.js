const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const https = require('https');

require('dotenv').config();

// Desabilitar verificação SSL para conexões HTTPS
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Agente HTTPS para ignorar certificados SSL
const agent = new https.Agent({
  rejectUnauthorized: false
});

// Função para buscar segredos do Vault
async function getVaultSecret(name) {
  try {
    const { data, error } = await supabase.rpc('get_secret', { secret_name: name });
    
    if (error) {
      throw new Error(`Erro ao buscar segredo ${name}: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error(`❌ Erro ao buscar segredo ${name}:`, error.message);
    throw error;
  }
}

// Função para fazer download do arquivo XLSX da HITSS
async function downloadHitssFile() {
  try {
    console.log('🔐 Buscando credenciais do Vault...');
    
    // Buscar credenciais do Vault
    const username = await getVaultSecret('hitss_username');
    const password = await getVaultSecret('hitss_password');
    const baseUrl = await getVaultSecret('hitss_base_url');
    
    if (!username || !password || !baseUrl) {
      throw new Error('Credenciais não encontradas no Vault');
    }
    
    console.log('✅ Credenciais obtidas do Vault com sucesso');
    
    // Construir URL de download com parâmetros corretos
    const params = new URLSearchParams({
      clienteFiltro: '',
      servicoFiltro: '-1',
      tipoFiltro: '-1',
      projetoFiltro: '',
      projetoAtivoFiltro: 'true',
      projetoParalisadoFiltro: 'true',
      projetoEncerradoFiltro: 'true',
      projetoCanceladoFiltro: 'true',
      responsavelareaFiltro: '',
      idResponsavelareaFiltro: '',
      responsavelprojetoFiltro: 'FABRICIO CARDOSO DE LIMA',
      idresponsavelprojetoFiltro: '78',
      filtroDeFiltro: '09-2016',
      filtroAteFiltro: '08-2025',
      visaoFiltro: 'PROJ',
      usuarioFiltro: 'fabricio.lima',
      idusuarioFiltro: '78',
      perfilFiltro: 'RESPONSAVEL_DELIVERY|RESPONSAVEL_LANCAMENTO|VISITANTE',
      telaFiltro: 'painel_projetos'
    });
    const downloadUrl = `${baseUrl}/api/api/export/xls?${params.toString()}`;
    
    console.log('📥 Iniciando download do arquivo XLSX...');
    
    // Fazer autenticação e download
    const authString = Buffer.from(`${username}:${password}`).toString('base64');
    
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,*/*'
      },
      agent: agent
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const filePath = path.join(__dirname, 'hitss-data.xlsx');
    
    fs.writeFileSync(filePath, Buffer.from(buffer));
    console.log(`✅ Arquivo baixado: ${filePath}`);
    
    return filePath;
    
  } catch (error) {
    console.error('❌ Erro no download:', error.message);
    throw error;
  }
}

// Função para processar arquivo XLSX
function processXlsxFile(filePath) {
  try {
    console.log('📊 Processando arquivo XLSX...');
    
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Converter para JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    console.log(`📋 ${jsonData.length} registros encontrados`);
    
    return jsonData;
    
  } catch (error) {
    console.error('❌ Erro ao processar XLSX:', error.message);
    throw error;
  }
}

// Função para converter dados para formato DRE
function convertToDreFormat(hitssData) {
  const { v4: uuidv4 } = require('uuid');
  const uploadBatchId = uuidv4();
  const dreData = [];
  
  console.log('🔄 Convertendo dados para formato DRE...');
  
  hitssData.forEach((row, index) => {
    try {
      // Verificar se a linha tem dados válidos
      if (!row.Lancamento || !row.Periodo || !row.Natureza) {
        return; // Pular linhas sem dados essenciais
      }
      
      const valor = parseFloat(row.Lancamento) || 0;
      
      if (valor !== 0) {
        // Extrair ano e mês do período (formato: "6/2019")
        const periodoMatch = row.Periodo.match(/(\d+)\/(\d+)/);
        if (!periodoMatch) {
          console.warn(`⚠️ Formato de período inválido na linha ${index}: ${row.Periodo}`);
          return;
        }
        
        const mes = parseInt(periodoMatch[1]);
        const ano = parseInt(periodoMatch[2]);
        
        // Criar data no formato correto
        const dataFormatada = `${mes}/${ano}`;
        
        dreData.push({
          upload_batch_id: uploadBatchId,
          file_name: `hitss_auto_${new Date().toISOString().split('T')[0]}.xlsx`,
          tipo: row.Natureza === 'Receita' ? 'receita' : 'despesa',
          natureza: row.Natureza || 'RECEITA',
          descricao: row.DenominacaoConta || row.ContaResumo || `Item ${index}`,
          valor: valor.toString(),
          data: dataFormatada,
          categoria: row.LinhaNegocio || 'Não especificado',
          observacao: `Importado da HITSS - Cliente: ${row.Cliente || 'N/A'}`,
          lancamento: valor.toString(),
          projeto: row.Projeto || row.CodigoProjeto || 'Geral',
          periodo: row.Periodo,
          denominacao_conta: row.DenominacaoConta || row.ContaResumo || '',
          conta_resumo: row.ContaResumo || '',
          linha_negocio: row.LinhaNegocio || 'Não especificado',
          relatorio: row.Relatorio || 'Realizado',
          raw_data: JSON.stringify(row)
        });
      }
      
    } catch (error) {
      console.warn(`⚠️ Erro ao processar linha ${index}:`, error.message);
    }
  });
  
  console.log(`✅ ${dreData.length} registros convertidos para formato DRE`);
  return dreData;
}

// Função para inserir dados na tabela dre_hitss
async function insertIntoDreHitss(dreData) {
  try {
    console.log('💾 Inserindo dados na tabela dre_hitss...');
    
    // Inserir em lotes de 100 registros
    const batchSize = 100;
    let totalInserted = 0;
    
    for (let i = 0; i < dreData.length; i += batchSize) {
      const batch = dreData.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('dre_hitss')
        .insert(batch);
      
      if (error) {
        console.error(`❌ Erro ao inserir lote ${Math.floor(i/batchSize) + 1}:`, error);
        throw error;
      }
      
      totalInserted += batch.length;
      console.log(`✅ Lote ${Math.floor(i/batchSize) + 1} inserido: ${batch.length} registros`);
    }
    
    console.log(`🎉 Total inserido: ${totalInserted} registros`);
    return totalInserted;
    
  } catch (error) {
    console.error('❌ Erro na inserção:', error.message);
    throw error;
  }
}

// Função principal de automação
async function hitssAutomation() {
  try {
    console.log('🤖 Iniciando automação HITSS...');
    console.log('📅 Data/Hora:', new Date().toLocaleString('pt-BR'));
    
    // 1. Download do arquivo
    const filePath = await downloadHitssFile();
    
    // 2. Processar arquivo XLSX
    const hitssData = processXlsxFile(filePath);
    
    // 3. Converter para formato DRE
    const dreData = convertToDreFormat(hitssData);
    
    // 4. Inserir na tabela dre_hitss
    const insertedCount = await insertIntoDreHitss(dreData);
    
    // 5. Verificar inserção
    const { count, error } = await supabase
      .from('dre_hitss')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Erro ao verificar inserção:', error);
    } else {
      console.log(`📊 Total de registros na tabela: ${count}`);
    }
    
    // 6. Limpar arquivo temporário
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('🗑️ Arquivo temporário removido');
    }
    
    console.log('✅ Automação concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na automação:', error.message);
    process.exit(1);
  }
}

// Executar automação
if (require.main === module) {
  hitssAutomation();
}

module.exports = { hitssAutomation, getVaultSecret };