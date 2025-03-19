import Dexie, { Table } from 'dexie'

export interface Transacao {
  id?: number
  tipo: 'receita' | 'despesa'
  natureza: 'RECEITA' | 'CUSTO'
  descricao: string
  valor: number
  data: string
  categoria: string
  observacao?: string
  lancamento: number
  projeto?: string
  periodo: string // Formato: "M/YYYY"
  denominacaoConta?: string
  contaResumo?: string // Adicionado para identificar Desoneração da Folha
}

export interface Profissional {
  id?: number
  nome: string
  cargo: string
  projeto: string
  custo: number
  tipo: string
}

type TransacaoModifications = Partial<Transacao>;
type ProfissionalModifications = Partial<Profissional>;

export class AppDatabase extends Dexie {
  transacoes!: Table<Transacao>
  profissionais!: Table<Profissional>

  constructor() {
    super('FinanceiroDB')
    this.version(7).stores({
      transacoes: '++id, tipo, natureza, [projeto+periodo], [descricao+periodo], periodo, projeto, descricao, contaResumo',
      profissionais: '++id, nome, cargo, projeto, tipo'
    })

    // Adiciona hooks para normalização de dados
    this.transacoes.hook('creating', (primKey, obj) => {
      // Normaliza o valor para número
      obj.valor = converterParaNumero(obj.valor)
      
      // Garante que projeto e descricao não sejam undefined
      obj.projeto = obj.projeto || obj.descricao || 'Sem Projeto'
      obj.descricao = obj.descricao || obj.projeto || 'Sem Descrição'
      
      // Normaliza o período para o formato correto (M/YYYY)
      if (obj.periodo) {
        const [mes, ano] = obj.periodo.split('/')
        obj.periodo = `${parseInt(mes)}/${ano}`
      }
    })

    this.transacoes.hook('updating', (modifications: TransacaoModifications, primKey, obj) => {
      if (modifications.valor !== undefined) {
        modifications.valor = converterParaNumero(modifications.valor)
      }
      if (modifications.periodo) {
        const [mes, ano] = modifications.periodo.split('/')
        modifications.periodo = `${parseInt(mes)}/${ano}`
      }
    })

    this.profissionais.hook('creating', (primKey, obj) => {
      // Normaliza o valor do custo para número
      obj.custo = converterParaNumero(obj.custo)
      
      // Garante que projeto não seja undefined
      obj.projeto = obj.projeto || 'Sem Projeto'
    })

    this.profissionais.hook('updating', (modifications: ProfissionalModifications, primKey, obj) => {
      if (modifications.custo !== undefined) {
        modifications.custo = converterParaNumero(modifications.custo)
      }
    })
  }
}

export const db = new AppDatabase()

// Função auxiliar para converter valor para número
function converterParaNumero(valor: any): number {
  if (typeof valor === 'number') {
    return valor
  }
  if (typeof valor === 'string') {
    // Remove caracteres não numéricos, exceto ponto e vírgula
    const valorLimpo = valor.replace(/[^\d,.]/g, '')
    // Substitui vírgula por ponto
    const valorPonto = valorLimpo.replace(',', '.')
    // Converte para número
    return parseFloat(valorPonto) || 0
  }
  return 0
}

