import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface EmailData {
  to: string;
  subject: string;
  fileName?: string;
  recordsProcessed?: number;
  executionTime?: number;
  success: boolean;
  errorMessage?: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

function generateEmailTemplate(data: EmailData): EmailTemplate {
  const { fileName, recordsProcessed, executionTime, success, errorMessage } = data;
  
  const status = success ? "✅ Sucesso" : "❌ Erro";
  const statusColor = success ? "#22c55e" : "#ef4444";
  
  const subject = `[DRE] Processamento ${success ? 'Concluído' : 'Falhou'} - ${fileName || 'Arquivo'}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Notificação de Processamento DRE</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🏢 HITSS - Sistema Financeiro</h1>
        <p style="color: #e2e8f0; margin: 10px 0 0 0;">Notificação de Processamento DRE</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
        <div style="background: ${statusColor}; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 25px;">
          <h2 style="margin: 0; font-size: 20px;">${status}</h2>
        </div>
        
        <h3 style="color: #374151; margin-bottom: 20px;">📊 Detalhes do Processamento</h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #6b7280;">📁 Arquivo:</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${fileName || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #6b7280;">📈 Registros Processados:</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${recordsProcessed || 0}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #6b7280;">⏱️ Tempo de Execução:</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${executionTime ? `${executionTime}ms` : 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #6b7280;">🕐 Data/Hora:</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${new Date().toLocaleString('pt-BR')}</td>
          </tr>
        </table>
        
        ${errorMessage ? `
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
            <h4 style="color: #dc2626; margin: 0 0 10px 0;">❌ Detalhes do Erro:</h4>
            <p style="color: #7f1d1d; margin: 0; font-family: monospace; font-size: 14px;">${errorMessage}</p>
          </div>
        ` : ''}
        
        ${success ? `
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
            <h4 style="color: #16a34a; margin: 0 0 10px 0;">✅ Processamento Concluído</h4>
            <p style="color: #15803d; margin: 0;">Os dados DRE foram processados e inseridos com sucesso na base de dados.</p>
          </div>
        ` : ''}
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px; text-align: center;">
        <p style="color: #6b7280; margin: 0; font-size: 14px;">
          Esta é uma notificação automática do Sistema Financeiro HITSS.<br>
          Para mais informações, acesse o dashboard do sistema.
        </p>
      </div>
    </body>
    </html>
  `;
  
  const text = `
HITSS - Sistema Financeiro
Notificação de Processamento DRE

Status: ${success ? 'Sucesso' : 'Erro'}
Arquivo: ${fileName || 'N/A'}
Registros Processados: ${recordsProcessed || 0}
Tempo de Execução: ${executionTime ? `${executionTime}ms` : 'N/A'}
Data/Hora: ${new Date().toLocaleString('pt-BR')}

${errorMessage ? `Erro: ${errorMessage}\n` : ''}
${success ? 'Os dados DRE foram processados e inseridos com sucesso na base de dados.' : ''}

Esta é uma notificação automática do Sistema Financeiro HITSS.
  `;
  
  return { subject, html, text };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY não configurada");
    }

    const emailData: EmailData = await req.json();
    
    if (!emailData.to) {
      return new Response(
        JSON.stringify({ error: "Campo 'to' é obrigatório" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const template = generateEmailTemplate(emailData);

    const emailPayload = {
      from: "Sistema Financeiro HITSS <noreply@hitss.com.br>",
      to: [emailData.to],
      subject: template.subject,
      html: template.html,
      text: template.text,
    };

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erro ao enviar email: ${response.status} - ${errorData}`);
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email enviado com sucesso",
        emailId: result.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});