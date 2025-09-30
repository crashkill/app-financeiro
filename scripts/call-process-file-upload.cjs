const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

const SUPABASE_URL = 'https://oomhhhfahdvavnhlbioa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3MDI0NzcsImV4cCI6MjA1MjI3ODQ3N30.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
const FILE_PATH = 'C:\\Users\\fabricio.lima\\OneDrive - HITSS DO BRASIL SERVIÇOS TECNOLOGICOS LTDA\\Área de Trabalho - Antiga\\Projetos React\\app-financeiro\\scripts\\dre_hitss_1758504595588.xlsx';

async function callProcessFileUpload() {
  console.log('=== Chamando Edge Function process-file-upload ===');
  
  try {
    // Verificar se o arquivo existe
    if (!fs.existsSync(FILE_PATH)) {
      throw new Error(`Arquivo não encontrado: ${FILE_PATH}`);
    }
    
    // Ler o arquivo
    const fileBuffer = fs.readFileSync(FILE_PATH);
    console.log(`Arquivo lido: ${fileBuffer.length} bytes`);
    
    // Criar FormData
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: 'dre_hitss_1758504595588.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    formData.append('projectId', 'test-project-id');
    formData.append('uploadType', 'dre');
    
    console.log('Enviando requisição para a Edge Function...');
    
    // Chamar a Edge Function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/process-file-upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    console.log(`Status: ${response.status}`);
    
    const responseText = await response.text();
    console.log('Resposta:', responseText);
    
    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('\n=== Resultado ===');
        console.log('Sucesso:', result.success);
        if (result.data) {
          console.log('Registros processados:', result.data.recordsProcessed);
          console.log('Batch ID:', result.data.batchId);
        }
        if (result.validation) {
          console.log('Validação:', result.validation.isValid ? 'OK' : 'FALHOU');
          if (result.validation.errors?.length > 0) {
            console.log('Erros:', result.validation.errors);
          }
          if (result.validation.warnings?.length > 0) {
            console.log('Avisos:', result.validation.warnings);
          }
        }
      } catch (parseError) {
        console.log('Resposta não é JSON válido:', responseText);
      }
    } else {
      console.error('❌ Erro na requisição');
      try {
        const errorResult = JSON.parse(responseText);
        console.error('Detalhes do erro:', errorResult);
      } catch {
        console.error('Resposta de erro:', responseText);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
  
  console.log('\n=== Processamento concluído ===');
}

callProcessFileUpload();