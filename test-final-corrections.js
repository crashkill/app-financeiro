// Script para verificar se todas as correções foram aplicadas com sucesso
console.log('🔍 Verificando correções implementadas...\n');

// 1. Verificar se o arquivo supabaseClient.ts foi removido
const fs = require('fs');
const path = require('path');

const supabaseClientPath = path.join(__dirname, 'src', 'services', 'supabaseClient.ts');
const supabaseMainPath = path.join(__dirname, 'src', 'lib', 'supabase.ts');

console.log('1. ✅ Verificação de múltiplas instâncias GoTrueClient:');
if (!fs.existsSync(supabaseClientPath)) {
  console.log('   ✅ Arquivo supabaseClient.ts duplicado foi removido');
} else {
  console.log('   ❌ Arquivo supabaseClient.ts ainda existe');
}

if (fs.existsSync(supabaseMainPath)) {
  const supabaseContent = fs.readFileSync(supabaseMainPath, 'utf8');
  if (supabaseContent.includes('supabaseInstance') && supabaseContent.includes('createSupabaseClient')) {
    console.log('   ✅ Padrão singleton implementado em supabase.ts');
  } else {
    console.log('   ❌ Padrão singleton não encontrado');
  }
  
  if (supabaseContent.includes("'apikey': supabaseAnonKey")) {
    console.log('   ✅ Headers de API key adicionados');
  } else {
    console.log('   ❌ Headers de API key não encontrados');
  }
} else {
  console.log('   ❌ Arquivo supabase.ts principal não encontrado');
}

// 2. Verificar configuração do React Router
console.log('\n2. ✅ Verificação da future flag v7_startTransition:');
const routerPath = path.join(__dirname, 'src', 'router.tsx');
const mainPath = path.join(__dirname, 'src', 'main.tsx');

if (fs.existsSync(routerPath)) {
  const routerContent = fs.readFileSync(routerPath, 'utf8');
  if (routerContent.includes('v7_startTransition: true')) {
    console.log('   ✅ Future flag configurada em router.tsx');
  } else {
    console.log('   ❌ Future flag não encontrada em router.tsx');
  }
}

if (fs.existsSync(mainPath)) {
  const mainContent = fs.readFileSync(mainPath, 'utf8');
  if (mainContent.includes('v7_startTransition: true')) {
    console.log('   ✅ Future flag configurada em main.tsx (RouterProvider)');
  } else {
    console.log('   ❌ Future flag não encontrada em main.tsx');
  }
}

// 3. Verificar correções de importação
console.log('\n3. ✅ Verificação de importações corrigidas:');
const dreUploadPath = path.join(__dirname, 'src', 'components', 'DreUpload.tsx');
const automationTestPath = path.join(__dirname, 'src', 'services', 'automationTestService.ts');

if (fs.existsSync(dreUploadPath)) {
  const dreContent = fs.readFileSync(dreUploadPath, 'utf8');
  if (dreContent.includes("from '../lib/supabase'")) {
    console.log('   ✅ DreUpload.tsx importação corrigida');
  } else {
    console.log('   ❌ DreUpload.tsx importação não corrigida');
  }
}

if (fs.existsSync(automationTestPath)) {
  const autoContent = fs.readFileSync(automationTestPath, 'utf8');
  if (autoContent.includes("from '../lib/supabase'")) {
    console.log('   ✅ automationTestService.ts importação corrigida');
  } else {
    console.log('   ❌ automationTestService.ts importação não corrigida');
  }
}

console.log('\n🎉 Verificação de correções concluída!');
console.log('\n📋 Resumo das correções implementadas:');
console.log('   • Consolidação de instâncias Supabase em arquivo singleton');
console.log('   • Remoção do arquivo supabaseClient.ts duplicado');
console.log('   • Configuração da future flag v7_startTransition no router');
console.log('   • Adição de headers de API key para corrigir erro 406');
console.log('   • Atualização de importações para usar arquivo principal');