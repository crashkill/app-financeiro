  constructor() {
    this.executionId = `exec_${Date.now()}`;
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

    console.log(`🚀 INICIANDO EXECUÇÃO DO FLUXO DRE - ${this.executionId}`);
    console.log(`📅 Data/Hora: ${this.startTime.toLocaleString('pt-BR')}`);
    console.log(`🔗 Supabase URL: ${supabaseUrl}`);
    console.log(`⚡ Modo: Com métricas de performance\n`);
  }

  startTiming(stepName) {
    this.stepTimings[stepName] = {
      start: Date.now(),
      end: null,
      duration: null
    };
    console.log(`⏱️ [${stepName}] Iniciado em ${new Date().toLocaleTimeString('pt-BR')}`);
  }

  endTiming(stepName) {
    if (this.stepTimings[stepName]) {
      this.stepTimings[stepName].end = Date.now();
      this.stepTimings[stepName].duration = this.stepTimings[stepName].end - this.stepTimings[stepName].start;
      const durationSec = (this.stepTimings[stepName].duration / 1000).toFixed(2);
      console.log(`✅ [${stepName}] Concluído em ${durationSec}s`);
    }
  }
