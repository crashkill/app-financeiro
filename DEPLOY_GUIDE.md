# 🚀 DEPLOY NA VERCEL - GUIA COMPLETO

## ⚠️ **STATUS ATUAL:**
- ✅ Edge Functions criadas e prontas
- ✅ Configuração Vercel implementada
- ⏳ Deploy pendente

## 📋 **PASSOS PARA FAZER O DEPLOY:**

### **1. Instalar Vercel CLI**
```bash
# Instalar Vercel CLI globalmente
npm install -g vercel

# Ou com PNPM
pnpm add -g vercel
```

### **2. Login na Vercel**
```bash
vercel login
# Siga as instruções para autenticar
```

### **3. Deploy do Projeto**
```bash
# Deploy para produção
vercel --prod

# Deploy para ambiente de desenvolvimento
vercel
```

### **4. Configurar Serverless Functions**
```bash
# As Edge Functions serão automaticamente detectadas
# pela Vercel a partir da pasta /api
```

### **5. Verificar deploy**
```bash
# Verificar status do deploy
vercel ls

# Obter informações do deploy atual
vercel inspect
```

---

## 🎯 **COMANDOS ÚTEIS DA VERCEL:**

### **Deploy Rápido:**
```bash
# 1. Login na Vercel (primeira vez)
vercel login

# 2. Deploy para produção
vercel --prod

# 3. Verificar status
vercel ls
```

### **Gerenciamento de Ambientes:**
```bash
# Listar todos os deployments
vercel ls

# Remover um deployment
vercel remove [nome-do-projeto]

# Configurar variáveis de ambiente
vercel env add
```

---

## 📊 **SERVERLESS FUNCTIONS:**

### **1. API Routes (Produção)**
- 📁 Local: `api/[nome-da-função].ts`
- 🎯 Função: Endpoints serverless para o frontend
- 🔐 Configuração: Variáveis de ambiente na Vercel
- 📤 Output: Respostas JSON para o frontend

### **2. Migração das Edge Functions**
- As funções anteriormente no Supabase devem ser migradas para a pasta `api/`
- Cada arquivo na pasta `api/` se torna automaticamente um endpoint serverless
- Exemplo: `api/get-projects.ts` fica disponível em `/api/get-projects`

---

## 🔧 **APÓS O DEPLOY:**

### **1. Configurar Variáveis de Ambiente:**
```bash
# Via CLI
vercel env add HITSS_DOWNLOAD_URL
vercel env add RESEND_API_KEY

# Ou pelo Dashboard da Vercel > Settings > Environment Variables
```

### **2. Testar Funções:**
```bash
# Teste simulado (funciona sem Vault)
node test_edge_simulated.js

# Teste real (requer Vault configurado)
node test_edge_function.js
```

### **3. Monitorar Logs:**
```bash
# Ver logs das funções no Dashboard
Supabase Dashboard > Edge Functions > [Nome da Função] > Logs
```

---

## ⚡ **PERFORMANCE ESPERADA:**

| Função | Tempo | Status |
|--------|-------|--------|
| **download-hitss-simulated** | 5-10s | ✅ Testada |
| **download-hitss-edge** | 30-60s | ⏳ Aguardando deploy |

---

## 🎉 **STATUS FINAL:**

- ✅ **Código:** 100% pronto
- ✅ **Testes:** Scripts criados
- ❌ **Deploy:** Pendente Docker
- ⏳ **Produção:** Aguardando configuração

**💡 Execute os passos acima para completar o deploy das Edge Functions!**
