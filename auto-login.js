// Script para fazer login automaticamente
console.log('🔐 Iniciando login automático...');

// Simular preenchimento do formulário
const emailInput = document.querySelector('input[type="email"]');
const passwordInput = document.querySelector('input[type="password"]');
const submitButton = document.querySelector('button[type="submit"]');

if (emailInput && passwordInput && submitButton) {
  console.log('📝 Preenchendo formulário de login...');
  
  // Preencher campos
  emailInput.value = 'crash.kill@gmail.com';
  passwordInput.value = 'admin';
  
  // Disparar eventos para que o React detecte as mudanças
  emailInput.dispatchEvent(new Event('input', { bubbles: true }));
  passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
  
  console.log('✅ Campos preenchidos, fazendo login...');
  
  // Clicar no botão de submit
  setTimeout(() => {
    submitButton.click();
    console.log('🚀 Login enviado!');
  }, 500);
} else {
  console.error('❌ Não foi possível encontrar os elementos do formulário');
  console.log('Elementos encontrados:', {
    emailInput: !!emailInput,
    passwordInput: !!passwordInput,
    submitButton: !!submitButton
  });
}