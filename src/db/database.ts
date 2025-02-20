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
    // Limpa a tabela atual
    await db.transacoes.clear()
    
    // Prepara os dados para importação
    const dadosFormatados = dados.map(item => {
      const [mes, ano] = item.periodo.split('/')
      return {
        ...item,
        valor: converterParaNumero(item.valor),
        periodo: `${parseInt(mes)}/${ano}`,
        projeto: item.projeto || item.descricao || 'Sem Projeto',
        descricao: item.descricao || item.projeto || 'Sem Descrição'
      }
    })
    
    // Importa os dados
    await db.transacoes.bulkAdd(dadosFormatados)
  })
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
