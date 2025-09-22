# Documentação do Usuário Demo - Sistema Financeiro HITSS

## Visão Geral

O sistema financeiro HITSS possui um usuário demo que permite acesso limitado às funcionalidades principais da ferramenta, ideal para demonstrações e testes sem comprometer dados reais.

## Credenciais de Acesso

### Usuário Demo
- **Email:** demo@hitss.com
- **Senha:** demo123
- **Tipo:** Usuário com permissões limitadas
- **Acesso:** Somente leitura e funcionalidades básicas

### Usuário Administrador (para referência)
- **Usuário:** admin
- **Senha:** admin
- **Tipo:** Administrador completo
- **Acesso:** Todas as funcionalidades

## Funcionalidades Disponíveis para o Usuário Demo

### ✅ Acesso Permitido
- **Dashboard:** Visualização de métricas e indicadores financeiros
- **Planilhas Financeiras:** Consulta e visualização de dados financeiros
- **Relatórios:** Geração e visualização de relatórios básicos

### ❌ Acesso Restrito
- **Verificação Administrativa:** Funcionalidades exclusivas para administradores
- **Gestão de Profissionais:** Cadastro e edição de dados de profissionais
- **Consulta SAP:** Integração com sistemas SAP (requer permissões especiais)

## Como Fazer Login

1. Acesse a página de login do sistema
2. Digite as credenciais do usuário demo:
   - Email: `demo@hitss.com`
   - Senha: `demo123`
3. Clique em "Entrar"
4. Você será redirecionado para o dashboard com acesso limitado

## Limitações do Usuário Demo

### Controle de Acesso
- O usuário demo não possui privilégios administrativos
- Algumas páginas exibirão mensagens de acesso restrito
- Funcionalidades de edição podem estar limitadas
- Não é possível acessar configurações avançadas do sistema

### Redirecionamentos
- Tentativas de acesso a páginas restritas resultarão em:
  - Redirecionamento para o dashboard
  - Exibição de alerta informando sobre a restrição
  - Mensagem explicativa sobre as limitações

## Automação HITSS (Cron Job)

### Status do Cron Job
O sistema possui uma automação configurada no Supabase que executa diariamente às 08:00 para:
- Sincronização de dados financeiros
- Atualização de métricas
- Processamento de relatórios automáticos

### Verificação do Status
Para verificar o status da automação HITSS:
1. Acesse o banco de dados Supabase
2. Execute a função: `SELECT get_hitss_cron_status();`
3. Consulte os logs na tabela: `hitss_automation_logs`

### Logs de Execução
Os logs da automação incluem:
- Timestamp de execução
- Status (sucesso/erro)
- Detalhes da operação
- Mensagens de erro (se houver)

## Suporte e Troubleshooting

### Problemas Comuns

#### Login não funciona
- Verifique se as credenciais estão corretas
- Certifique-se de que não há espaços extras
- Tente fazer logout e login novamente

#### Acesso negado a páginas
- Isso é esperado para o usuário demo
- Consulte a lista de funcionalidades permitidas
- Use o usuário admin para acesso completo

#### Dados não aparecem
- Verifique se a automação HITSS está funcionando
- Consulte os logs de execução
- Entre em contato com o suporte técnico

### Contato para Suporte
- **Equipe:** Desenvolvimento HITSS
- **Email:** suporte.financeiro@hitss.com
- **Documentação Técnica:** Consulte os arquivos em `.trae/documents/`

## Notas Importantes

- O usuário demo é apenas para demonstrações e testes
- Não utilize para dados de produção
- As permissões podem ser atualizadas conforme necessário
- Para acesso completo, solicite credenciais de administrador

---

*Última atualização: Janeiro 2025*
*Versão do Sistema: 1.0*