// Script para inserir dados consistentes para os filtros
import fetch from 'node-fetch';

async function insertConsistentData() {
  console.log('🔧 Inserindo dados consistentes para os filtros...\n');

  const supabaseUrl = 'https://oomhhhfahdvavnhlbioa.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vbWhoaGZhaGR2YXZuaGxiaW9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNDk2NjI2MSwiZXhwIjoyMDQwNTQyMjYxfQ.test';

  try {
    // 1. Inserir projetos consistentes
    console.log('📊 1. Inserindo projetos consistentes...');

    const projects = [
      { codigo: 'P001', nome: 'Sistema Financeiro', descricao: 'Desenvolvimento do sistema financeiro', status: 'Ativo', data_inicio: '2025-01-01', data_fim: '2025-12-31', orcamento: 500000.00 },
      { codigo: 'P002', nome: 'App Mobile', descricao: 'Aplicativo móvel para clientes', status: 'Ativo', data_inicio: '2025-02-01', data_fim: '2025-11-30', orcamento: 300000.00 },
      { codigo: 'P003', nome: 'Dashboard Analytics', descricao: 'Dashboard de analytics avançado', status: 'Planejamento', data_inicio: '2025-03-01', data_fim: '2025-10-31', orcamento: 200000.00 },
      { codigo: 'P004', nome: 'E-commerce Platform', descricao: 'Plataforma de e-commerce', status: 'Ativo', data_inicio: '2025-01-15', data_fim: '2025-12-15', orcamento: 750000.00 },
      { codigo: 'P005', nome: 'CRM Integration', descricao: 'Integração com sistema CRM', status: 'Ativo', data_inicio: '2025-02-01', data_fim: '2025-08-31', orcamento: 150000.00 },
      { codigo: 'P006', nome: 'API Gateway', descricao: 'Gateway de APIs', status: 'Em Desenvolvimento', data_inicio: '2025-03-01', data_fim: '2025-09-30', orcamento: 250000.00 },
      { codigo: 'P007', nome: 'Data Warehouse', descricao: 'Armazém de dados empresariais', status: 'Planejamento', data_inicio: '2025-04-01', data_fim: '2025-12-31', orcamento: 600000.00 },
      { codigo: 'P008', nome: 'Mobile Banking', descricao: 'Aplicativo de mobile banking', status: 'Ativo', data_inicio: '2025-01-01', data_fim: '2025-12-31', orcamento: 400000.00 },
      { codigo: 'P009', nome: 'BI Analytics', descricao: 'Business Intelligence e Analytics', status: 'Ativo', data_inicio: '2025-02-15', data_fim: '2025-12-31', orcamento: 350000.00 },
      { codigo: 'P010', nome: 'Cloud Migration', descricao: 'Migração para nuvem', status: 'Em Desenvolvimento', data_inicio: '2025-03-01', data_fim: '2025-10-31', orcamento: 800000.00 }
    ];

    for (const project of projects) {
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
        console.log(`✅ Projeto inserido: ${project.nome} (${project.codigo})`);
      } else {
        console.log(`❌ Erro projeto: ${response.status} - ${await response.text()}`);
      }
    }

    // 2. Inserir dados na dre_hitss com projetos consistentes
    console.log('\n📋 2. Inserindo dados na dre_hitss...');

    const dreHitssData = [
      {
        relatorio: 'Realizado',
        projeto: 'Sistema Financeiro',
        conta: '1001',
        valor: 150000.00,
        ano: 2025,
        mes: 9,
        data: '2025-09-15',
        tipo: 'Receita',
        natureza: 'Operacional',
        centro_custo: 'CC001',
        departamento: 'TI',
        descricao: 'Desenvolvimento sistema financeiro'
      },
      {
        relatorio: 'Realizado',
        projeto: 'App Mobile',
        conta: '1002',
        valor: 75000.00,
        ano: 2025,
        mes: 9,
        data: '2025-09-15',
        tipo: 'Receita',
        natureza: 'Operacional',
        centro_custo: 'CC002',
        departamento: 'Desenvolvimento',
        descricao: 'Desenvolvimento app mobile'
      },
      {
        relatorio: 'Realizado',
        projeto: 'E-commerce Platform',
        conta: '1003',
        valor: 200000.00,
        ano: 2025,
        mes: 9,
        data: '2025-09-15',
        tipo: 'Receita',
        natureza: 'Operacional',
        centro_custo: 'CC003',
        departamento: 'E-commerce',
        descricao: 'Plataforma e-commerce'
      },
      {
        relatorio: 'Realizado',
        projeto: 'CRM Integration',
        conta: '1004',
        valor: 45000.00,
        ano: 2025,
        mes: 9,
        data: '2025-09-15',
        tipo: 'Receita',
        natureza: 'Operacional',
        centro_custo: 'CC004',
        departamento: 'Integração',
        descricao: 'Integração CRM'
      },
      {
        relatorio: 'Realizado',
        projeto: 'API Gateway',
        conta: '1005',
        valor: 85000.00,
        ano: 2025,
        mes: 9,
        data: '2025-09-15',
        tipo: 'Receita',
        natureza: 'Operacional',
        centro_custo: 'CC005',
        departamento: 'Infraestrutura',
        descricao: 'Gateway de APIs'
      },
      {
        relatorio: 'Realizado',
        projeto: 'Data Warehouse',
        conta: '1006',
        valor: 120000.00,
        ano: 2024,
        mes: 12,
        data: '2024-12-15',
        tipo: 'Receita',
        natureza: 'Operacional',
        centro_custo: 'CC006',
        departamento: 'Data',
        descricao: 'Armazém de dados'
      },
      {
        relatorio: 'Realizado',
        projeto: 'Mobile Banking',
        conta: '1007',
        valor: 95000.00,
        ano: 2024,
        mes: 11,
        data: '2024-11-15',
        tipo: 'Receita',
        natureza: 'Operacional',
        centro_custo: 'CC007',
        departamento: 'Banking',
        descricao: 'Mobile banking'
      },
      {
        relatorio: 'Realizado',
        projeto: 'BI Analytics',
        conta: '1008',
        valor: 65000.00,
        ano: 2024,
        mes: 10,
        data: '2024-10-15',
        tipo: 'Receita',
        natureza: 'Operacional',
        centro_custo: 'CC008',
        departamento: 'Analytics',
        descricao: 'Business Intelligence'
      },
      {
        relatorio: 'Realizado',
        projeto: 'Cloud Migration',
        conta: '1009',
        valor: 180000.00,
        ano: 2024,
        mes: 9,
        data: '2024-09-15',
        tipo: 'Receita',
        natureza: 'Operacional',
        centro_custo: 'CC009',
        departamento: 'Cloud',
        descricao: 'Migração para nuvem'
      }
    ];

    for (const hitssData of dreHitssData) {
      const response = await fetch(`${supabaseUrl}/rest/v1/dre_hitss`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(hitssData)
      });
      if (response.ok) {
        console.log(`✅ DRE HITSS inserido: ${hitssData.projeto} (${hitssData.ano})`);
      } else {
        console.log(`❌ Erro DRE HITSS: ${response.status} - ${await response.text()}`);
      }
    }

    // 3. Inserir dados na fact_dre_lancamentos com anos diferentes
    console.log('\n📈 3. Inserindo dados na fact_dre_lancamentos...');

    const factData = [
      {
        data_transacao: '2025-09-15',
        valor: 150000.00,
        tipo: 'Receita',
        natureza: 'Operacional',
        codigo_conta: '1001',
        codigo_projeto: 'P001',
        codigo_centro_custo: 'CC001',
        codigo_recurso: 'R001',
        descricao: 'Sistema Financeiro - Receita',
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
        codigo_centro_custo: 'CC002',
        codigo_recurso: 'R002',
        descricao: 'App Mobile - Receita',
        documento: 'NF-2025-002',
        status: 'Confirmado'
      },
      {
        data_transacao: '2025-09-15',
        valor: 200000.00,
        tipo: 'Receita',
        natureza: 'Operacional',
        codigo_conta: '1003',
        codigo_projeto: 'P004',
        codigo_centro_custo: 'CC003',
        codigo_recurso: 'R003',
        descricao: 'E-commerce Platform - Receita',
        documento: 'NF-2025-003',
        status: 'Confirmado'
      },
      {
        data_transacao: '2025-09-15',
        valor: 45000.00,
        tipo: 'Receita',
        natureza: 'Operacional',
        codigo_conta: '1004',
        codigo_projeto: 'P005',
        codigo_centro_custo: 'CC004',
        codigo_recurso: 'R004',
        descricao: 'CRM Integration - Receita',
        documento: 'NF-2025-004',
        status: 'Confirmado'
      },
      {
        data_transacao: '2024-12-15',
        valor: 120000.00,
        tipo: 'Receita',
        natureza: 'Operacional',
        codigo_conta: '1006',
        codigo_projeto: 'P007',
        codigo_centro_custo: 'CC006',
        codigo_recurso: 'R005',
        descricao: 'Data Warehouse - Receita 2024',
        documento: 'NF-2024-001',
        status: 'Confirmado'
      },
      {
        data_transacao: '2024-11-15',
        valor: 95000.00,
        tipo: 'Receita',
        natureza: 'Operacional',
        codigo_conta: '1007',
        codigo_projeto: 'P008',
        codigo_centro_custo: 'CC007',
        codigo_recurso: 'R006',
        descricao: 'Mobile Banking - Receita 2024',
        documento: 'NF-2024-002',
        status: 'Confirmado'
      },
      {
        data_transacao: '2024-10-15',
        valor: 65000.00,
        tipo: 'Receita',
        natureza: 'Operacional',
        codigo_conta: '1008',
        codigo_projeto: 'P009',
        codigo_centro_custo: 'CC008',
        codigo_recurso: 'R007',
        descricao: 'BI Analytics - Receita 2024',
        documento: 'NF-2024-003',
        status: 'Confirmado'
      },
      {
        data_transacao: '2024-09-15',
        valor: 180000.00,
        tipo: 'Receita',
        natureza: 'Operacional',
        codigo_conta: '1009',
        codigo_projeto: 'P010',
        codigo_centro_custo: 'CC009',
        codigo_recurso: 'R008',
        descricao: 'Cloud Migration - Receita 2024',
        documento: 'NF-2024-004',
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
        console.log(`✅ Fact inserido: ${fact.descricao}`);
      } else {
        console.log(`❌ Erro fact: ${response.status} - ${await response.text()}`);
      }
    }

    console.log('\n🎉 ✅ DADOS CONSISTENTES INSERIDOS COM SUCESSO!');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

insertConsistentData();
