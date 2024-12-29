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
}

export class AppDatabase extends Dexie {
  transacoes!: Table<Transacao>

  constructor() {
    super('FinanceiroDB')
    this.version(3).stores({
      transacoes: '++id, tipo, natureza, descricao, valor, data, categoria, lancamento, projeto, periodo'
    })
  }
}

export const db = new AppDatabase()

// Função auxiliar para converter valor para número
const converterParaNumero = (valor: any): number => {
  if (typeof valor === 'number') return valor
  if (!valor) return 0

  // Converter para string e limpar
  let str = String(valor)
    .replace(/[^\d,.-]/g, '') // Remove tudo exceto números, vírgula, ponto e hífen
    .trim()

  // Trata formato brasileiro (ex: 1.234,56)
  if (str.includes(',')) {
    // Se tem vírgula, assume formato BR
    str = str.replace(/\./g, '').replace(',', '.')
  }

  const num = parseFloat(str)
  return isNaN(num) ? 0 : num
}

// Função para importar dados
export const importarDados = async (dados: any[]) => {
  try {
    // Filtrar apenas os registros "Realizado"
    const dadosFiltrados = dados.filter(item => {
      const isRealizado = item.Relatorio === 'Realizado'
      const temLancamento = item.Lancamento !== null && item.Lancamento !== undefined && item.Lancamento !== ''
      return isRealizado && temLancamento
    })

    console.log(`Total de registros: ${dados.length}, Registros Realizados válidos: ${dadosFiltrados.length}`)

    // Agrupar por natureza para análise
    const analise = {
      RECEITA: { count: 0, total: 0, exemplos: [] as any[] },
      CUSTO: { count: 0, total: 0, exemplos: [] as any[] }
    }

    // Mapear os dados do Excel para o formato da transação
    const transacoes: Transacao[] = dadosFiltrados.map(item => {
      // Garantir que a natureza seja RECEITA ou CUSTO
      const natureza = String(item.Natureza || '').toUpperCase() === 'RECEITA' ? 'RECEITA' : 'CUSTO'
      
      // Converter o valor do lançamento para número
      const valorFinal = converterParaNumero(item.Lancamento)

      // Análise por natureza
      const grupo = analise[natureza]
      grupo.count++
      grupo.total += valorFinal
      if (grupo.exemplos.length < 5) {
        grupo.exemplos.push({
          lancamentoOriginal: item.Lancamento,
          valorProcessado: valorFinal,
          projeto: item.Projeto,
          cliente: item.Cliente,
          periodo: item.Periodo
        })
      }

      return {
        tipo: natureza === 'RECEITA' ? 'receita' : 'despesa',
        natureza,
        descricao: String(item.Projeto || ''),
        valor: valorFinal,
        data: item.Periodo || new Date().toISOString().split('T')[0],
        categoria: String(item.LinhaNegocio || 'Outros'),
        lancamento: valorFinal, // Mantém o sinal original
        periodo: String(item.Periodo || '')
      }
    })

    // Log de análise
    console.log('Análise dos dados:', {
      RECEITA: {
        count: analise.RECEITA.count,
        total: analise.RECEITA.total,
        exemplos: analise.RECEITA.exemplos
      },
      CUSTO: {
        count: analise.CUSTO.count,
        total: analise.CUSTO.total,
        exemplos: analise.CUSTO.exemplos
      }
    })

    // Limpar tabela existente
    await db.transacoes.clear()

    // Inserir novos dados
    const result = await db.transacoes.bulkAdd(transacoes)

    return {
      count: transacoes.length,
      result
    }
  } catch (error) {
    console.error('Erro ao importar dados:', error)
    throw error
  }
}
