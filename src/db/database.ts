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
}

export class AppDatabase extends Dexie {
  transacoes!: Table<Transacao>

  constructor() {
    super('FinanceiroDB')
    this.version(2).stores({
      transacoes: '++id, tipo, natureza, descricao, valor, data, categoria, lancamento, projeto'
    })
  }
}

export const db = new AppDatabase()

// Função para importar dados
export const importarDados = async (dados: any[]) => {
  try {
    // Mapear os dados do Excel para o formato da transação
    const transacoes: Transacao[] = dados.map(item => ({
      tipo: item.natureza === 'RECEITA' ? 'receita' : 'despesa',
      natureza: item.natureza || 'CUSTO',
      descricao: item.descricao || '',
      valor: typeof item.lancamento === 'number' ? item.lancamento : parseFloat(item.lancamento) || 0,
      data: item.data || new Date().toISOString().split('T')[0],
      categoria: item.categoria || 'Outros',
      observacao: item.observacao || '',
      lancamento: typeof item.lancamento === 'number' ? item.lancamento : parseFloat(item.lancamento) || 0,
      projeto: item.projeto || ''
    }))

    // Inserir todos os dados em uma única transação
    await db.transaction('rw', db.transacoes, async () => {
      await db.transacoes.bulkAdd(transacoes)
    })

    return { success: true, count: transacoes.length }
  } catch (error) {
    console.error('Erro ao importar dados:', error)
    throw error
  }
}
