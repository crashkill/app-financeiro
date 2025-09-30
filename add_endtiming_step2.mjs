// Script para adicionar endTiming ao step2_DownloadHITSSFile
import fs from 'fs';

const filePath = 'C:\\Users\\fabricio.lima\\OneDrive - HITSS DO BRASIL SERVIÇOS TECNOLOGICOS LTDA\\Área de Trabalho - Antiga\\Projetos React\\app-financeiro\\scripts\\extract_dre.js';

try {
  console.log('📖 Lendo arquivo...');
  let content = fs.readFileSync(filePath, 'utf8');

  // Adicionar endTiming antes do return true no step2
  const returnTruePattern = /console\.log\(`📅 Período: \${processedData\.periodo}` \);([\s\S]*?)return true;/;
  const returnTrueReplacement = `console.log(\`📅 Período: \${processedData.periodo}\` );

      this.endTiming('DOWNLOAD_HITSS');
      return true;`;

  content = content.replace(returnTruePattern, returnTrueReplacement);

  // Adicionar endTiming no catch do step2
  const catchReturnPattern = /console\.log\(`❌ Erro no download: \${error\.message}` \);([\s\S]*?)return false;/;
  const catchReturnReplacement = `console.log(\`❌ Erro no download: \${error.message}\` );

      this.endTiming('DOWNLOAD_HITSS');
      return false;`;

  content = content.replace(catchReturnPattern, catchReturnReplacement);

  console.log('💾 Salvando arquivo com endTiming...');
  fs.writeFileSync(filePath, content, 'utf8');

  console.log('✅ endTiming adicionado ao step2_DownloadHITSSFile!');
  console.log('⏱️ Download agora será cronometrado completamente');

} catch (error) {
  console.error('❌ Erro ao modificar arquivo:', error.message);
}
