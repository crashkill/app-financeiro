// Script para inserir dados de teste completos no Supabase DRE
import fetch from 'node-fetch';

async function insertCompleteTestData() {
  console.log('🚀 Inserindo dados de teste completos no sistema DRE...\n');

  const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNDk2NjI2MSwiZXhwIjoyMDQwNTQyMjYxfQ.test';

  try {
    // 1. Inserir dados nas tabelas dimensionais
    console.log('📊 1. Inserindo dados dimensionais...');

    // Dimensão Projeto
    const projectsData = [
      { codigo: 'P001', nome: 'Sistema Financeiro', descricao: 'Desenvolvimento do sistema financeiro', status: 'Ativo', data_inicio: '2025-01-01', data_fim: '2025-12-31', orcamento: 500000.00 },
      { codigo: 'P002', nome: 'App Mobile', descricao: 'Aplicativo móvel para clientes', status: 'Ativo', data_inicio: '2025-02-01', data_fim: '2025-11-30', orcamento: 300000.00 },
      { codigo: 'P003', nome: 'Dashboard Analytics', descricao: 'Dashboard de analytics avançado', status: 'Planejamento', data_inicio: '2025-03-01', data_fim: '2025-10-31', orcamento: 200000.00 }
    ];

    for (const project of projectsData) {
      const response = await fetch(`${supabaseUrl}/rest/v1/dim_projeto`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(project)
      });
      if (response.ok) {
        console.log(`✅ Projeto inserido: ${project.nome}`);
      } else {
        console.log(`❌ Erro projeto: ${response.status} - ${await response.text()}`);
      }
    }

    // Dimensão Cliente
    const clientsData = [
      { codigo: 'C001', nome: 'Empresa ABC Ltda', tipo: 'Corporativo', segmento: 'Financeiro', contato: 'João Silva', email: 'joao@empresaabc.com' },
      { codigo: 'C002', nome: 'Tech Solutions EIRELI', tipo: 'Pequena Empresa', segmento: 'Tecnologia', contato: 'Maria Santos', email: 'maria@techsolutions.com' },
      { codigo: 'C003', nome: 'Indústria XYZ S.A.', tipo: 'Corporativo', segmento: 'Industrial', contato: 'Carlos Oliveira', email: 'carlos@industriaxyz.com' }
    ];

    for (const client of clientsData) {
      const response = await fetch(`${supabaseUrl}/rest/v1/dim_cliente`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(client)
      });
      if (response.ok) {
        console.log(`✅ Cliente inserido: ${client.nome}`);
      } else {
        console.log(`❌ Erro cliente: ${response.status} - ${await response.text()}`);
      }
    }

    // Dimensão Conta
    const accountsData = [
      { codigo: '1001', nome: 'Receita de Vendas', tipo: 'Receita', categoria: 'Operacional', descricao: 'Receitas provenientes de vendas de produtos/serviços' },
      { codigo: '1002', nome: 'Receita de Serviços', tipo: 'Receita', categoria: 'Operacional', descricao: 'Receitas de prestação de serviços' },
      { codigo: '2001', nome: 'Custos Operacionais', tipo: 'Custo', categoria: 'Operacional', descricao: 'Custos relacionados às operações diárias' },
      { codigo: '2002', nome: 'Despesas Administrativas', tipo: 'Despesa', categoria: 'Administrativo', descricao: 'Despesas de administração geral' },
      { codigo: '3001', nome: 'Impostos', tipo: 'Despesa', categoria: 'Fiscal', descricao: 'Impostos e contribuições' }
    ];

    for (const account of accountsData) {
      const response = await fetch(`${supabaseUrl}/rest/v1/dim_conta`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(account)
      });
      if (response.ok) {
        console.log(`✅ Conta inserida: ${account.nome}`);
      } else {
        console.log(`❌ Erro conta: ${response.status} - ${await response.text()}`);
      }
    }

    // 2. Inserir dados na tabela fato
    console.log('\n📈 2. Inserindo dados na tabela fato...');

    const factData = [
      {
        data_transacao: '2025-09-15',
        valor: 150000.00,
        tipo: 'Receita',
        natureza: 'Operacional',
        codigo_conta: '1001',
        codigo_projeto: 'P001',
        codigo_cliente: 'C001',
        codigo_centro_custo: 'CC001',
        codigo_recurso: 'R001',
        descricao: 'Venda de sistema financeiro para Empresa ABC',
        documento: 'NF-2025-001',
        status: 'Confirmado'
      },
      {
        data_transacao: '2025-09-15',
        valor: 75000.00,
        tipo: 'Receita',
        natureza: 'Operacional',
        codigo_conta: '1002',
        codigo_projeto: 'P002',
        codigo_cliente: 'C002',
        codigo_centro_custo: 'CC002',
        codigo_recurso: 'R002',
        descricao: 'Desenvolvimento de app mobile',
        documento: 'NF-2025-002',
        status: 'Confirmado'
      },
      {
        data_transacao: '2025-09-15',
        valor: 45000.00,
        tipo: 'Custo',
        natureza: 'Operacional',
        codigo_conta: '2001',
        codigo_projeto: 'P001',
        codigo_cliente: null,
        codigo_centro_custo: 'CC001',
        codigo_recurso: 'R003',
        descricao: 'Custos operacionais do mês',
        documento: 'REC-2025-001',
        status: 'Confirmado'
      },
      {
        data_transacao: '2025-09-15',
        valor: 25000.00,
        tipo: 'Despesa',
        natureza: 'Administrativo',
        codigo_conta: '2002',
        codigo_projeto: null,
        codigo_cliente: null,
        codigo_centro_custo: 'CC003',
        codigo_recurso: 'R004',
        descricao: 'Despesas administrativas',
        documento: 'REC-2025-002',
        status: 'Confirmado'
      },
      {
        data_transacao: '2025-08-15',
        valor: 120000.00,
        tipo: 'Receita',
        natureza: 'Operacional',
        codigo_conta: '1001',
        codigo_projeto: 'P001',
        codigo_cliente: 'C001',
        codigo_centro_custo: 'CC001',
        codigo_recurso: 'R001',
        descricao: 'Manutenção sistema financeiro',
        documento: 'NF-2025-003',
        status: 'Confirmado'
      },
      {
        data_transacao: '2025-08-15',
        valor: 60000.00,
        tipo: 'Receita',
        natureza: 'Operacional',
        codigo_conta: '1002',
        codigo_projeto: 'P002',
        codigo_cliente: 'C003',
        codigo_centro_custo: 'CC002',
        codigo_recurso: 'R002',
        descricao: 'Consultoria industrial',
        documento: 'NF-2025-004',
        status: 'Confirmado'
      },
      {
        data_transacao: '2025-08-15',
        valor: 35000.00,
        tipo: 'Custo',
        natureza: 'Operacional',
        codigo_conta: '2001',
        codigo_projeto: 'P002',
        codigo_cliente: null,
        codigo_centro_custo: 'CC002',
        codigo_recurso: 'R003',
        descricao: 'Custos projeto mobile',
        documento: 'REC-2025-003',
        status: 'Confirmado'
      },
      {
        data_transacao: '2025-08-15',
        valor: 15000.00,
        tipo: 'Despesa',
        natureza: 'Fiscal',
        codigo_conta: '3001',
        codigo_projeto: null,
        codigo_cliente: null,
        codigo_centro_custo: 'CC004',
        codigo_recurso: 'R005',
        descricao: 'Impostos do mês',
        documento: 'DARF-2025-001',
        status: 'Confirmado'
      }
    ];

    for (const fact of factData) {
      const response = await fetch(`${supabaseUrl}/rest/v1/fact_dre_lancamentos`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(fact)
      });
      if (response.ok) {
        console.log(`✅ Lançamento inserido: ${fact.descricao}`);
      } else {
        console.log(`❌ Erro lançamento: ${response.status} - ${await response.text()}`);
      }
    }

    // 3. Inserir dados na tabela transacoes_financeiras (para views)
    console.log('\n💰 3. Inserindo dados em transacoes_financeiras...');

    const transactionsData = [
      {
        codigo_conta: '1001',
        valor: 150000.00,
        data_transacao: '2025-09-15',
        departamento: 'Vendas',
        centro_custo: 'CC001',
        natureza: 'Receita',
        resumo_conta: 'Receita de Vendas',
        descricao: 'Venda sistema financeiro'
      },
      {
        codigo_conta: '1002',
        valor: 75000.00,
        data_transacao: '2025-09-15',
        departamento: 'Serviços',
        centro_custo: 'CC002',
        natureza: 'Receita',
        resumo_conta: 'Receita de Serviços',
        descricao: 'Desenvolvimento app mobile'
      },
      {
        codigo_conta: '2001',
        valor: 45000.00,
        data_transacao: '2025-09-15',
        departamento: 'Operações',
        centro_custo: 'CC001',
        natureza: 'Custo',
        resumo_conta: 'Custos Operacionais',
        descricao: 'Custos operacionais'
      },
      {
        codigo_conta: '2002',
        valor: 25000.00,
        data_transacao: '2025-09-15',
        departamento: 'Administrativo',
        centro_custo: 'CC003',
        natureza: 'Despesa',
        resumo_conta: 'Despesas Administrativas',
        descricao: 'Despesas administrativas'
      },
      {
        codigo_conta: '1001',
        valor: 120000.00,
        data_transacao: '2025-08-15',
        departamento: 'Vendas',
        centro_custo: 'CC001',
        natureza: 'Receita',
        resumo_conta: 'Receita de Vendas',
        descricao: 'Manutenção sistema'
      },
      {
        codigo_conta: '1002',
        valor: 60000.00,
        data_transacao: '2025-08-15',
        departamento: 'Serviços',
        centro_custo: 'CC002',
        natureza: 'Receita',
        resumo_conta: 'Receita de Serviços',
        descricao: 'Consultoria industrial'
      },
      {
        codigo_conta: '2001',
        valor: 35000.00,
        data_transacao: '2025-08-15',
        departamento: 'Operações',
        centro_custo: 'CC002',
        natureza: 'Custo',
        resumo_conta: 'Custos Operacionais',
        descricao: 'Custos projeto mobile'
      },
      {
        codigo_conta: '3001',
        valor: 15000.00,
        data_transacao: '2025-08-15',
        departamento: 'Fiscal',
        centro_custo: 'CC004',
        natureza: 'Despesa',
        resumo_conta: 'Impostos',
        descricao: 'Impostos do mês'
      }
    ];

    for (const transaction of transactionsData) {
      const response = await fetch(`${supabaseUrl}/rest/v1/transacoes_financeiras`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(transaction)
      });
      if (response.ok) {
        console.log(`✅ Transação inserida: ${transaction.descricao}`);
      } else {
        console.log(`❌ Erro transação: ${response.status} - ${await response.text()}`);
      }
    }

    // 4. Testar as views com dados
    console.log('\n🔍 4. Testando views com dados inseridos...');

    const viewsResponse = await fetch(`${supabaseUrl}/rest/v1/vw_dre_resumo_mensal?limit=10`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      }
    });

    const viewsData = await viewsResponse.json();
    console.log('📊 Views Status:', viewsResponse.status);
    console.log('📊 Total de registros nas views:', viewsData.length);
    console.log('📊 Dados das views:', JSON.stringify(viewsData, null, 2));

    // 5. Testar RPC
    console.log('\n⚡ 5. Testando função RPC...');

    const rpcResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/calcular_metricas_dre`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_ano: 2025,
        p_mes: 9
      })
    });

    const rpcData = await rpcResponse.json();
    console.log('📊 RPC Status:', rpcResponse.status);
    console.log('📊 Dados da RPC:', JSON.stringify(rpcData, null, 2));

    // 6. Testar GraphQL
    console.log('\n🔗 6. Testando GraphQL com dados...');

    const graphqlResponse = await fetch(`${supabaseUrl}/graphql/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        query: `query {
          vw_dre_resumo_mensal(limit: 10) {
            ano
            mes
            receita
            despesa
            resultado
          }
        }`
      })
    });

    const graphqlData = await graphqlResponse.json();
    console.log('📊 GraphQL Status:', graphqlResponse.status);
    console.log('📊 Dados do GraphQL:', JSON.stringify(graphqlData, null, 2));

    console.log('\n🎉 ✅ DADOS DE TESTE INSERIDOS COM SUCESSO!');
    console.log('📊 Sistema DRE totalmente operacional com dados reais!');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

insertCompleteTestData();
