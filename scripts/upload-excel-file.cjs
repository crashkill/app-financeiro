const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configurações do Supabase
const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjUwMjY3MSwiZXhwIjoyMDcyMDc4NjcxfQ.PTWwysas7_MjsOwUlWH7CCy3lEtoMAm9iYRjVWutd8E';

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadExcelFile() {
  try {
    console.log('=== Fazendo upload do arquivo Excel ===');
    
    // Caminho do arquivo Excel
    const filePath = 'C:\\Users\\fabricio.lima\\OneDrive - HITSS DO BRASIL SERVIÇOS TECNOLOGICOS LTDA\\Área de Trabalho - Antiga\\Projetos React\\app-financeiro\\scripts\\dre_hitss_1758504595588.xlsx';
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      throw new Error(`Arquivo não encontrado: ${filePath}`);
    }
    
    // Ler o arquivo
    const fileBuffer = fs.readFileSync(filePath);
    console.log(`Arquivo lido: ${fileBuffer.length} bytes`);
    
    // Nome do arquivo no bucket
    const fileName = `dre_hitss_${Date.now()}.xlsx`;
    
    // Fazer upload para o bucket dre_reports
    const { data, error } = await supabase.storage
      .from('dre_reports')
      .upload(fileName, fileBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: false
      });
    
    if (error) {
      throw new Error(`Erro no upload: ${error.message}`);
    }
    
    console.log(`Upload realizado com sucesso: ${fileName}`);
    console.log('Dados do upload:', data);
    
    // Aguardar um pouco para o trigger processar
    console.log('Aguardando processamento automático...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verificar se os dados foram inseridos
    const { data: records, error: selectError } = await supabase
      .from('dre_hitss')
      .select('id, projeto')
      .limit(10);
    
    if (selectError) {
      console.error('Erro ao verificar dados:', selectError);
    } else {
      console.log(`\n=== Verificação dos dados inseridos ===`);
      console.log(`Total de registros encontrados: ${records.length}`);
      if (records.length > 0) {
        console.log('Exemplos de projetos inseridos:');
        records.forEach((record, index) => {
          console.log(`${index + 1}. "${record.projeto}"`);
        });
      }
    }
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

uploadExcelFile();