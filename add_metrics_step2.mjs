// Script para adicionar métricas ao step2_DownloadHITSSFile
import fs from 'fs';

const filePath = 'C:\\Users\\fabricio.lima\\OneDrive - HITSS DO BRASIL SERVIÇOS TECNOLOGICOS LTDA\\Área de Trabalho - Antiga\\Projetos React\\app-financeiro\\scripts\\extract_dre.js';

try {
  console.log('📖 Lendo arquivo...');
  let content = fs.readFileSync(filePath, 'utf8');

  // Adicionar startTiming ao início do step2_DownloadHITSSFile
  const step2StartPattern = /async step2_DownloadHITSSFile\(\) \{([\s\S]*?)console\.log\('\\n📋 ETAPA 2: Download do arquivo HITSS'\);/;
  const step2StartReplacement = `async step2_DownloadHITSSFile() {
    this.startTiming('DOWNLOAD_HITSS');
    console.log('\\n📋 ETAPA 2: Download do arquivo HITSS');
    await this.log('DOWNLOAD_HITSS', 'INICIADO', 'Baixando arquivo de dados da HITSS');`;

  content = content.replace(step2StartPattern, step2StartReplacement);

  // Adicionar endTiming ao final do método step2_DownloadHITSSFile
  const step2EndPattern = /console\.log\(`✅ Download concluído: \${fileName}` \);([\s\S]*?)return true;([\s\S]*?)}\s*async step3_UploadToStorage/;
  const step2EndReplacement = `console.log(\`✅ Download concluído: \${fileName}\` );
      console.log(\`📊 Registros baixados: \${processedData.registros.length}\` );
      console.log(\`🏢 Empresa: \${processedData.empresa}\` );
      console.log(\`📅 Período: \${processedData.periodo}\` );

      this.endTiming('DOWNLOAD_HITSS');
      return true;
    } catch (error) {
      await this.log('DOWNLOAD_HITSS', 'ERRO', error.message);
      console.log(\`❌ Erro no download: \${error.message}\`);

      this.endTiming('DOWNLOAD_HITSS');
      return false;
    }
  }

  async step3_UploadToStorage() {`;

  content = content.replace(step2EndPattern, step2EndReplacement);

  console.log('💾 Salvando arquivo com métricas...');
  fs.writeFileSync(filePath, content, 'utf8');

  console.log('✅ Métricas adicionadas ao step2_DownloadHITSSFile!');
  console.log('⏱️ Download agora será cronometrado');

} catch (error) {
  console.error('❌ Erro ao modificar arquivo:', error.message);
}
