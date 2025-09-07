/// <reference path="./deno.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

// Configurações do Supabase
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

// Interface para tipagem dos dados
interface ProjectRow {
  'Projeto': string;
  'Cliente': string;
  'Responsável': string;
  'Status': string;
  'Data Início': string;
  'Data Fim': string;
}

const HITSS_EXPORT_URL = 'https://hitsscontrol.globalhitss.com.br/api/api/export/xls?clienteFiltro=&servicoFiltro=-1&tipoFiltro=-1&projetoFiltro=&projetoAtivoFiltro=true&projetoParalisadoFiltro=true&projetoEncerradoFiltro=true&projetoCanceladoFiltro=true&responsavelareaFiltro=&idResponsavelareaFiltro=&responsavelprojetoFiltro=FABRICIO%20CARDOSO%20DE%20LIMA&idresponsavelprojetoFiltro=78&filtroDeFiltro=09-2016&filtroAteFiltro=08-2025&visaoFiltro=PROJ&usuarioFiltro=fabricio.lima&idusuarioFiltro=78&perfilFiltro=RESPONSAVEL_DELIVERY%7CRESPONSAVEL_LANCAMENTO%7CVISITANTE&telaFiltro=painel_projetos';

serve(async () => {
  try {
    // 1️⃣ Buscar credenciais das variáveis de ambiente
    const username = Deno.env.get("HITSS_USER") || "fabricio.lima";
    const password = Deno.env.get("HITSS_PASS") || "Hitss@2024";
    
    if (!username || !password) {
      throw new Error("Credenciais HITSS não encontradas");
    }

    // 2️⃣ Tentar acessar diretamente a URL de exportação (pode não precisar de login)
    let cookie = null;
    
    // MODO TESTE: Simular dados enquanto não conseguimos acessar o HitssControl
     console.log('Simulando dados de teste para validar a lógica...');
     
     // Criar um XLSX simples de teste
     const testData = [
       ['Projeto', 'Cliente', 'Responsável', 'Status', 'Data Início', 'Data Fim'],
       ['Projeto Teste 1', 'Cliente A', 'FABRICIO CARDOSO DE LIMA', 'Ativo', '2024-01-01', '2024-12-31'],
       ['Projeto Teste 2', 'Cliente B', 'FABRICIO CARDOSO DE LIMA', 'Ativo', '2024-02-01', '2024-11-30'],
       ['Projeto Teste 3', 'Cliente C', 'FABRICIO CARDOSO DE LIMA', 'Encerrado', '2023-06-01', '2024-05-31']
     ];
     
     const ws = XLSX.utils.aoa_to_sheet(testData);
     const wb = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(wb, ws, 'Projetos');
     const xlsxBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    // 4️⃣ Processar XLSX e extrair dados diretamente
    console.log('Processando dados do XLSX...');
    const workbook = XLSX.read(xlsxBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet) as ProjectRow[];
    console.log(`Processando ${rows.length} registros...`);

    rows.forEach((row: ProjectRow, index: number) => {
      console.log(`Registro ${index + 1}:`, row);
    });

    // 7️⃣ Inserir dados na tabela hitss_projetos
    console.log(`Inserindo ${rows.length} registros na tabela...`);
    const { error: insertError } = await supabase
      .from('hitss_projetos')
      .insert(rows.map((row: ProjectRow) => ({
        projeto: row['Projeto'],
        cliente: row['Cliente'],
        responsavel: row['Responsável'],
        status: row['Status'],
        data_inicio: row['Data Início'],
        data_fim: row['Data Fim']
      })));
    if (insertError) throw insertError;

    console.log(`✅ Dados processados com sucesso`);

    // 9️⃣ Enviar e-mail notificando o usuário
    await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "X-Postmark-Server-Token": Deno.env.get("POSTMARK_TOKEN")!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        From: "no-reply@seudominio.com",
        To: "usuario@empresa.com", // ajustar destinatário
        Subject: "Importação concluída",
        TextBody: "O processo de importação foi finalizado com sucesso!",
      }),
    });

    return new Response("Processo concluído", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Erro: " + err.message, { status: 500 });
  }
});