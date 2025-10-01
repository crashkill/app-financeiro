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
  cargo: string; // Adicionado para corrigir o erro de build
  tipo: string
  projeto: string
  custo: number
}

type TransacaoModifications = Partial<Transacao>;

export class AppDatabase extends Dexie {
  transacoes!: Table<Transacao>
  profissionais!: Table<Profissional>

  constructor() {
    super('FinanceiroDB')
    this.version(7).stores({
      transacoes: '++id, tipo, natureza, [projeto+periodo], [descricao+periodo], periodo, projeto, descricao, contaResumo',
      profissionais: '++id, nome, tipo, projeto'
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
    // Log dos campos disponíveis no primeiro registro
    if (dados.length > 0) {
      console.log('Campos disponíveis no Excel:', Object.keys(dados[0]));
      console.log('Exemplo de registro completo:', dados[0]);
    }

    // Filtrar apenas os registros "Realizado"
    const dadosFiltrados = dados.filter(item => {
      const isRealizado = item.Relatorio === 'Realizado'
      const temLancamento = item.Lancamento !== null && item.Lancamento !== undefined && item.Lancamento !== ''
      return isRealizado && temLancamento
    })

    // Log para verificar registros de desoneração
    const registrosDesoneracao = dadosFiltrados.filter(item =>
      String(item.ContaResumo || '').toUpperCase().includes('DESONERAÇÃO')
    );
    console.log('Registros com Desoneração (valores originais):', registrosDesoneracao);
    
    // Log para verificar registros de receita devengada
    const registrosReceitaDevengada = dadosFiltrados.filter(item =>
      String(item.ContaResumo || '').toUpperCase().includes('RECEITA DEVENGADA')
    );
    console.log('Registros com Receita Devengada (valores originais):', registrosReceitaDevengada);

    // Mapear os dados do Excel para o formato da transação
    const transacoes: Transacao[] = dadosFiltrados.map(item => {
      // Garantir que a natureza seja RECEITA ou CUSTO
      const natureza = String(item.Natureza || '').toUpperCase() === 'RECEITA' ? 'RECEITA' : 'CUSTO'

      // Converter o valor do lançamento para número
      const valorFinal = converterParaNumero(item.Lancamento)

      // Normalizar contaResumo
      let contaResumo = String(item.ContaResumo || '').toUpperCase().trim()
      
      // Verificar se é receita devengada
      if (contaResumo.includes('RECEITA') && contaResumo.includes('DEVENGADA')) {
        contaResumo = 'RECEITA DEVENGADA'
      }
      // Verificar se é desoneração da folha
      else if (contaResumo.includes('DESONERAÇÃO') || contaResumo.includes('DESONERACAO')) {
        contaResumo = 'DESONERAÇÃO DA FOLHA'
      }
      // Mapear variações conhecidas para os tipos padrão
      else if (contaResumo.includes('CLT')) {
        contaResumo = 'CLT'
      } else if (contaResumo.includes('SUBCONTRATADO') || contaResumo.includes('SUB-CONTRATADO')) {
        contaResumo = 'SUBCONTRATADOS'
      } else if (contaResumo !== 'OUTROS') {
        contaResumo = 'OUTROS'
      }

      // Log detalhado de cada item
      console.log('Processando item:', {
        projeto: item.Projeto,
        denominacaoConta: item.DenominacaoConta,
        contaResumo: item.ContaResumo,
        contaResumoNormalizada: contaResumo,
        categoria: item.LinhaNegocio,
        natureza,
        valorOriginal: item.Lancamento,
        valorConvertido: valorFinal
      })

      const transacao: Transacao = {
        tipo: natureza === 'RECEITA' ? 'receita' : 'despesa',
        natureza,
        descricao: String(item.Projeto || ''),
        valor: valorFinal, // Mantendo o valor original com sinal
        data: item.Periodo || new Date().toISOString().split('T')[0],
        categoria: String(item.LinhaNegocio || 'Outros'),
        lancamento: valorFinal, // Mantendo o valor original com sinal
        periodo: String(item.Periodo || ''),
        denominacaoConta: String(item.DenominacaoConta || ''),
        contaResumo: contaResumo
      };

      // Log da transação final
      if (contaResumo === 'DESONERAÇÃO DA FOLHA' || contaResumo === 'RECEITA DEVENGADA') {
        console.log(`Transação de ${contaResumo} (valor mantido com sinal):`, transacao);
      }

      return transacao;
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

// Função para importar profissionais
export const importarProfissionais = async (dados: any[]) => {
  try {
    // Log dos campos disponíveis no primeiro registro
    if (dados.length > 0) {
      console.log('Campos disponíveis no Excel de Profissionais:', Object.keys(dados[0]));
      console.log('Exemplo de profissional completo:', dados[0]);
    }

    // Mapear os dados do Excel para o formato dos profissionais
    const profissionais: Profissional[] = dados.map(item => {
      // Verificar campos necessários
      const nome = item['Nome do Profissional'] || item.Nome || '';
      if (!nome) {
        throw new Error('Campo "Nome do Profissional" ou "Nome" não encontrado para um dos registros');
      }
      
      const cargo = item['Cargo'] || ''; // Ajuste o nome da coluna 'Cargo' se necessário

      // Normalizar tipo de contratação
      let tipo = String(item['Tipo de Contratação'] || item.Tipo || '').toUpperCase().trim();
      // Se o tipo não for CLT, considera como PJ
      if (tipo !== 'CLT') {
        tipo = 'PJ';
      }

      // Verificar projeto
      const projeto = item.Projeto || '';
      if (!projeto) {
        console.warn(`Profissional ${nome} sem projeto definido`);
      }

      // Converter valor para número
      const custo = converterParaNumero(item['Custo Total'] || item.Custo || 0);

      return {
        nome,
        cargo, // Adicionado campo cargo
        tipo,
        projeto,
        custo
      };
    });

    // Limpar tabela existente
    await db.profissionais.clear();

    // Inserir novos dados
    const result = await db.profissionais.bulkAdd(profissionais);

    return {
      count: profissionais.length,
      result
    };
  } catch (error) {
    console.error('Erro ao importar profissionais:', error);
    throw error;
  }
}
