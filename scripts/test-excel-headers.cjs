const XLSX = require('xlsx');
const fs = require('fs');

const FILE_PATH = 'C:\\Users\\fabricio.lima\\OneDrive - HITSS DO BRASIL SERVIÇOS TECNOLOGICOS LTDA\\Área de Trabalho - Antiga\\Projetos React\\app-financeiro\\scripts\\dre_hitss_1758504595588.xlsx';

console.log('=== Testando cabeçalhos do arquivo Excel ===');

try {
  // Ler o arquivo Excel
  const workbook = XLSX.readFile(FILE_PATH);
  
  // Obter a primeira planilha
  const sheetName = workbook.SheetNames[0];
  console.log('Nome da planilha:', sheetName);
  
  const worksheet = workbook.Sheets[sheetName];
  
  // Converter para JSON com cabeçalho
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1,
    defval: '',
    raw: false
  });
  
  if (jsonData.length === 0) {
    console.log('❌ Arquivo vazio');
    process.exit(1);
  }
  
  // Mostrar cabeçalhos
  const headers = jsonData[0];
  console.log('\n=== Cabeçalhos encontrados ===');
  headers.forEach((header, index) => {
    console.log(`${index}: "${header}"`);
  });
  
  console.log('\n=== Cabeçalhos normalizados ===');
  headers.forEach((header, index) => {
    const normalized = header.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    console.log(`${index}: "${header}" -> "${normalized}"`);
  });
  
  // Mostrar algumas linhas de dados
  console.log('\n=== Primeiras 3 linhas de dados ===');
  for (let i = 1; i <= Math.min(4, jsonData.length - 1); i++) {
    console.log(`\nLinha ${i}:`);
    const row = jsonData[i];
    headers.forEach((header, index) => {
      console.log(`  ${header}: "${row[index] || ''}"`);  
    });
  }
  
  console.log(`\n=== Total de registros: ${jsonData.length - 1} ===`);
  
} catch (error) {
  console.error('❌ Erro:', error.message);
}