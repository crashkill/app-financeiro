# ADR-003: Migração de Autenticação Web para SPA (Azure AD)

## Status
Aceito (Pendente de configuração no Portal Azure)

## Contexto
O projeto `app-financeiro` utilizava anteriormente uma arquitetura de autenticação baseada em um servidor intermediário (BFF - Backend for Frontend) rodando Express.js (`Login - Microsoft`). Essa arquitetura exigia que o registro no Azure AD fosse do tipo **Web**, utilizando `Client ID` e `Client Secret` para troca de tokens no servidor.

Para simplificar a infraestrutura e modernizar a aplicação, decidiu-se migrar para autenticação nativa no cliente (Frontend) utilizando a biblioteca `@azure/msal-react` e `@azure/msal-browser`.

## Decisão
Adotar o fluxo **Single-Page Application (SPA)** com PKCE (Proof Key for Code Exchange) para autenticação. Isso remove a necessidade do servidor Node.js intermediário e do gerenciamento de `Client Secret`, aumentando a segurança (segredos não residem no cliente) e a performance (menos saltos de rede).

## Consequências
1. **Infraestrutura Azure:** O registro da aplicação no Azure AD deve ser atualizado. A URI de redirecionamento `https://localhost:3000` deve ser movida da plataforma **Web** para a plataforma **Single-page application**.
2. **Erro AADSTS9002326:** Se essa alteração não for feita, o Azure bloqueará tentativas de login via browser com este erro de CORS, pois aplicações Web tradicionais não permitem resgate de token via origem cruzada pública.
3. **HTTPS:** A aplicação local deve rodar obrigatoriamente em HTTPS (já configurado via Vite basicSsl).

## Ação Requerida
O administrador do Azure AD deve adicionar a plataforma SPA no registro do app e whitelistar a origem `https://localhost:3000`.
