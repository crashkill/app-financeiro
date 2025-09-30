const fs = require('fs');
const yaml = require('js-yaml');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class PipelineExecutor {
  constructor(pipelineFile) {
    this.pipeline = yaml.load(fs.readFileSync(pipelineFile, 'utf8'));
    this.context = {
      trigger: {},
      steps: {},
      config: this.pipeline.config,
      error: null
    };
    this.startTime = new Date();
  }

  // Função para resolver expressões template
  resolveTemplate(template, context = this.context) {
    if (typeof template !== 'string') return template;
    
    // Substituir variáveis simples como {{trigger.fileUrl}}
    return template.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      try {
        // Remover espaços e avaliar expressão
        const cleanExpr = expression.trim();
        
        // Funções especiais
        if (cleanExpr === 'now()') {
          return new Date().toISOString();
        }
        if (cleanExpr === 'uuid()') {
          return uuidv4();
        }
        
        // Verificar se é uma expressão com pipe (|)
        if (cleanExpr.includes('|')) {
          return this.evaluatePipeExpression(cleanExpr, context);
        }
        
        // Resolver caminhos de propriedades
        const value = this.getNestedProperty(context, cleanExpr);
        return value !== undefined ? value : match;
      } catch (error) {
        console.warn(`Erro ao resolver template ${match}:`, error.message);
        return match;
      }
    });
  }

  // Função para avaliar expressões com pipe
  evaluatePipeExpression(expression, context) {
    const parts = expression.split('|').map(p => p.trim());
    let value = parts[0];
    
    // Resolver valor inicial
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1); // Remover aspas
    } else if (value === 'now()') {
      value = new Date().toISOString();
    } else {
      value = this.getNestedProperty(context, value) || value;
    }
    
    // Aplicar funções pipe
    for (let i = 1; i < parts.length; i++) {
      const func = parts[i].trim();
      
      if (func.startsWith('test(')) {
        // Extrair regex da função test
        const regexMatch = func.match(/test\("([^"]+)"\)/);
        if (regexMatch) {
          const regex = new RegExp(regexMatch[1]);
          value = regex.test(String(value));
        }
      } else if (func.startsWith('default(')) {
        // Função default
        const defaultMatch = func.match(/default\(([^)]+)\)/);
        if (defaultMatch && (value === undefined || value === null)) {
          value = defaultMatch[1];
        }
      } else if (func === 'strftime("%Y%m%d_%H%M%S")') {
        // Formatação de data
        const date = new Date(value);
        value = date.toISOString().replace(/[-:T]/g, '').substring(0, 15);
      }
    }
    
    return value;
  }

  // Função para acessar propriedades aninhadas
  getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object' && key in current) {
        return current[key];
      }
      return undefined;
    }, obj);
  }

  // Função para definir propriedades aninhadas
  setNestedProperty(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  // Executar step de transformação
  async executeTransformStep(step) {
    console.log(`🔄 Executando transformação: ${step.name}`);
    
    try {
      let expression = step.inputs.expression;
      
      // Se for uma string multi-linha, processar linha por linha
      if (typeof expression === 'string' && expression.includes('\n')) {
        // Processar expressão JSON com templates
        expression = this.processJsonExpression(expression);
      } else {
        expression = this.resolveTemplate(expression);
      }
      
      // Avaliar expressão JSON
      let result;
      try {
        result = JSON.parse(expression);
      } catch (parseError) {
        // Se não for JSON válido, tentar avaliar como JavaScript simples
        result = eval(`(${expression})`);
      }
      
      this.context.steps[step.id] = result;
      console.log(`✅ Transformação concluída:`, result);
      return { success: true, result };
    } catch (error) {
      console.error(`❌ Erro na transformação ${step.id}:`, error.message);
      throw error;
    }
  }

  // Processar expressão JSON com templates
  processJsonExpression(expression) {
    console.log('🔍 Processando expressão JSON:', expression);
    
    // Primeiro, processar templates {{}}
    let processed = this.resolveTemplate(expression);
    
    // Depois, processar expressões pipe em valores JSON
    processed = this.processJsonPipeExpressions(processed);
    
    // Por último, processar funções standalone como uuid()
    processed = this.processStandaloneFunctions(processed);
    
    console.log('✅ Resultado final:', processed);
    return processed;
  }

  // Processar funções standalone como uuid(), now()
  processStandaloneFunctions(jsonStr) {
    // Substituir uuid() por um UUID real
    jsonStr = jsonStr.replace(/uuid\(\)/g, () => {
      return `"${this.generateUUID()}"`;
    });
    
    // Substituir now() standalone por timestamp
    jsonStr = jsonStr.replace(/now\(\)/g, () => {
      return `"${new Date().toISOString()}"`;
    });
    
    return jsonStr;
  }

  // Gerar UUID simples
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Processar expressões pipe em valores JSON
  processJsonPipeExpressions(jsonStr) {
    // Regex para encontrar valores com pipe: "valor" | função OU função() | função
    const pipeRegex = /("([^"]+)"|([a-zA-Z_][a-zA-Z0-9_]*\(\)))\s*\|\s*([^,}\n]+)/g;
    
    return jsonStr.replace(pipeRegex, (match, fullValue, quotedValue, functionValue, pipeExpr) => {
      try {
        let baseValue;
        if (quotedValue) {
          baseValue = `"${quotedValue}"`;
        } else if (functionValue) {
          baseValue = functionValue;
        } else {
          baseValue = fullValue;
        }
        
        // Processar a expressão pipe
        const result = this.evaluatePipeExpression(`${baseValue} | ${pipeExpr}`, this.context);
        
        // Retornar o valor processado com aspas se for string, sem aspas se for boolean/number
        if (typeof result === 'string') {
          return `"${result}"`;
        } else {
          return String(result);
        }
      } catch (error) {
        console.warn(`Erro ao processar pipe "${match}":`, error.message);
        return match;
      }
    });
  }

  // Executar step HTTP
  async executeHttpStep(step) {
    console.log(`🌐 Executando requisição HTTP: ${step.name}`);
    
    try {
      const config = {
        method: this.resolveTemplate(step.inputs.method),
        url: this.resolveTemplate(step.inputs.url),
        headers: {},
        timeout: (step.timeout || 30) * 1000
      };

      // Resolver headers
      if (step.inputs.headers) {
        for (const [key, value] of Object.entries(step.inputs.headers)) {
          config.headers[key] = this.resolveTemplate(value);
        }
      }

      // Resolver body
      if (step.inputs.body) {
        config.data = {};
        for (const [key, value] of Object.entries(step.inputs.body)) {
          config.data[key] = this.resolveTemplate(value);
        }
      }

      console.log(`📤 ${config.method} ${config.url}`);
      
      const response = await axios(config);
      
      const result = {
        status: response.status,
        headers: response.headers,
        body: response.data
      };

      this.context.steps[step.id] = { response: result };
      console.log(`✅ Requisição HTTP concluída: ${response.status}`);
      return { success: true, result };
    } catch (error) {
      console.error(`❌ Erro na requisição HTTP ${step.id}:`, error.message);
      if (step.on_error?.action === 'continue') {
        console.log(`⚠️ Continuando execução apesar do erro`);
        this.context.steps[step.id] = { error: error.message };
        return { success: false, continued: true };
      }
      throw error;
    }
  }

  // Executar step de delay
  async executeDelayStep(step) {
    const seconds = this.resolveTemplate(step.inputs.seconds);
    const message = this.resolveTemplate(step.inputs.message);
    
    console.log(`⏳ ${message} (${seconds}s)`);
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
    
    this.context.steps[step.id] = { delayed: seconds };
    return { success: true };
  }

  // Executar step de log
  async executeLogStep(step) {
    const level = step.inputs.level || 'info';
    const message = this.resolveTemplate(step.inputs.message);
    
    console.log(`📝 [${level.toUpperCase()}] ${message}`);
    
    this.context.steps[step.id] = { logged: true, level, message };
    return { success: true };
  }

  // Verificar condições
  checkConditions(step) {
    if (!step.conditions) return true;
    
    for (const condition of step.conditions) {
      const conditionExpr = this.resolveTemplate(condition.if);
      
      // Avaliar condição simples
      try {
        const result = eval(conditionExpr);
        if (result) {
          if (condition.then.action === 'fail') {
            throw new Error(this.resolveTemplate(condition.then.message));
          }
        }
      } catch (error) {
        throw error;
      }
    }
    
    return true;
  }

  // Executar um step individual
  async executeStep(step) {
    console.log(`\n🚀 Executando Step ${step.id}: ${step.name}`);
    
    try {
      // Verificar condições
      this.checkConditions(step);
      
      let result;
      switch (step.type) {
        case 'transform':
          result = await this.executeTransformStep(step);
          break;
        case 'http':
          result = await this.executeHttpStep(step);
          break;
        case 'delay':
          result = await this.executeDelayStep(step);
          break;
        case 'log':
          result = await this.executeLogStep(step);
          break;
        default:
          throw new Error(`Tipo de step não suportado: ${step.type}`);
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Erro no step ${step.id}:`, error.message);
      
      if (step.on_error?.action === 'retry' && step.retry) {
        console.log(`🔄 Tentando novamente...`);
        // Implementar retry se necessário
      }
      
      throw error;
    }
  }

  // Executar pipeline completo
  async execute(triggerData) {
    console.log(`\n🎯 Iniciando Pipeline: ${this.pipeline.name}`);
    console.log(`📝 Descrição: ${this.pipeline.description}`);
    console.log(`🔢 Versão: ${this.pipeline.version}\n`);
    
    // Definir dados do trigger
    this.context.trigger = triggerData;
    
    try {
      // Executar todos os steps
      for (const step of this.pipeline.steps) {
        await this.executeStep(step);
      }
      
      // Gerar outputs
      const outputs = {};
      if (this.pipeline.outputs) {
        for (const output of this.pipeline.outputs) {
          outputs[output.id] = this.resolveTemplate(output.value);
        }
      }
      
      const duration = new Date() - this.startTime;
      console.log(`\n🎉 Pipeline concluído com sucesso em ${duration}ms!`);
      console.log(`📊 Outputs:`, JSON.stringify(outputs, null, 2));
      
      return {
        success: true,
        duration,
        outputs,
        context: this.context
      };
      
    } catch (error) {
      console.error(`\n💥 Pipeline falhou:`, error.message);
      
      // Executar tratamento de erro
      if (this.pipeline.on_error) {
        console.log(`🔧 Executando tratamento de erro...`);
        this.context.error = {
          message: error.message,
          step: 'unknown'
        };
        
        for (const errorStep of this.pipeline.on_error) {
          try {
            await this.executeStep(errorStep);
          } catch (errorHandlingError) {
            console.error(`❌ Erro no tratamento de erro:`, errorHandlingError.message);
          }
        }
      }
      
      throw error;
    }
  }
}

// Função principal para executar o pipeline
async function executePipeline(triggerData) {
  const pipelineFile = __dirname + '/FLUXO.yaml';
  const executor = new PipelineExecutor(pipelineFile);
  
  try {
    const result = await executor.execute(triggerData);
    return result;
  } catch (error) {
    console.error('Falha na execução do pipeline:', error.message);
    throw error;
  }
}

// Exportar para uso em outros módulos
module.exports = { PipelineExecutor, executePipeline };

// Se executado diretamente, usar dados de teste
if (require.main === module) {
  const testData = {
    fileUrl: "https://example.com/test-dre.xlsx",
    fileName: "test-dre.xlsx",
    forceReprocess: false
  };
  
  console.log('🧪 Executando pipeline com dados de teste...');
  executePipeline(testData)
    .then(result => {
      console.log('\n✅ Teste concluído:', result.success);
    })
    .catch(error => {
      console.error('\n❌ Teste falhou:', error.message);
      process.exit(1);
    });
}