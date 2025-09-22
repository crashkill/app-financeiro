import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.bold}[${step}]${colors.reset} ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

async function validateDREData() {
  log('📊 VALIDANDO DADOS DA TABELA DRE_HITSS', 'bold');
  log('='.repeat(50));
  
  try {
    // 1. Verificar estrutura da tabela
    logStep('1/8', 'Verificando estrutura da tabela dre_hitss...');
    
    try {
      const { data: tableInfo, error: tableError } = await supabase
        .from('dre_hitss')
        .select('*')
        .limit(1);
      
      if (tableError) {
        logError(`Erro ao acessar tabela: ${tableError.message}`);
        throw tableError;
      }
      
      logSuccess('Tabela dre_hitss acessível');
      
      if (tableInfo && tableInfo.length > 0) {
        const columns = Object.keys(tableInfo[0]);
        log(`   📋 Colunas encontradas (${columns.length}):`);
        columns.forEach(col => {
          log(`     • ${col}`);
        });
      }
      
    } catch (error) {
      logError(`Erro ao verificar estrutura: ${error.message}`);
      throw error;
    }
    
    // 2. Contar total de registros
    logStep('2/8', 'Contando registros na tabela...');
    
    try {
      const { count, error: countError } = await supabase
        .from('dre_hitss')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        logWarning(`Erro ao contar registros: ${countError.message}`);
      } else {
        logSuccess(`Total de registros: ${count}`);
        
        if (count === 0) {
          logWarning('Tabela está vazia - nenhum dado foi inserido ainda');
        } else if (count < 10) {
          logWarning(`Poucos registros encontrados (${count}) - pode indicar problema no processamento`);
        } else {
          logSuccess(`Quantidade adequada de registros (${count})`);
        }
      }
    } catch (error) {
      logWarning(`Erro ao contar registros: ${error.message}`);
    }
    
    // 3. Verificar registros mais recentes
    logStep('3/8', 'Analisando registros mais recentes...');
    
    try {
      const { data: recentData, error: recentError } = await supabase
        .from('dre_hitss')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (recentError) {
        logWarning(`Erro ao buscar registros recentes: ${recentError.message}`);
      } else if (recentData && recentData.length > 0) {
        logSuccess(`${recentData.length} registro(s) recente(s) encontrado(s)`);
        
        // Mostrar os 3 mais recentes
        recentData.slice(0, 3).forEach((record, index) => {
          log(`\n   Registro ${index + 1} (mais recente):`);
          log(`     • ID: ${record.id}`);
          log(`     • Código: ${record.codigo || 'N/A'}`);
          log(`     • Descrição: ${record.descricao || 'N/A'}`);
          log(`     • Valor: ${record.valor ? formatCurrency(record.valor) : 'N/A'}`);
          log(`     • Tipo: ${record.tipo || 'N/A'}`);
          log(`     • Criado: ${new Date(record.created_at).toLocaleString()}`);
          
          if (record.arquivo_origem) {
            log(`     • Arquivo origem: ${record.arquivo_origem}`);
          }
          
          if (record.execution_id) {
            log(`     • ID execução: ${record.execution_id}`);
          }
        });
        
        // Verificar se há registros muito antigos ou muito novos
        const oldestRecord = recentData[recentData.length - 1];
        const newestRecord = recentData[0];
        
        const now = new Date();
        const newestAge = now - new Date(newestRecord.created_at);
        const oldestAge = now - new Date(oldestRecord.created_at);
        
        log(`\n   📅 Análise temporal:`);
        log(`     • Registro mais novo: ${Math.round(newestAge / (1000 * 60))} minutos atrás`);
        log(`     • Registro mais antigo (dos 10): ${Math.round(oldestAge / (1000 * 60 * 60 * 24))} dias atrás`);
        
      } else {
        logWarning('Nenhum registro recente encontrado');
      }
    } catch (error) {
      logWarning(`Erro ao analisar registros recentes: ${error.message}`);
    }
    
    // 4. Validar integridade dos dados
    logStep('4/8', 'Validando integridade dos dados...');
    
    try {
      // Verificar registros com dados obrigatórios nulos
      const { data: nullData, error: nullError } = await supabase
        .from('dre_hitss')
        .select('id, codigo, descricao, valor, tipo')
        .or('codigo.is.null,descricao.is.null,valor.is.null,tipo.is.null')
        .limit(5);
      
      if (nullError) {
        logWarning(`Erro ao verificar dados nulos: ${nullError.message}`);
      } else if (nullData && nullData.length > 0) {
        logWarning(`${nullData.length} registro(s) com dados obrigatórios nulos encontrado(s)`);
        
        nullData.forEach((record, index) => {
          log(`\n   Registro ${index + 1} com problema:`);
          log(`     • ID: ${record.id}`);
          log(`     • Código: ${record.codigo || '❌ NULO'}`);
          log(`     • Descrição: ${record.descricao || '❌ NULO'}`);
          log(`     • Valor: ${record.valor !== null ? formatCurrency(record.valor) : '❌ NULO'}`);
          log(`     • Tipo: ${record.tipo || '❌ NULO'}`);
        });
      } else {
        logSuccess('Todos os registros possuem dados obrigatórios preenchidos');
      }
      
      // Verificar valores zerados
      const { count: zeroCount, error: zeroError } = await supabase
        .from('dre_hitss')
        .select('*', { count: 'exact', head: true })
        .eq('valor', 0);
      
      if (zeroError) {
        logWarning(`Erro ao verificar valores zerados: ${zeroError.message}`);
      } else {
        if (zeroCount > 0) {
          logWarning(`${zeroCount} registro(s) com valor zero encontrado(s)`);
        } else {
          logSuccess('Nenhum registro com valor zero encontrado');
        }
      }
      
    } catch (error) {
      logWarning(`Erro na validação de integridade: ${error.message}`);
    }
    
    // 5. Analisar distribuição por tipo
    logStep('5/8', 'Analisando distribuição por tipo...');
    
    try {
      const { data: typeData, error: typeError } = await supabase
        .from('dre_hitss')
        .select('tipo')
        .not('tipo', 'is', null);
      
      if (typeError) {
        logWarning(`Erro ao analisar tipos: ${typeError.message}`);
      } else if (typeData && typeData.length > 0) {
        const typeCounts = {};
        typeData.forEach(record => {
          const tipo = record.tipo;
          typeCounts[tipo] = (typeCounts[tipo] || 0) + 1;
        });
        
        logSuccess(`Distribuição por tipo (${Object.keys(typeCounts).length} tipos):`);
        Object.entries(typeCounts)
          .sort(([,a], [,b]) => b - a)
          .forEach(([tipo, count]) => {
            const percentage = ((count / typeData.length) * 100).toFixed(1);
            log(`     • ${tipo}: ${count} registros (${percentage}%)`);
          });
        
        // Verificar se há tipos esperados
        const expectedTypes = ['Receita', 'Custo', 'Despesa', 'Resultado'];
        const foundTypes = Object.keys(typeCounts);
        const missingTypes = expectedTypes.filter(type => !foundTypes.includes(type));
        
        if (missingTypes.length > 0) {
          logWarning(`Tipos esperados não encontrados: ${missingTypes.join(', ')}`);
        } else {
          logSuccess('Todos os tipos esperados estão presentes');
        }
      }
    } catch (error) {
      logWarning(`Erro na análise de tipos: ${error.message}`);
    }
    
    // 6. Calcular resumo financeiro
    logStep('6/8', 'Calculando resumo financeiro...');
    
    try {
      const { data: financialData, error: financialError } = await supabase
        .from('dre_hitss')
        .select('valor, tipo')
        .not('valor', 'is', null)
        .not('tipo', 'is', null);
      
      if (financialError) {
        logWarning(`Erro ao calcular resumo: ${financialError.message}`);
      } else if (financialData && financialData.length > 0) {
        const summary = {
          totalReceitas: 0,
          totalCustos: 0,
          totalDespesas: 0,
          totalResultados: 0,
          outros: 0
        };
        
        financialData.forEach(record => {
          const valor = parseFloat(record.valor) || 0;
          const tipo = record.tipo.toLowerCase();
          
          if (tipo.includes('receita')) {
            summary.totalReceitas += valor;
          } else if (tipo.includes('custo')) {
            summary.totalCustos += valor;
          } else if (tipo.includes('despesa')) {
            summary.totalDespesas += valor;
          } else if (tipo.includes('resultado')) {
            summary.totalResultados += valor;
          } else {
            summary.outros += valor;
          }
        });
        
        logSuccess('Resumo financeiro calculado:');
        log(`     💰 Total Receitas: ${formatCurrency(summary.totalReceitas)}`);
        log(`     💸 Total Custos: ${formatCurrency(summary.totalCustos)}`);
        log(`     📉 Total Despesas: ${formatCurrency(summary.totalDespesas)}`);
        log(`     📊 Total Resultados: ${formatCurrency(summary.totalResultados)}`);
        
        if (summary.outros !== 0) {
          log(`     ❓ Outros: ${formatCurrency(summary.outros)}`);
        }
        
        const resultadoLiquido = summary.totalReceitas + summary.totalCustos + summary.totalDespesas;
        log(`\n     🎯 Resultado Líquido Calculado: ${formatCurrency(resultadoLiquido)}`);
        
        // Validações básicas
        if (summary.totalReceitas <= 0) {
          logWarning('Nenhuma receita encontrada ou valores negativos');
        }
        
        if (summary.totalCustos >= 0) {
          logWarning('Custos deveriam ser negativos');
        }
        
        if (summary.totalDespesas >= 0) {
          logWarning('Despesas deveriam ser negativas');
        }
      }
    } catch (error) {
      logWarning(`Erro no cálculo financeiro: ${error.message}`);
    }
    
    // 7. Verificar duplicatas
    logStep('7/8', 'Verificando registros duplicados...');
    
    try {
      const { data: duplicateData, error: duplicateError } = await supabase
        .rpc('check_dre_duplicates'); // Função personalizada se existir
      
      if (duplicateError && !duplicateError.message.includes('function')) {
        logWarning(`Erro ao verificar duplicatas: ${duplicateError.message}`);
      } else {
        // Verificação manual de duplicatas
        const { data: allData, error: allError } = await supabase
          .from('dre_hitss')
          .select('codigo, descricao, valor, arquivo_origem')
          .not('codigo', 'is', null);
        
        if (allError) {
          logWarning(`Erro ao buscar dados para verificação: ${allError.message}`);
        } else if (allData && allData.length > 0) {
          const seen = new Set();
          const duplicates = [];
          
          allData.forEach(record => {
            const key = `${record.codigo}-${record.descricao}-${record.valor}-${record.arquivo_origem}`;
            if (seen.has(key)) {
              duplicates.push(record);
            } else {
              seen.add(key);
            }
          });
          
          if (duplicates.length > 0) {
            logWarning(`${duplicates.length} possível(is) duplicata(s) encontrada(s)`);
            duplicates.slice(0, 3).forEach((dup, index) => {
              log(`\n   Duplicata ${index + 1}:`);
              log(`     • Código: ${dup.codigo}`);
              log(`     • Descrição: ${dup.descricao}`);
              log(`     • Valor: ${formatCurrency(dup.valor)}`);
              log(`     • Arquivo: ${dup.arquivo_origem}`);
            });
          } else {
            logSuccess('Nenhuma duplicata óbvia encontrada');
          }
        }
      }
    } catch (error) {
      logWarning(`Erro na verificação de duplicatas: ${error.message}`);
    }
    
    // 8. Verificar consistência temporal
    logStep('8/8', 'Verificando consistência temporal...');
    
    try {
      const { data: temporalData, error: temporalError } = await supabase
        .from('dre_hitss')
        .select('created_at, arquivo_origem, execution_id')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (temporalError) {
        logWarning(`Erro ao verificar dados temporais: ${temporalError.message}`);
      } else if (temporalData && temporalData.length > 0) {
        // Agrupar por arquivo de origem
        const fileGroups = {};
        temporalData.forEach(record => {
          const file = record.arquivo_origem || 'unknown';
          if (!fileGroups[file]) {
            fileGroups[file] = [];
          }
          fileGroups[file].push(record);
        });
        
        logSuccess(`Dados agrupados por ${Object.keys(fileGroups).length} arquivo(s) de origem:`);
        
        Object.entries(fileGroups)
          .sort(([,a], [,b]) => b.length - a.length)
          .slice(0, 5)
          .forEach(([file, records]) => {
            const firstRecord = new Date(records[records.length - 1].created_at);
            const lastRecord = new Date(records[0].created_at);
            const duration = lastRecord - firstRecord;
            
            log(`\n     📁 ${file}:`);
            log(`       • Registros: ${records.length}`);
            log(`       • Primeiro: ${firstRecord.toLocaleString()}`);
            log(`       • Último: ${lastRecord.toLocaleString()}`);
            log(`       • Duração do processamento: ${Math.round(duration / 1000)}s`);
            
            if (records[0].execution_id) {
              log(`       • ID execução: ${records[0].execution_id}`);
            }
          });
        
        // Verificar se há inserções muito antigas
        const oldestRecord = temporalData[temporalData.length - 1];
        const oldestAge = Date.now() - new Date(oldestRecord.created_at);
        const daysOld = Math.round(oldestAge / (1000 * 60 * 60 * 24));
        
        if (daysOld > 30) {
          logWarning(`Registro mais antigo tem ${daysOld} dias - considere arquivar dados antigos`);
        } else {
          logSuccess(`Dados estão dentro do período esperado (${daysOld} dias)`);
        }
      }
    } catch (error) {
      logWarning(`Erro na verificação temporal: ${error.message}`);
    }
    
    log('\n' + '='.repeat(50));
    logSuccess('VALIDAÇÃO DE DADOS DRE_HITSS CONCLUÍDA');
    
    // Resumo final
    log('\n📊 RESUMO DA VALIDAÇÃO:', 'bold');
    log('   ✅ Estrutura da tabela verificada');
    log('   ✅ Contagem de registros realizada');
    log('   ✅ Registros recentes analisados');
    log('   ✅ Integridade dos dados validada');
    log('   ✅ Distribuição por tipo analisada');
    log('   ✅ Resumo financeiro calculado');
    log('   ✅ Verificação de duplicatas realizada');
    log('   ✅ Consistência temporal verificada');
    
    log('\n💡 RECOMENDAÇÕES:', 'cyan');
    log('   1. Monitore regularmente a qualidade dos dados');
    log('   2. Configure alertas para valores anômalos');
    log('   3. Implemente validações adicionais no processamento');
    log('   4. Considere arquivamento de dados antigos');
    log('   5. Mantenha backup regular da tabela');
    
  } catch (error) {
    log('\n' + '='.repeat(50));
    logError(`VALIDAÇÃO FALHOU: ${error.message}`);
    
    // Sugestões de troubleshooting
    log('\n🔧 SUGESTÕES DE TROUBLESHOOTING:', 'yellow');
    log('   1. Verifique se a tabela dre_hitss existe');
    log('   2. Confirme as permissões de acesso à tabela');
    log('   3. Verifique as políticas RLS da tabela');
    log('   4. Confirme a estrutura da tabela no Dashboard');
    log('   5. Verifique se há dados na tabela');
    log('   6. Teste a conectividade com o Supabase');
    
    process.exit(1);
  }
}

// Executar validação
validateDREData().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});