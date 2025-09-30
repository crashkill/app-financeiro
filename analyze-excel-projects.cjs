const XLSX = require('xlsx');
const path = require('path');

// Caminho para o arquivo Excel
const excelFilePath = path.join(__dirname, 'scripts', 'dre_hitss_1758504595588.xlsx');

console.log('🔍 Analisando arquivo Excel:', excelFilePath);

try {
  // Ler o arquivo Excel
  const workbook = XLSX.readFile(excelFilePath);
  
  // Obter a primeira planilha
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  console.log('📊 Planilha encontrada:', sheetName);
  
  // Converter para JSON
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log('📈 Total de registros no Excel:', data.length);
  
  // Extrair projetos únicos
  const projetos = new Set();
  const projetosDetalhes = [];
  
  data.forEach((row, index) => {
    // Procurar por colunas que possam conter o nome do projeto
    const possibleProjectColumns = [
      'projeto', 'Projeto', 'PROJETO',
      'project', 'Project', 'PROJECT',
      'nome_projeto', 'Nome_Projeto', 'NOME_PROJETO'
    ];
    
    let projetoNome = null;
    
    // Tentar encontrar a coluna do projeto
    for (const col of possibleProjectColumns) {
      if (row[col]) {
        projetoNome = row[col];
        break;
      }
    }
    
    // Se não encontrou nas colunas padrão, procurar em todas as colunas
    if (!projetoNome) {
      const keys = Object.keys(row);
      for (const key of keys) {
        if (key.toLowerCase().includes('projeto') || key.toLowerCase().includes('project')) {
          projetoNome = row[key];
          break;
        }
      }
    }
    
    if (projetoNome && typeof projetoNome === 'string' && projetoNome.trim()) {
      const projeto = projetoNome.trim();
      if (!projetos.has(projeto)) {
        projetos.add(projeto);
        projetosDetalhes.push({
          nome: projeto,
          primeiraOcorrencia: index + 1,
          amostra: row
        });
      }
    }
  });
  
  console.log('\n🎯 RESULTADOS DA ANÁLISE:');
  console.log('=' .repeat(50));
  console.log('📊 Total de registros:', data.length);
  console.log('🏗️  Total de projetos únicos:', projetos.size);
  
  console.log('\n📋 LISTA DE PROJETOS ÚNICOS:');
  console.log('=' .repeat(50));
  
  projetosDetalhes.sort((a, b) => a.nome.localeCompare(b.nome));
  
  projetosDetalhes.forEach((projeto, index) => {
    console.log(`${index + 1}. ${projeto.nome}`);
  });
  
  console.log('\n🔍 ESTRUTURA DOS DADOS (primeira linha):');
  console.log('=' .repeat(50));
  if (data.length > 0) {
    console.log('Colunas disponíveis:');
    Object.keys(data[0]).forEach((key, index) => {
      console.log(`  ${index + 1}. ${key}: ${data[0][key]}`);
    });
  }
  
  console.log('\n📝 AMOSTRA DE DADOS POR PROJETO:');
  console.log('=' .repeat(50));
  
  projetosDetalhes.slice(0, 5).forEach((projeto, index) => {
    console.log(`\n${index + 1}. Projeto: ${projeto.nome}`);
    console.log(`   Primeira ocorrência na linha: ${projeto.primeiraOcorrencia}`);
    console.log(`   Amostra de dados:`, JSON.stringify(projeto.amostra, null, 2));
  });
  
  // Salvar lista de projetos em arquivo
  const fs = require('fs');
  const projetosArray = Array.from(projetos).sort();
  
  const resultado = {
    totalRegistros: data.length,
    totalProjetos: projetos.size,
    projetos: projetosArray,
    detalhes: projetosDetalhes,
    estruturaDados: data.length > 0 ? Object.keys(data[0]) : []
  };
  
  fs.writeFileSync('projetos-excel-analysis.json', JSON.stringify(resultado, null, 2));
  console.log('\n💾 Resultado salvo em: projetos-excel-analysis.json');
  
} catch (error) {
  console.error('❌ Erro ao analisar o arquivo Excel:', error.message);
  console.error('Stack trace:', error.stack);
}