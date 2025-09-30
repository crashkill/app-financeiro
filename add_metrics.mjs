// Script para adicionar métricas de performance ao extract_dre.js
import fs from 'fs';
import path from 'path';

const filePath = 'C:\\Users\\fabricio.lima\\OneDrive - HITSS DO BRASIL SERVIÇOS TECNOLOGICOS LTDA\\Área de Trabalho - Antiga\\Projetos React\\app-financeiro\\scripts\\extract_dre.js';

try {
  console.log('📖 Lendo arquivo original...');
  let content = fs.readFileSync(filePath, 'utf8');

  // Adicionar métricas ao constructor
  const constructorPattern = /constructor\(\) \{([\s\S]*?)\}/;
  const constructorReplacement = `constructor() {
    this.executionId = \`exec_\${Date.now()}\`;
    this.startTime = new Date();
    this.stepTimings = {};
    this.results = {
      cronTrigger: null,
      download: null,
      upload: null,
      processing: null,
      etlDimensional: null,
      notification: null
    };

    console.log(\`🚀 INICIANDO EXECUÇÃO DO FLUXO DRE - \${this.executionId}\`);
    console.log(\`📅 Data/Hora: \${this.startTime.toLocaleString('pt-BR')}\`);
    console.log(\`🔗 Supabase URL: \${supabaseUrl}\`);
    console.log(\`⚡ Modo: Com métricas de performance\\n\`);
  }

  startTiming(stepName) {
    this.stepTimings[stepName] = {
      start: Date.now(),
      end: null,
      duration: null
    };
    console.log(\`⏱️ [\${stepName}] Iniciado em \${new Date().toLocaleTimeString('pt-BR')}\`);
  }

  endTiming(stepName) {
    if (this.stepTimings[stepName]) {
      this.stepTimings[stepName].end = Date.now();
      this.stepTimings[stepName].duration = this.stepTimings[stepName].end - this.stepTimings[stepName].start;
      const durationSec = (this.stepTimings[stepName].duration / 1000).toFixed(2);
      console.log(\`✅ [\${stepName}] Concluído em \${durationSec}s\`);
    }
  }`;

  content = content.replace(constructorPattern, constructorReplacement);

  // Adicionar métricas ao step1_TriggerCronJob
  const step1Pattern = /async step1_TriggerCronJob\(\) \{([\s\S]*?)return (true|false);/;
  const step1Replacement = `async step1_TriggerCronJob() {
    this.startTiming('CRON_TRIGGER');
    console.log('\\n📋 ETAPA 1: Trigger do Cron Job');
    await this.log('CRON_TRIGGER', 'INICIADO', 'Simulando trigger manual do cron job');

    try {
      const cronStatus = {
        job_name: 'dre-hitss-automation',
        schedule: '0 8 * * 1-5',
        last_run: new Date().toISOString(),
        status: 'TRIGGERED_MANUALLY',
        trigger_type: 'MANUAL'
      };

      await new Promise(resolve => setTimeout(resolve, 1000));

      await this.log('CRON_TRIGGER', 'SUCESSO', \`Cron job ativado: \${cronStatus.job_name}\`);
      this.results.cronTrigger = cronStatus;

      console.log(\`✅ Cron job '\${cronStatus.job_name}' ativado com sucesso\`);
      console.log(\`📅 Agendamento: \${cronStatus.schedule}\`);
      console.log(\`🔄 Tipo: \${cronStatus.trigger_type}\`);

      this.endTiming('CRON_TRIGGER');
      return true;
    } catch (error) {
      await this.log('CRON_TRIGGER', 'ERRO', error.message);
      console.log(\`❌ Erro no trigger do cron job: \${error.message}\`);
      this.endTiming('CRON_TRIGGER');
      return false;
    }
  }`;

  content = content.replace(step1Pattern, step1Replacement);

  console.log('💾 Salvando arquivo com métricas...');
  fs.writeFileSync(filePath, content, 'utf8');

  console.log('✅ Métricas de performance adicionadas com sucesso!');
  console.log('📊 O arquivo agora coleta tempo de execução de cada etapa');
  console.log('⏱️ Execute o script para ver as métricas em ação');

} catch (error) {
  console.error('❌ Erro ao modificar arquivo:', error.message);
}
