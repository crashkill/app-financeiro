import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

// Interfaces para tipagem
interface ExcelRow {
  Relatorio: string;
  Tipo: string;
  Cliente: string;
  LinhaNegocio: string;
  Projeto: string;
  ContaResumo: string;
  DenominacaoConta: string;
  Lancamento: number;
  Periodo: string;
  Natureza: string;
  IdRecurso?: string;
  NomeRecurso?: string;
  [key: string]: any;
}

interface DimensionIds {
  id_projeto: number;
  id_cliente: number;
  id_conta: number;
  id_periodo: number;
  id_recurso: number | null;
}

interface ProcessingStats {
  total_linhas: number;
  linhas_processadas: number;
  linhas_erro: number;
  dimensoes_criadas: {
    projetos: number;
    clientes: number;
    contas: number;
    periodos: number;
    recursos: number;
  };
  tempo_processamento: number;
  erros_detalhados: string[];
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log('Iniciando processamento ETL dimensional dos dados DRE');
    const startTime = Date.now();
    
    // Verificar variáveis de ambiente
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    console.log('Variáveis de ambiente:', {
      supabase_url: supabaseUrl ? 'OK' : 'MISSING',
      supabase_key: supabaseKey ? 'OK' : 'MISSING'
    });
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Processar corpo da requisição de forma segura
    let requestData = null;
    let jsonData: ExcelRow[] = [];
    
    try {
      const body = await req.text();
      console.log('Corpo da requisição recebido:', body.substring(0, 200) + '...');
      
      if (body && body.trim() !== '' && body !== '{}') {
        requestData = JSON.parse(body);
        console.log('Dados da requisição parseados:', {
          hasData: !!requestData?.data,
          dataLength: requestData?.data?.length || 0
        });
        
        if (requestData?.data && Array.isArray(requestData.data)) {
          jsonData = requestData.data;
          console.log(`Usando dados da requisição: ${jsonData.length} registros`);
        }
      }
    } catch (parseError) {
      console.log('Erro ao parsear JSON da requisição:', parseError.message);
      console.log('Continuando com busca na tabela dados_dre...');
    }

    // Se não há dados na requisição, buscar da tabela dre_hitss
    if (jsonData.length === 0) {
      console.log('Buscando dados da tabela dre_hitss...');
      const { data: dadosDre, error: fetchError } = await supabase
        .from('dre_hitss')
        .select('*')
        .order('id', { ascending: true });

      if (fetchError) {
        console.error('Erro ao buscar dados DRE:', fetchError);
        throw new Error(`Erro ao buscar dados DRE: ${fetchError.message}`);
      }

      if (!dadosDre || dadosDre.length === 0) {
        throw new Error('Nenhum dado DRE encontrado para processar');
      }

      console.log(`Dados encontrados na tabela dre_hitss: ${dadosDre.length} registros`);
      console.log('Primeiro registro:', JSON.stringify(dadosDre[0], null, 2));

      // Converter dados para formato ExcelRow
      jsonData = dadosDre.map(row => {
        console.log(`Processando linha: ${row.id}`);
        const converted = {
          Relatorio: 'DRE_HITSS',
          Tipo: 'Mercado',
          Cliente: row.cliente || 'HITSS',
          LinhaNegocio: 'Tecnologia',
          Projeto: row.projeto || 'HITSS_GERAL',
          ContaResumo: row.conta,
          DenominacaoConta: row.conta,
          Lancamento: parseFloat(String(row.valor || 0)),
          Periodo: `${String(row.mes).padStart(2, '0')}/${row.ano}`,
          Natureza: row.natureza || 'RECEITA',
          IdRecurso: null,
          NomeRecurso: null
        };
      console.log('Linha convertida:', JSON.stringify(converted, null, 2));
      return converted;
    });

    const stats: ProcessingStats = {
      total_linhas: jsonData.length,
      linhas_processadas: 0,
      linhas_erro: 0,
      dimensoes_criadas: {
        projetos: 0,
        clientes: 0,
        contas: 0,
        periodos: 0,
        recursos: 0
      },
      tempo_processamento: 0,
      erros_detalhados: []
    };

    // Processar em lotes para melhor performance
    const BATCH_SIZE = 100;
    const batches = [];
    
    for (let i = 0; i < jsonData.length; i += BATCH_SIZE) {
      batches.push(jsonData.slice(i, i + BATCH_SIZE));
    }

    console.log(`Processando ${batches.length} lotes de ${BATCH_SIZE} registros`);

    // Processar cada lote
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`Processando lote ${batchIndex + 1}/${batches.length}`);

