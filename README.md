# App Financeiro

## Descrição
Aplicação para gerenciamento financeiro de projetos, permitindo o controle de receitas, custos e margens.

## Funcionalidades Principais

### 1. Planilhas Financeiras
- Visualização mensal de dados financeiros por projeto
- Cálculo automático de margens
- Processamento de diferentes tipos de transações:
  - Receita Devengada
  - Desoneração da Folha
  - Custos (CLT, Outros, Subcontratados)

### 2. Dashboard
- Visão geral dos indicadores financeiros
- Gráficos e análises

### 3. Forecast
- Projeções financeiras
- Análise de tendências

### 4. Upload de Dados
- Importação de planilhas
- Validação automática de dados

## Regras de Negócio

### Processamento de Transações
1. **Receita**
   - Tipo: "RECEITA DEVENGADA"
   - Mantém valor original do banco
   - Sempre positivo

2. **Desoneração**
   - Tipo: "DESONERAÇÃO DA FOLHA"
   - Mantém valor original do banco
   - Sempre positivo

3. **Custos**
   - Tipos: "CLT", "OUTROS", "SUBCONTRATADOS"
   - Mantém valor e sinal original do banco

### Cálculo de Margem
- Fórmula: (1 - (|Custo| - Desoneração) / Receita) * 100
- Onde |Custo| representa o valor absoluto do custo

## Tecnologias Utilizadas
- React com TypeScript
- DexieJS para banco de dados local
- React Bootstrap e Material-UI para interface
- Vite como bundler

## Instalação e Execução

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Construir para produção
npm run build
```

## Estrutura do Projeto
```
src/
  ├── components/      # Componentes reutilizáveis
  ├── contexts/        # Contextos React
  ├── pages/          # Páginas da aplicação
  ├── db/             # Configuração do banco de dados
  ├── types/          # Tipos TypeScript
  └── utils/          # Funções utilitárias
```

## Últimas Atualizações
- Correção no processamento de valores financeiros
- Atualização da documentação com regras detalhadas
- Melhorias na interface do usuário
- Correção nos ícones do menu lateral

## Contribuição
1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença
Este projeto está sob a licença MIT.
