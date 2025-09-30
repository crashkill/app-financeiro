import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ExcelParser } from "../process-file-upload/parsers/excel-parser.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Função para enviar notificação por email
async function sendNotification(data: {
  fileName: string;
  recordsProcessed?: number;
  executionTime?: number;
  success: boolean;
  errorMessage?: string;
}) {
  try {
    const notificationUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-notification`;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    const emailData = {
      to: "fabricio.lima@globalhitss.com.br",
      ...data
    };

    const response = await fetch(notificationUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      console.error("Erro ao enviar notificação:", await response.text());
    } else {
      console.log("Notificação enviada com sucesso");
    }
  } catch (error) {
    console.error("Erro ao enviar notificação:", error);
  }
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const parser = new ExcelParser();

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();
  let fileName = "";
  
  try {
    const { record } = await req.json();

    if (!record || !record.bucket_id || !record.name) {
      return new Response(JSON.stringify({ error: "Payload inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { bucket_id: bucket, name: filePath } = record;
    fileName = filePath;

    if (bucket !== "dre_reports") {
      return new Response(
        JSON.stringify({ message: "Ignorando arquivo fora do bucket dre_reports" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(filePath);

    if (downloadError) {
      throw new Error(`Erro ao baixar o arquivo: ${downloadError.message}`);
    }

    const fileBuffer = new Uint8Array(await fileData.arrayBuffer());
    const parsedData = await parser.parse(fileBuffer, {
      uploadType: "dre",
      fileName: filePath,
    });

    if (!parsedData || parsedData.length === 0) {
      return new Response(
        JSON.stringify({ message: "Nenhum dado para inserir." }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { error: insertError } = await supabase
      .from("dre_hitss")
      .insert(parsedData);

    if (insertError) {
      throw new Error(`Erro ao inserir dados: ${insertError.message}`);
    }

    const executionTime = Date.now() - startTime;
    
    // Enviar notificação de sucesso
    await sendNotification({
      fileName: filePath,
      recordsProcessed: parsedData.length,
      executionTime,
      success: true
    });

    return new Response(
      JSON.stringify({
        message: `Arquivo ${filePath} processado com sucesso. ${parsedData.length} registros inseridos.`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    // Enviar notificação de erro
    await sendNotification({
      fileName: fileName || "Arquivo desconhecido",
      executionTime,
      success: false,
      errorMessage: error.message
    });
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});