      try {
        await processBatch(supabase, batch, 'DRE_HITSS', 'DRE', stats);
      } catch (error) {
        console.error(`Erro no lote ${batchIndex + 1}:`, error);
        stats.linhas_erro += batch.length;
        stats.erros_detalhados.push(`Lote ${batchIndex + 1}: ${error.message}`);
      }
    }

    stats.tempo_processamento = Date.now() - startTime;

    console.log("Processamento ETL concluído:", stats);

    return new Response(
      JSON.stringify({
        success: true,
        message: "ETL dimensional processado com sucesso",
        stats: stats
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Erro no processamento ETL:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.stack
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// Função para processar um lote de dados
async function processBatch(
  supabase: any,
  batch: ExcelRow[],
  relatorioNome: string,
  tipoRelatorio: string,
  stats: ProcessingStats
) {
  const factRecords = [];

  for (const row of batch) {
    try {
      console.log(`Processando linha individual:`, JSON.stringify(row, null, 2));
      
      // Validar dados obrigatórios
      if (!row.Projeto || !row.Cliente || !row.ContaResumo || !row.Periodo) {
        const erro = `Linha com dados obrigatórios faltando: Projeto=${row.Projeto}, Cliente=${row.Cliente}, ContaResumo=${row.ContaResumo}, Periodo=${row.Periodo}`;
        console.warn(erro);
        stats.linhas_erro++;
        stats.erros_detalhados.push(erro);
        continue;
      }

      console.log('Validação básica passou, obtendo IDs das dimensões...');
      
      // Obter IDs das dimensões
      const dimensionIds = await getDimensionIds(supabase, row, stats);
      
      if (!dimensionIds) {
        const erro = `Falha ao obter IDs das dimensões para linha: ${JSON.stringify(row)}`;
        console.error(erro);
        stats.linhas_erro++;
        stats.erros_detalhados.push(erro);
        continue;
      }

      console.log('IDs das dimensões obtidos:', dimensionIds);

      // Preparar registro para tabela fato
      const valorLancamento = typeof row.Lancamento === 'number' ? row.Lancamento : parseFloat(String(row.Lancamento || 0));
      const hashLinha = await generateRowHash(row);

      console.log(`Valor do lançamento: ${valorLancamento}, Hash: ${hashLinha}`);

      factRecords.push({
        id_projeto: dimensionIds.id_projeto,
        id_cliente: dimensionIds.id_cliente,
        id_conta: dimensionIds.id_conta,
        id_periodo: dimensionIds.id_periodo,
        id_recurso: dimensionIds.id_recurso,
        valor_lancamento: valorLancamento,
        relatorio_origem: relatorioNome,
        hash_linha: hashLinha
      });

      stats.linhas_processadas++;
      console.log(`Linha processada com sucesso. Total processadas: ${stats.linhas_processadas}`);

    } catch (error) {
      const erro = `Erro ao processar linha: ${error.message} - Dados: ${JSON.stringify(row)}`;
      console.error(erro);
      stats.linhas_erro++;
      stats.erros_detalhados.push(erro);
    }
  }

  // Inserir registros na tabela fato em lote
  if (factRecords.length > 0) {
    console.log(`Inserindo ${factRecords.length} registros na tabela fato`);
    console.log('Primeiro registro a ser inserido:', JSON.stringify(factRecords[0], null, 2));
    
    const { error } = await supabase
      .from("fact_dre_lancamentos")
      .upsert(factRecords, {
        onConflict: "hash_linha",
        ignoreDuplicates: true
      });

    if (error) {
      console.error("Erro ao inserir na tabela fato:", error);
      throw error;
    }

    console.log(`Inseridos ${factRecords.length} registros na tabela fato`);
  } else {
    console.log('Nenhum registro para inserir na tabela fato');
  }
}

// Função para obter IDs das dimensões
async function getDimensionIds(
  supabase: any,
  row: ExcelRow,
  stats: ProcessingStats
): Promise<DimensionIds | null> {
  try {
    console.log('Iniciando obtenção de IDs das dimensões...');
    
    // 1. Dimensão Projeto
    console.log('Obtendo ID do projeto...');
    const idProjeto = await getOrCreateProjeto(supabase, row, stats);
    console.log(`ID do projeto: ${idProjeto}`);
    
    // 2. Dimensão Cliente
    console.log('Obtendo ID do cliente...');
    const idCliente = await getOrCreateCliente(supabase, row, stats);
    console.log(`ID do cliente: ${idCliente}`);
    
    // 3. Dimensão Conta
    console.log('Obtendo ID da conta...');
    const idConta = await getOrCreateConta(supabase, row, stats);
    console.log(`ID da conta: ${idConta}`);
    
    // 4. Dimensão Período
    console.log('Obtendo ID do período...');
    const idPeriodo = await getOrCreatePeriodo(supabase, row, stats);
    console.log(`ID do período: ${idPeriodo}`);
    
    // 5. Dimensão Recurso (opcional)
    console.log('Obtendo ID do recurso...');
    const idRecurso = await getOrCreateRecurso(supabase, row, stats);
    console.log(`ID do recurso: ${idRecurso}`);

    return {
      id_projeto: idProjeto,
      id_cliente: idCliente,
      id_conta: idConta,
      id_periodo: idPeriodo,
      id_recurso: idRecurso
    };

  } catch (error) {
    console.error("Erro ao obter IDs das dimensões:", error);
    return null;
  }
}

// Função para obter ou criar projeto
async function getOrCreateProjeto(supabase: any, row: ExcelRow, stats: ProcessingStats): Promise<number> {
  const codigoProjeto = String(row.Projeto).trim();
  const nomeProjeto = codigoProjeto;
  const tipoNegocio = String(row.Tipo || "Mercado").trim();
  const linhaNegocio = String(row.LinhaNegocio || "").trim();

  console.log(`Buscando projeto: codigo=${codigoProjeto}`);

  // Tentar encontrar projeto existente
  const { data: existingProject, error: searchError } = await supabase
    .from("dim_projeto")
    .select("id_projeto")
    .eq("codigo_projeto", codigoProjeto)
    .single();

  if (searchError && searchError.code !== 'PGRST116') {
    console.error("Erro ao buscar projeto existente:", searchError);
    throw searchError;
  }

  if (existingProject) {
    console.log(`Projeto existente encontrado: id=${existingProject.id_projeto}`);
    return existingProject.id_projeto;
  }

  console.log('Projeto não encontrado, criando novo...');

  // Criar novo projeto
  const { data: newProject, error } = await supabase
    .from("dim_projeto")
    .insert({
      codigo_projeto: codigoProjeto,
      nome_projeto: nomeProjeto,
      tipo_negocio: tipoNegocio,
      linha_negocio: linhaNegocio || null
    })
    .select("id_projeto")
    .single();

  if (error) {
    console.error("Erro ao criar projeto:", error);
    throw error;
  }

  console.log(`Novo projeto criado: id=${newProject.id_projeto}`);
  stats.dimensoes_criadas.projetos++;
  return newProject.id_projeto;
}

// Função para obter ou criar cliente
async function getOrCreateCliente(supabase: any, row: ExcelRow, stats: ProcessingStats): Promise<number> {
  const nomeCliente = String(row.Cliente).trim();
  const tipoCliente = String(row.Tipo || "Mercado").trim();

  // Tentar encontrar cliente existente
  const { data: existingClient } = await supabase
    .from("dim_cliente")
    .select("id_cliente")
    .eq("nome_cliente", nomeCliente)
    .single();

  if (existingClient) {
    return existingClient.id_cliente;
  }

  // Criar novo cliente
  const { data: newClient, error } = await supabase
    .from("dim_cliente")
    .insert({
      nome_cliente: nomeCliente,
      tipo_cliente: tipoCliente
    })
    .select("id_cliente")
    .single();

  if (error) {
    console.error("Erro ao criar cliente:", error);
    throw error;
  }

  stats.dimensoes_criadas.clientes++;
  return newClient.id_cliente;
}

// Função para obter ou criar conta
async function getOrCreateConta(supabase: any, row: ExcelRow, stats: ProcessingStats): Promise<number> {
  const contaResumo = String(row.ContaResumo).trim();
  const denominacaoConta = String(row.DenominacaoConta || "").trim();
  const natureza = String(row.Natureza || "CUSTO").trim().toUpperCase();

  console.log(`Buscando conta: conta_resumo=${contaResumo}, denominacao_conta=${denominacaoConta}, natureza=${natureza}`);

  // Tentar encontrar conta existente - buscar apenas por conta_resumo e denominacao_conta
  const { data: existingAccount, error: searchError } = await supabase
    .from("dim_conta")
    .select("id_conta")
    .eq("conta_resumo", contaResumo)
    .eq("denominacao_conta", denominacaoConta)
    .single();

  if (searchError && searchError.code !== 'PGRST116') {
    console.error("Erro ao buscar conta existente:", searchError);
    throw searchError;
  }

  if (existingAccount) {
    console.log(`Conta existente encontrada: id=${existingAccount.id_conta}`);
    return existingAccount.id_conta;
  }

  console.log('Conta não encontrada, criando nova...');

  // Criar nova conta
  const { data: newAccount, error } = await supabase
    .from("dim_conta")
    .insert({
      conta_resumo: contaResumo,
      denominacao_conta: denominacaoConta,
      natureza: natureza
    })
    .select("id_conta")
    .single();

  if (error) {
    console.error("Erro ao criar conta:", error);
    throw error;
  }

  console.log(`Nova conta criada: id=${newAccount.id_conta}`);
  stats.dimensoes_criadas.contas++;
  return newAccount.id_conta;
}

// Função para obter ou criar período
async function getOrCreatePeriodo(supabase: any, row: ExcelRow, stats: ProcessingStats): Promise<number> {
  const periodoOriginal = String(row.Periodo).trim();

  // Tentar encontrar período existente
  const { data: existingPeriod } = await supabase
    .from("dim_periodo")
    .select("id_periodo")
    .eq("periodo_original", periodoOriginal)
    .single();

  if (existingPeriod) {
    return existingPeriod.id_periodo;
  }

  // Parsear período (formato: MM/YYYY)
  const [mes, ano] = periodoOriginal.split("/").map(Number);
  
  if (!mes || !ano || mes < 1 || mes > 12) {
    throw new Error(`Período inválido: ${periodoOriginal}`);
  }

  const trimestre = Math.ceil(mes / 3);
  const semestre = mes <= 6 ? 1 : 2;
  const nomesMeses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const dataInicio = new Date(ano, mes - 1, 1);
  const dataFim = new Date(ano, mes, 0);

  // Criar novo período
  const { data: newPeriod, error } = await supabase
    .from("dim_periodo")
    .insert({
      periodo_original: periodoOriginal,
      ano: ano,
      mes: mes,
      trimestre: trimestre,
      semestre: semestre,
      nome_mes: nomesMeses[mes - 1],
      nome_trimestre: `T${trimestre}`,
      data_inicio: dataInicio.toISOString().split('T')[0],
      data_fim: dataFim.toISOString().split('T')[0]
    })
    .select("id_periodo")
    .single();

  if (error) {
    console.error("Erro ao criar período:", error);
    throw error;
  }

  stats.dimensoes_criadas.periodos++;
  return newPeriod.id_periodo;
}

// Função para obter ou criar recurso
async function getOrCreateRecurso(supabase: any, row: ExcelRow, stats: ProcessingStats): Promise<number | null> {
  const idRecursoOriginal = row.IdRecurso ? String(row.IdRecurso).trim() : null;
  const nomeRecurso = row.NomeRecurso ? String(row.NomeRecurso).trim() : null;

  // Se não há informação de recurso, retornar o recurso padrão "NÃO IDENTIFICADO"
  if (!idRecursoOriginal && !nomeRecurso) {
    const { data: defaultResource } = await supabase
      .from("dim_recurso")
      .select("id_recurso")
      .eq("nome_recurso", "NÃO IDENTIFICADO")
      .single();
    
    if (defaultResource) {
      return defaultResource.id_recurso;
    }

    // Criar recurso padrão se não existir
    const { data: newDefaultResource, error } = await supabase
      .from("dim_recurso")
      .insert({
        nome_recurso: "NÃO IDENTIFICADO",
        tipo_recurso: "Outros"
      })
      .select("id_recurso")
      .single();

    if (error) {
      console.error("Erro ao criar recurso padrão:", error);
      return null;
    }

    stats.dimensoes_criadas.recursos++;
    return newDefaultResource.id_recurso;
  }

  // Tentar encontrar recurso existente
  let query = supabase.from("dim_recurso").select("id_recurso");
  
  if (nomeRecurso) {
    query = query.eq("nome_recurso", nomeRecurso);
  }

  const { data: existingResource } = await query.single();

  if (existingResource) {
    return existingResource.id_recurso;
  }

  // Determinar tipo de recurso
  let tipoRecurso = "Outros";
  if (nomeRecurso && nomeRecurso.toLowerCase().includes("subcontrat")) {
    tipoRecurso = "Subcontratado";
  } else if (idRecursoOriginal) {
    tipoRecurso = "CLT";
  }

  // Criar novo recurso
  const { data: newResource, error } = await supabase
    .from("dim_recurso")
    .insert({
      nome_recurso: nomeRecurso || "NÃO IDENTIFICADO",
      tipo_recurso: tipoRecurso
    })
    .select("id_recurso")
    .single();

  if (error) {
    console.error("Erro ao criar recurso:", error);
    return null;
  }

  stats.dimensoes_criadas.recursos++;
  return newResource.id_recurso;
}

// Função para gerar hash da linha
async function generateRowHash(row: ExcelRow): Promise<string> {
  const hashData = {
    projeto: row.Projeto,
    cliente: row.Cliente,
    conta_resumo: row.ContaResumo,
    denominacao_conta: row.DenominacaoConta,
    periodo: row.Periodo,
    lancamento: row.Lancamento,
    id_recurso: row.IdRecurso || "",
    nome_recurso: row.NomeRecurso || ""
  };

  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(hashData));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  
  return hashHex.substring(0, 32); // Primeiros 32 caracteres
}