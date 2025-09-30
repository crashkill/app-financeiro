const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Simular a classe ExcelParser
class ExcelParser {
  async parse(fileBuffer, options) {
    console.log('=== Iniciando parse do Excel ===');
    console.log('Upload Type:', options.uploadType);
    console.log('File Name:', options.fileName);
    console.log('Buffer Size:', fileBuffer.length);

    // Parse Excel file using xlsx library
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    
    // Get the first worksheet
    if (!workbook.SheetNames.length) {
      throw new Error('No worksheets found in Excel file');
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    console.log('Sheet Name:', sheetName);

    // Convert to JSON with header row
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log('Total rows:', jsonData.length);

    if (jsonData.length === 0) {
      throw new Error('Excel file is empty');
    }

    // Get headers from first row
    const headers = jsonData[0];
    console.log('\n=== Headers originais ===');
    headers.forEach((header, index) => {
      console.log(`${index}: "${header}"`);
    });

    // Normalize headers
    const normalizedHeaders = this.normalizeHeaders(headers, options.uploadType);
    console.log('\n=== Headers normalizados ===');
    console.log(normalizedHeaders);

    const results = [];
    let processedCount = 0;
    let skippedCount = 0;

    // Process data rows (skip header)
    for (let i = 1; i < Math.min(jsonData.length, 6); i++) { // Processar apenas 5 linhas para teste
      const row = jsonData[i];
      if (!row || row.length === 0 || row.every(cell => !cell || !cell.toString().trim())) {
        skippedCount++;
        continue; // Skip empty rows
      }

      console.log(`\n=== Processando linha ${i} ===`);
      console.log('Row data:', row);

      const rowData = this.mapRowToObject(row, normalizedHeaders, options.uploadType);
      console.log('Mapped object:', rowData);
      
      if (rowData) {
        results.push(rowData);
        processedCount++;
      } else {
        skippedCount++;
        console.log('Linha ignorada (dados insuficientes)');
      }
    }

    console.log('\n=== Resultado do processamento ===');
    console.log('Linhas processadas:', processedCount);
    console.log('Linhas ignoradas:', skippedCount);
    console.log('Total de registros válidos:', results.length);

    return results;
  }

  normalizeHeaders(headers, uploadType) {
    const normalized = {};
    
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]?.toString().toLowerCase().trim() || '';
      const normalizedKey = this.getNormalizedKey(header, uploadType);
      console.log(`Header ${i}: "${headers[i]}" -> "${normalizedKey}"`);
      if (normalizedKey) {
        normalized[i] = normalizedKey;
      }
    }
    
