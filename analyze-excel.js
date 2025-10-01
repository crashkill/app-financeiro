const XLSX = require('xlsx');
const path = require('path');

// Caminho para o arquivo Excel
const excelFilePath = path.join(__dirname, 'Relatorio_250909104635226.xlsx');

console.log('🔍 Analisando arquivo Excel:', excelFilePath);

try {
    // Ler o arquivo Excel
    const workbook = XLSX.readFile(excelFilePath);
    
    console.log('\n📊 ANÁLISE DO ARQUIVO EXCEL HITSS');
    console.log('=' .repeat(50));
    
    // Listar todas as abas/planilhas
    console.log('\n📋 ABAS DISPONÍVEIS:');
    workbook.SheetNames.forEach((sheetName, index) => {
        console.log(`${index + 1}. ${sheetName}`);
    });
    
    // Analisar cada aba
    workbook.SheetNames.forEach((sheetName, sheetIndex) => {
        console.log(`\n\n🔍 ANÁLISE DA ABA: "${sheetName}"`);
        console.log('-'.repeat(40));
        
        const worksheet = workbook.Sheets[sheetName];
        
        // Converter para JSON para análise
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
            console.log('❌ Aba vazia');
            return;
        }
        
        // Mostrar informações básicas
        console.log(`📏 Total de linhas: ${jsonData.length}`);
        
        // Primeira linha (cabeçalhos)
        if (jsonData[0]) {
            console.log('\n📝 CABEÇALHOS (Primeira linha):');
            jsonData[0].forEach((header, index) => {
                if (header) {
                    console.log(`  ${index + 1}. ${header}`);
                }
            });
        }
        
        // Mostrar algumas linhas de exemplo (máximo 5)
        console.log('\n📄 EXEMPLOS DE DADOS (primeiras 5 linhas):');
        const maxRows = Math.min(5, jsonData.length);
        
        for (let i = 0; i < maxRows; i++) {
            console.log(`\nLinha ${i + 1}:`);
            if (jsonData[i]) {
                jsonData[i].forEach((cell, cellIndex) => {
                    if (cell !== undefined && cell !== null && cell !== '') {
                        console.log(`  Col ${cellIndex + 1}: ${cell}`);
                    }
                });
            }
        }
        
        // Análise de tipos de dados
        if (jsonData.length > 1) {
            console.log('\n🔍 ANÁLISE DE TIPOS DE DADOS:');
            const headers = jsonData[0] || [];
            const sampleRow = jsonData[1] || [];
            
            headers.forEach((header, index) =>