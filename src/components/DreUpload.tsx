import React, { useState, ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../services/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

interface DreRow {
  upload_batch_id: string;
  project_reference: string;
  period_year: number;
  period_month: number;
  account_code: string;
  account_name: string;
  account_situation: string | null;
  account_grouping: string | null;
  amount: number;
  status: string;
  source_file_name: string;
  // raw_line_data?: any; // Opcional, se for armazenar
}

const DreUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [projectReference, setProjectReference] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file || !year || !projectReference) {
      setMessage('Por favor, selecione um arquivo, informe o ano e a referência do projeto.');
      return;
    }

    setIsLoading(true);
    setMessage('Processando arquivo...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result;
        if (!arrayBuffer) {
          throw new Error('Não foi possível ler o arquivo.');
        }
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0]; // Assume a primeira planilha
        const worksheet = workbook.Sheets[sheetName];
        
        // Tentar detectar o início dos dados e os cabeçalhos corretos
        // Esta parte pode precisar de ajuste fino com base na estrutura exata do seu arquivo
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });

        // Encontrar a linha de cabeçalho (JAN, FEV, MAR, etc.)
        let headerRowIndex = -1;
        let monthHeaders: string[] = [];
        const monthNames = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
        
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i] as string[];
          if (row.some(cell => typeof cell === 'string' && monthNames.includes(cell.toUpperCase()))) {
            headerRowIndex = i;
            monthHeaders = row.map(cell => typeof cell === 'string' ? cell.toUpperCase() : '');
            break;
          }
        }

        if (headerRowIndex === -1) {
          throw new Error('Não foi possível encontrar a linha de cabeçalho com os meses (JAN-DEZ) na planilha.');
        }

        const dataStartIndex = headerRowIndex + 1;
        const dreDataToInsert: DreRow[] = [];
        const uploadBatchId = uuidv4();
        const sourceFileName = file.name;

        for (let i = dataStartIndex; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (!row || row.length === 0 || !row[2] || !row[3]) continue; // Pular linhas vazias ou sem código/descrição da conta

          const accountSituation = row[0] || null;
          const accountGrouping = row[1] || null;
          const accountCode = String(row[2]);
          const accountName = String(row[3]);

          monthHeaders.forEach((monthHeader, colIndex) => {
            const monthIndex = monthNames.indexOf(monthHeader);
            if (monthIndex !== -1 && row[colIndex] !== undefined && row[colIndex] !== null && row[colIndex] !== '') {
              const amount = parseFloat(String(row[colIndex]).replace(/[^0-9.,-]+/g, '').replace('.', '').replace(',', '.'));
              if (!isNaN(amount)) {
                dreDataToInsert.push({
                  upload_batch_id: uploadBatchId,
                  project_reference: projectReference,
                  period_year: year,
                  period_month: monthIndex + 1,
                  account_code: accountCode,
                  account_name: accountName,
                  account_situation: accountSituation,
                  account_grouping: accountGrouping,
                  amount: amount,
                  status: 'staging',
                  source_file_name: sourceFileName,
                });
              }
            }
          });
        }

        if (dreDataToInsert.length === 0) {
          setMessage('Nenhum dado para importar foi encontrado na planilha ou os dados estão em formato inesperado.');
          setIsLoading(false);
          return;
        }
        
        setMessage(`Processando ${dreDataToInsert.length} registros para o Supabase...`);

        // Inserir em lotes para evitar timeouts ou limites de payload
        const BATCH_SIZE = 500;
        for (let i = 0; i < dreDataToInsert.length; i += BATCH_SIZE) {
          const batch = dreDataToInsert.slice(i, i + BATCH_SIZE);
          const { error } = await supabase.from('financial_dre').insert(batch);
          if (error) {
            throw new Error(`Erro ao inserir lote no Supabase: ${error.message}`);
          }
          setMessage(`Lote ${i / BATCH_SIZE + 1} de ${Math.ceil(dreDataToInsert.length / BATCH_SIZE)} enviado...`);
        }

        setMessage('Upload concluído com sucesso!');
        setFile(null);
        // Limpar o input de arquivo
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

      } catch (error: any) {
        console.error('Erro no upload:', error);
        setMessage(`Erro no upload: ${error.message}`);
      }
      setIsLoading(false);
    };

    reader.onerror = () => {
      console.error('Erro ao ler o arquivo.');
      setMessage('Erro ao ler o arquivo.');
      setIsLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Upload de Arquivo DRE (.xlsx)</h2>
      <div>
        <label htmlFor="projectRef">Referência do Projeto:</label>
        <input 
          type="text" 
          id="projectRef"
          value={projectReference}
          onChange={(e) => setProjectReference(e.target.value)}
          placeholder="Ex: Projeto Alpha"
          style={{ marginLeft: '10px', padding: '8px', marginBottom: '10px', width: '200px' }}
        />
      </div>
      <div>
        <label htmlFor="year">Ano da DRE:</label>
        <input 
          type="number" 
          id="year"
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          style={{ marginLeft: '10px', padding: '8px', marginBottom: '10px', width: '100px' }}
        />
      </div>
      <div>
        <input 
          type="file" 
          id="file-upload"
          accept=".xlsx"
          onChange={handleFileChange} 
          style={{ marginBottom: '10px' }}
        />
      </div>
      <button 
        onClick={handleUpload} 
        disabled={isLoading || !file || !projectReference}
        style={{
          padding: '10px 20px', 
          fontSize: '16px', 
          cursor: (isLoading || !file || !projectReference) ? 'not-allowed' : 'pointer',
          backgroundColor: (isLoading || !file || !projectReference) ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px'
        }}
      >
        {isLoading ? 'Enviando...' : 'Enviar para Supabase'}
      </button>
      {message && <p style={{ marginTop: '15px', color: message.startsWith('Erro') ? 'red' : 'green' }}>{message}</p>}
    </div>
  );
};

export default DreUpload;
