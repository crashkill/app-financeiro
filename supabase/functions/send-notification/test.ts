// Teste da Edge Function send-notification
// Execute este arquivo para testar o sistema de notificação por email

const SUPABASE_URL = "https://oomhhhfahdvavnhlbioa.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"; // Substitua pela chave real

async function testEmailNotification() {
  console.log("🧪 Iniciando teste de notificação por email...");
  
  const testData = {
    to: "fabricio.lima@globalhitss.com.br",
    fileName: "teste-dre-2024.xlsx",
    recordsProcessed: 150,
    executionTime: 2500,
    success: true
  };
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log("✅ Teste de sucesso concluído:", result);
    } else {
      console.error("❌ Erro no teste de sucesso:", result);
    }
  } catch (error) {
    console.error("❌ Erro na requisição de teste:", error);
  }
  
  // Teste de notificação de erro
  const errorTestData = {
    to: "fabricio.lima@globalhitss.com.br",
    fileName: "erro-teste-dre-2024.xlsx",
    executionTime: 1200,
    success: false,
    errorMessage: "Erro de teste: Formato de arquivo inválido"
  };
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(errorTestData),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log("✅ Teste de erro concluído:", result);
    } else {
      console.error("❌ Erro no teste de erro:", result);
    }
  } catch (error) {
    console.error("❌ Erro na requisição de teste de erro:", error);
  }
  
  console.log("🏁 Testes concluídos!");
}

// Executar teste se for chamado diretamente
if (import.meta.main) {
  testEmailNotification();
}

export { testEmailNotification };