    return normalized;
  }

  getNormalizedKey(header, uploadType) {
    // DRE HITSS specific mappings based on MAPEAMENTO.md
    if (uploadType === 'dre') {
      const dreMappings = {
        'relatorio': 'relatorio',
        'tipo': 'tipo',
        'cliente': 'cliente',
        'linhanegocio': 'linha_negocio',
        'responsavelarea': 'responsavel_area',
        'responsaveldelivery': 'responsavel_delivery',
        'responsaveldevengado': 'responsavel_devengado',
        'idhoms': 'id_homs',
        'codigoprojeto': 'codigo_projeto',
        'projeto': 'projeto',
        'filialfaturamento': 'filial_faturamento',
        'imposto': 'imposto',
        'contaresumo': 'conta_resumo',
        'denominacaoconta': 'denominacao_conta',
        'idrecurso': 'id_recurso',
        'recurso': 'recurso',
        'lancamento': 'lancamento',
        'periodo': 'periodo',
        'natureza': 'natureza'
      };
      
      const normalizedHeader = header.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      console.log(`Procurando mapeamento para: "${normalizedHeader}"`);
      
      if (dreMappings[normalizedHeader]) {
        console.log(`Encontrado: ${dreMappings[normalizedHeader]}`);
        return dreMappings[normalizedHeader];
      } else {
        console.log('Não encontrado no mapeamento DRE');
      }
    }

    return null;
  }

  mapRowToObject(row, headerMap, uploadType) {
    const obj = {};
    let hasRequiredFields = false;

    for (let i = 0; i < row.length; i++) {
      const fieldName = headerMap[i];
      if (fieldName) {
        const value = row[i]?.toString().trim();
        if (value) {
          obj[fieldName] = value;
          hasRequiredFields = true;
        }
      }
    }

    console.log('Objeto mapeado inicial:', obj);

    // Special processing for DRE HITSS data
    if (uploadType === 'dre') {
      // Skip records where 'lancamento' is empty or null
      if (!obj.lancamento || obj.lancamento.toString().trim() === '') {
        console.log('Ignorando registro com lancamento vazio:', obj.lancamento);
        return null;
      }
      
      // Skip records where 'natureza' is empty or null
      if (!obj.natureza || obj.natureza.toString().trim() === '') {
        console.log('Ignorando registro com natureza vazia:', obj.natureza);
        return null;
      }

      // Map to database structure
      const dreRecord = {
        projeto: obj.projeto,
        natureza: obj.natureza,
        tipo: obj.tipo,
        valor: this.parseValue(obj.lancamento),
        conta: obj.conta_resumo || obj.denominacao_conta,
        descricao: obj.denominacao_conta,
        ano: this.extractYear(obj.periodo),
        mes: this.extractMonth(obj.periodo),
        relatorio: obj.relatorio,
        cliente: obj.cliente,
        linha_negocio: obj.linha_negocio,
        responsavel_area: obj.responsavel_area,
        responsavel_delivery: obj.responsavel_delivery,
        responsavel_devengado: obj.responsavel_devengado,
        id_homs: obj.id_homs,
        codigo_projeto: obj.codigo_projeto,
        filial_faturamento: obj.filial_faturamento,
        imposto: obj.imposto,
        conta_resumo: obj.conta_resumo,
        denominacao_conta: obj.denominacao_conta,
        id_recurso: obj.id_recurso,
        recurso: obj.recurso,
        lancamento: this.parseValue(obj.lancamento),
        periodo: obj.periodo
      };

      console.log('DRE record criado:', dreRecord);
      return dreRecord;
    }

    return hasRequiredFields ? obj : null;
  }

  parseValue(value) {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    
    if (typeof value === 'number') {
      return value;
    }
    
    if (typeof value === 'string') {
      // Remove currency symbols and spaces
      const cleanValue = value.replace(/[R$\s,]/g, '').replace(',', '.');
      const parsed = parseFloat(cleanValue);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    return 0;
  }

  extractYear(periodo) {
    if (!periodo) return new Date().getFullYear();
    
    // Try to extract year from different formats
    const yearMatch = periodo.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      return parseInt(yearMatch[1]);
    }
    
    return new Date().getFullYear();
  }

  extractMonth(periodo) {
    if (!periodo) return new Date().getMonth() + 1;
    
    // Try to extract month from different formats
    const monthMatch = periodo.match(/\b(0?[1-9]|1[0-2])\b/);
    if (monthMatch) {
      return parseInt(monthMatch[1]);
    }
    
    return new Date().getMonth() + 1;
  }
}

// Função principal
async function testExcelProcessing() {
  try {
    const filePath = 'C:\\Users\\fabricio.lima\\OneDrive - HITSS DO BRASIL SERVIÇOS TECNOLOGICOS LTDA\\Área de Trabalho - Antiga\\Projetos React\\app-financeiro\\scripts\\dre_hitss_1758504595588.xlsx';
    
    console.log('=== Teste de Processamento Excel ===');
    console.log('Arquivo:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.error('❌ Arquivo não encontrado:', filePath);
      process.exit(1);
    }
    
    const fileBuffer = fs.readFileSync(filePath);
    console.log('✅ Arquivo lido com sucesso. Tamanho:', fileBuffer.length, 'bytes');
    
    const parser = new ExcelParser();
    const results = await parser.parse(fileBuffer, {
      uploadType: 'dre',
      fileName: 'dre_hitss_1758504595588.xlsx'
    });
    
    console.log('\n=== Resultados Finais ===');
    console.log('Total de registros processados:', results.length);
    
    if (results.length > 0) {
      console.log('\n=== Primeiro registro ===');
      console.log(JSON.stringify(results[0], null, 2));
    } else {
      console.log('❌ Nenhum registro foi processado com sucesso!');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error(error.stack);
  }
}

// Executar o teste
testExcelProcessing();