// Função para importar dados
export async function importarDados(dados: any[]) {
  return db.transaction('rw', db.transacoes, async () => {
    try {
      // Limpa a tabela atual
      await db.transacoes.clear()
      
      // Log para depuração
      console.log('Dados originais do arquivo Excel:', dados.slice(0, 2));
      
      // Prepara os dados para importação
      const dadosFormatados = dados.map(item => {
        // Processamento do período
        let periodoFormatado = 'Sem Periodo';
        
        if (item.periodo) {
          try {
            // Tenta processar o período em diferentes formatos
            let mes, ano;
            
            if (typeof item.periodo === 'string' && item.periodo.includes('/')) {
              // Formato esperado: "M/YYYY"
              [mes, ano] = item.periodo.split('/');
              periodoFormatado = `${parseInt(mes) || 1}/${ano || new Date().getFullYear()}`;
            } else if (typeof item.periodo === 'string' && item.periodo.includes('-')) {
              // Formato alternativo: "MM-YYYY"
              [mes, ano] = item.periodo.split('-');
              periodoFormatado = `${parseInt(mes) || 1}/${ano || new Date().getFullYear()}`;
            } else if (item.mes && item.ano) {
              // Campos separados
              periodoFormatado = `${parseInt(item.mes) || 1}/${item.ano || new Date().getFullYear()}`;
            } else if (typeof item.periodo === 'string') {
              // Tentar extrair mês e ano de uma data completa
              const dataParts = item.periodo.split(/[\/\-\.]/);
              if (dataParts.length >= 2) {
                // Assumindo formatos comuns como DD/MM/YYYY ou MM/DD/YYYY
                periodoFormatado = `${parseInt(dataParts[1]) || 1}/${dataParts[2] || new Date().getFullYear()}`;
              } else {
                // Fallback: mês atual / ano atual
                const hoje = new Date();
                periodoFormatado = `${hoje.getMonth() + 1}/${hoje.getFullYear()}`;
              }
            } else {
              // Fallback: mês atual / ano atual
              const hoje = new Date();
              periodoFormatado = `${hoje.getMonth() + 1}/${hoje.getFullYear()}`;
            }
          } catch (e) {
            console.error('Erro ao processar período:', e, item);
            const hoje = new Date();
            periodoFormatado = `${hoje.getMonth() + 1}/${hoje.getFullYear()}`;
          }
        } else if (item.data) {
          // Tenta extrair período da data
          try {
            const data = new Date(item.data);
            if (!isNaN(data.getTime())) {
              periodoFormatado = `${data.getMonth() + 1}/${data.getFullYear()}`;
            } else {
              const hoje = new Date();
              periodoFormatado = `${hoje.getMonth() + 1}/${hoje.getFullYear()}`;
            }
          } catch (e) {
            console.error('Erro ao extrair período da data:', e);
            const hoje = new Date();
            periodoFormatado = `${hoje.getMonth() + 1}/${hoje.getFullYear()}`;
          }
        }
        
        // Determina o tipo com base nos campos disponíveis
        let tipo = 'despesa';
        if (item.tipo && typeof item.tipo === 'string') {
          tipo = item.tipo.toLowerCase().includes('receita') ? 'receita' : 'despesa';
        } else if (item.natureza && typeof item.natureza === 'string') {
          tipo = item.natureza.toUpperCase().includes('RECEITA') ? 'receita' : 'despesa';
        } else if (item.contaResumo && typeof item.contaResumo === 'string' && 
                  item.contaResumo.toLowerCase().includes('receita')) {
          tipo = 'receita';
        } else if (item.valor && parseFloat(String(item.valor)) > 0) {
          tipo = 'receita'; // Assume que valor positivo é receita
        }
        
        // Determina a natureza
        let natureza = tipo === 'receita' ? 'RECEITA' : 'CUSTO';
        if (item.natureza && typeof item.natureza === 'string') {
          natureza = item.natureza.toUpperCase();
        }

        // Processa o valor
        const valor = converterParaNumero(item.valor || 0);
        
        // Determina o projeto e descrição
        const projeto = item.projeto || item.descricao || 'Sem Projeto';
        const descricao = item.descricao || item.projeto || 'Sem Descrição';
        
        // Mapeia contaResumo para os valores esperados pelo sistema
        // Este é um ponto crítico para a visualização correta nos menus
        let contaResumo = '';
        
        // Primeiro tenta usar o contaResumo do arquivo
        if (item.contaResumo) {
          contaResumo = item.contaResumo.toString().toUpperCase().trim();
          
          // Normalizar valores comuns para compatibilidade
          if (contaResumo.includes('RECEITA') || contaResumo.includes('DEVENGADA')) {
            contaResumo = 'RECEITA DEVENGADA';
          } else if (contaResumo.includes('DESON') && contaResumo.includes('FOLHA')) {
            contaResumo = 'DESONERAÇÃO DA FOLHA';
          } else if (contaResumo.includes('CLT')) {
            contaResumo = 'CLT';
          } else if (contaResumo.includes('SUBCONT')) {
            contaResumo = 'SUBCONTRATADOS';
          } else if (tipo === 'despesa') {
            // Categoriza outros custos
            contaResumo = 'OUTROS';
          }
        } 
        // Se não houver contaResumo, tenta inferir dos outros campos
        else {
          if (tipo === 'receita') {
            contaResumo = 'RECEITA DEVENGADA';
          } else if (item.denominacaoConta && item.denominacaoConta.toString().toUpperCase().includes('DESON')) {
            contaResumo = 'DESONERAÇÃO DA FOLHA';
          } else if (descricao.toUpperCase().includes('CLT') || 
                    (item.categoria && item.categoria.toString().toUpperCase().includes('CLT'))) {
            contaResumo = 'CLT';
          } else if (descricao.toUpperCase().includes('SUBCONT') || 
                     (item.categoria && item.categoria.toString().toUpperCase().includes('SUBCONT'))) {
            contaResumo = 'SUBCONTRATADOS';
          } else {
            contaResumo = 'OUTROS';
          }
        }
        
        // Cria o objeto de transação garantindo todos os campos obrigatórios
        return {
          tipo: tipo as 'receita' | 'despesa',
          natureza: natureza as 'RECEITA' | 'CUSTO',
          descricao: descricao,
          valor: valor,
          data: item.data || new Date().toISOString().split('T')[0],
          categoria: item.categoria || contaResumo,
          observacao: item.observacao || '',
          lancamento: item.lancamento || Date.now(),
          projeto: projeto,
          periodo: periodoFormatado,
          denominacaoConta: item.denominacaoConta || descricao,
          contaResumo: contaResumo
        };
      });
      
      // Log para debug dos dados formatados
      console.log('Primeiros registros formatados para importação:', dadosFormatados.slice(0, 2));
      console.log('Unique contaResumo values:', [...new Set(dadosFormatados.map(d => d.contaResumo))]);
      console.log('Unique projeto values:', [...new Set(dadosFormatados.map(d => d.projeto))]);
      console.log('Unique periodo values:', [...new Set(dadosFormatados.map(d => d.periodo))]);
      
      // Importa os dados
      const result = await db.transacoes.bulkAdd(dadosFormatados, { allKeys: true });
      return { count: dadosFormatados.length, keys: result };
    } catch (error) {
      console.error('Erro na transação de importação:', error);
      throw new Error(`Erro ao importar dados: ${error.message || 'Erro desconhecido'}`);
    }
  });
}

// Função para importar profissionais
export async function importarProfissionais(dados: any[]) {
  return db.transaction('rw', db.profissionais, async () => {
    // Limpa a tabela atual
    await db.profissionais.clear()
    
    // Prepara os dados para importação
    const dadosFormatados = dados.map(item => ({
      ...item,
      custo: converterParaNumero(item.custo),
      projeto: item.projeto || 'Sem Projeto'
    }))
    
    // Importa os dados
    await db.profissionais.bulkAdd(dadosFormatados)
  })
}
