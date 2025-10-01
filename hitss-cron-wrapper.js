#!/usr/bin/env node

/**
 * HITSS Automation Cron Wrapper
 * 
 * Script wrapper para execução da automação HITSS via Cron Job
 * Inclui logging detalhado, tratamento de erros e notificações
 */

const fs = require('fs');
const path = require('path');
const { hitssAutomation } = require('./hitss-automation-script');

// Configuração de logging
const LOG_DIR = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, `hitss-cron-${new Date().toISOString().split('T')[0]}.log`);

// Criar diretório de logs se não existir
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Função de logging com timestamp
 */
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data,
    pid: process.pid
  };
  
  const logLine = JSON.stringify(logEntry) + '\n';
  
  // Log no console
  console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
  if (data) {
    console.log('Data:', JSON.stringify(data, null, 2));
  }
  
  // Log no arquivo
  try {
    fs.appendFileSync(LOG_FILE, logLine);
  } catch (error) {
    console.error('Erro ao escrever no arquivo de log:', error.message);
  }
}

/**
 * Função para enviar notificação de erro (pode ser expandida)
 */
function sendErrorNotification(error, context) {
  log('ERROR', 'Enviando notificação de erro', { error: error.message, context });
  // Aqui você pode implementar notificações via email, Slack, etc.
}

/**
 * Função principal do wrapper
 */
async function runCronJob() {
  const startTime = Date.now();
  const executionId = `cron_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  log('INFO', 'Iniciando execução do Cron Job HITSS', { 
    executionId,
    nodeVersion: process.version,
    platform: process.platform,
    cwd: process.cwd()
  });
  
  try {
    // Verificar se o processo já está rodando
    const pidFile = path.join(__dirname, 'hitss-cron.pid');
    if (fs.existsSync(pidFile)) {
      const existingPid = fs.readFileSync(pidFile, 'utf8').trim();
      log('WARN', 'Processo anterior ainda pode estar rodando', { existingPid });
      
      // Verificar se o processo realmente existe (no Windows)
      try {
        process.kill(existingPid, 0);
        log('ERROR', 'Processo anterior ainda está ativo. Abortando execução.', { existingPid });
        process.exit(1);
      } catch (e) {
        // Processo não existe, remover arquivo PID
        fs.unlinkSync(pidFile);
        log('INFO', 'Arquivo PID órfão removido', { existingPid });
      }
    }
    
    // Criar arquivo PID
    fs.writeFileSync(pidFile, process.pid.toString());
    
    // Executar automação
    log('INFO', 'Executando automação HITSS...');
    await hitssAutomation();
    
    const executionTime = Date.now() - startTime;
    log('SUCCESS', 'Automação concluída com sucesso', { 
      executionId,
      executionTime: `${executionTime}ms`,
      executionTimeFormatted: `${(executionTime / 1000).toFixed(2)}s`
    });
    
    // Remover arquivo PID
    if (fs.existsSync(pidFile)) {
      fs.unlinkSync(pidFile);
    }
    
    process.exit(0);
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    log('ERROR', 'Erro na execução da automação', {
      executionId,
      error: error.message,
      stack: error.stack,
      executionTime: `${executionTime}ms`
    });
    
    // Enviar notificação de erro
    sendErrorNotification(error, { executionId, executionTime });
    
    // Remover arquivo PID
    const pidFile = path.join(__dirname, 'hitss-cron.pid');
    if (fs.existsSync(pidFile)) {
      fs.unlinkSync(pidFile);
    }
    
    process.exit(1);
  }
}

/**
 * Função para limpeza de logs antigos
 */
function cleanupOldLogs() {
  try {
    const files = fs.readdirSync(LOG_DIR);
    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias
    
    files.forEach(file => {
      if (file.startsWith('hitss-cron-') && file.endsWith('.log')) {
        const filePath = path.join(LOG_DIR, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          log('INFO', 'Log antigo removido', { file });
        }
      }
    });
  } catch (error) {
    log('WARN', 'Erro na limpeza de logs antigos', { error: error.message });
  }
}

/**
 * Tratamento de sinais do sistema
 */
process.on('SIGINT', () => {
  log('WARN', 'Recebido SIGINT. Finalizando processo...');
  process.exit(130);
});

process.on('SIGTERM', () => {
  log('WARN', 'Recebido SIGTERM. Finalizando processo...');
  process.exit(143);
});

process.on('uncaughtException', (error) => {
  log('FATAL', 'Exceção não capturada', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log('FATAL', 'Promise rejeitada não tratada', { reason, promise });
  process.exit(1);
});

// Executar limpeza de logs antigos
cleanupOldLogs();

// Executar automação
if (require.main === module) {
  runCronJob();
}

module.exports = { runCronJob, log };