# Guia de Migração: Tela de Login Split Screen

## Visão Geral

Este guia documenta como substituir a tela de login atual do **app-financeiro** pelo novo componente **LoginSplitScreen**, replicando exatamente o visual do projeto **Login - Microsoft**.

## Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `src/components/LoginSplitScreen/LoginSplitScreen.tsx` | Versão Express (backend) |
| `src/components/LoginSplitScreen/LoginSplitScreenMSAL.tsx` | Versão MSAL Browser |
| `src/components/LoginSplitScreen/login-splitscreen.css` | Estilos CSS |
| `src/components/LoginSplitScreen/index.ts` | Exports |

## Passo a Passo

### 1. Atualizar o App.tsx

Substitua o import do Login:

```tsx
// ANTES
import Login from './pages/Login';

// DEPOIS
import { LoginSplitScreenMSAL as Login } from './components/LoginSplitScreen';
```

### 2. Verificar Variáveis de Ambiente

Para **Azure AD** (produção), configure:

```env
VITE_AUTH_PROVIDER=azure
VITE_AZURE_CLIENT_ID=bd89001b-064b-4f28-a1c4-988422e013bb
VITE_AZURE_TENANT_ID=d6c7d4eb-ad17-46c8-a404-f6a92cbead96
VITE_AZURE_REDIRECT_URI=http://localhost:5173
```

Para **Supabase** (desenvolvimento):

```env
VITE_AUTH_PROVIDER=supabase
VITE_SUPABASE_URL=https://supabase.fsw-hitss.duckdns.org
VITE_SUPABASE_ANON_KEY=eyJ0eXAi...
```

### 3. Testar Localmente

```bash
cd app-financeiro
npm run dev
```

Acesse: http://localhost:5173/login

## Versões Disponíveis

### LoginSplitScreenMSAL (Recomendada)

Usa o `AuthProviderSwitch` interno do app-financeiro.
Funciona com Supabase ou Azure AD sem precisar de servidor externo.

```tsx
import { LoginSplitScreenMSAL } from './components/LoginSplitScreen';

<LoginSplitScreenMSAL redirectTo="/dashboard" />
```

### LoginSplitScreen (Express)

Usa servidor Express externo em `https://localhost:3000`.
Ideal para desenvolvimento com o projeto Login - Microsoft.

```tsx
import { LoginSplitScreen } from './components/LoginSplitScreen';

<LoginSplitScreen 
  authServerUrl="https://localhost:3000"
  redirectTo="/dashboard"
/>
```

**Requisitos:**
1. Servidor Express rodando (projeto Login - Microsoft)
2. Certificados SSL configurados
3. HTTPS obrigatório

## Comparação Visual

| Característica | Antes (Login.tsx) | Depois (LoginSplitScreen) |
|----------------|-------------------|---------------------------|
| Layout | Single Column | Split Screen |
| Botão Microsoft | Não visível | Lado direito destacado |
| Animações | Básicas | Orbs flutuantes |
| Glassmorphism | Sim | Sim (aprimorado) |
| Responsivo | Sim | Sim (stack mobile) |

## Rollback

Para reverter para a versão anterior:

```tsx
// App.tsx
import Login from './pages/Login'; // Volta ao original
```

## Troubleshooting

### Erro: "MSAL não inicializado"

Verifique se `VITE_AUTH_PROVIDER=azure` está definido e as credenciais Azure estão corretas.

### Erro: "Servidor não disponível"

Se usando versão Express, certifique-se de que o projeto Login - Microsoft está rodando:

```bash
cd Login - Microsoft
npm start
```

### CSS não carregando

Verifique se o import do CSS está correto no componente:

```tsx
import './login-splitscreen.css';
```

## Referências

- [ADR-003: Componente Reutilizável](./docs/ADR/ADR-003-Componente-Reutilizavel.md)
- [Projeto Login - Microsoft](../Login%20-%20Microsoft/README.md)
- [MSAL Browser Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
