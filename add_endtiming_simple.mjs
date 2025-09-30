// Script simples para adicionar endTiming ao step2
import fs from 'fs';

const filePath = 'C:\\Users\\fabricio.lima\\OneDrive - HITSS DO BRASIL SERVIÇOS TECNOLOGICOS LTDA\\Área de Trabalho - Antiga\\Projetos React\\app-financeiro\\scripts\\extract_dre.js';

try {
  console.log('📖 Lendo arquivo...');
  let content = fs.readFileSync(filePath, 'utf8');

  // Substituir o return true por endTiming + return true
  content = content.replace(
    `console.log(\`📅 Período: \${processedData.periodo}\` );\n\n      return true;`,
    `console.log(\`📅 Período: \${processedData.periodo}\` );\n\n      this.endTiming('DOWNLOAD_HITSS');\n      return true;`
  );

  // Substituir o return false no catch
  content = content.replace(
    `console.log(\`❌ Erro no download: \${error.message}\` );\n      return false;`,
    `console.log(\`❌ Erro no download: \${error.message}\` );\n      this.endTiming('DOWNLOAD_HITSS');\n      return false;`
  );

  console.log('💾 Salvando arquivo com endTiming...');
  fs.writeFileSync(filePath, content, 'utf8');

  console.log('✅ endTiming adicionado com sucesso!');
  console.log('⏱️ Agora o step2_DownloadHITSSFile tem métricas completas');

} catch (error) {
  console.error('❌ Erro:', error.message);
}
