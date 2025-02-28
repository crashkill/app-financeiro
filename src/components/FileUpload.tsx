import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import { storageService, FinancialData } from '../services/storageService';

interface PreviewData {
  visao: string;
  item: string;
  [key: string]: any;
}

const FileUpload = () => {
  const [previewData, setPreviewData] = useState<PreviewData[]>([]);
  const { toast } = useToast();
  const [uploadHistory, setUploadHistory] = useState(storageService.getUploadHistory());

  const processExcelData = (data: any[][]): PreviewData[] => {
    const headers = data[0];
    const rows = data.slice(1);
    
    return rows.map((row) => {
      const rowData: any = {};
      headers.forEach((header, index) => {
        rowData[header] = row[index];
      });
      return rowData;
    });
  };

  const transformToFinancialData = (data: PreviewData[]): FinancialData[] => {
    const months = ['nov/24', 'dez/24', 'jan/25', 'fev/25', 'mar/25'];
    
    return data.map((row, index) => ({
      id: index.toString(),
      visao: row.visao || 'NSPCLA3669 - NFCON',
      item: row.item,
      months: months.reduce((acc, month) => ({
        ...acc,
        [month]: {
          mensal: parseFloat(row[`${month}_mensal`] || '0'),
          acumulado: parseFloat(row[`${month}_acumulado`] || '0'),
        },
      }), {}),
    }));
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      const processedData = processExcelData(jsonData as any[][]);
      setPreviewData(processedData);

      toast({
        title: 'Arquivo carregado com sucesso',
        description: 'Verifique os dados e clique em "Importar" para confirmar.',
      });

      // Save to upload history
      const historyEntry = {
        id: Date.now().toString(),
        fileName: file.name,
        uploadDate: new Date().toISOString(),
        status: 'success' as const,
      };
      storageService.saveUploadHistory(historyEntry);
      setUploadHistory(storageService.getUploadHistory());

    } catch (error) {
      console.error('Error reading file:', error);
      toast({
        title: 'Erro ao ler arquivo',
        description: 'Verifique se o arquivo está no formato correto.',
        variant: 'destructive',
      });

      // Save error to history
      const historyEntry = {
        id: Date.now().toString(),
        fileName: file.name,
        uploadDate: new Date().toISOString(),
        status: 'error' as const,
        message: 'Erro ao processar arquivo',
      };
      storageService.saveUploadHistory(historyEntry);
      setUploadHistory(storageService.getUploadHistory());
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
  });

  const handleImport = () => {
    if (previewData.length === 0) {
      toast({
        title: 'Nenhum dado para importar',
        description: 'Por favor, carregue um arquivo primeiro.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const financialData = transformToFinancialData(previewData);
      storageService.saveFinancialData(financialData);
      
      toast({
        title: 'Dados importados com sucesso',
        description: 'Os dados foram salvos e estão disponíveis para uso.',
      });
      
      setPreviewData([]);
    } catch (error) {
      toast({
        title: 'Erro ao importar dados',
        description: 'Ocorreu um erro ao processar os dados.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors
          ${isDragActive ? 'border-primary' : 'border-muted-foreground/25'}`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">
          {isDragActive
            ? 'Solte o arquivo aqui...'
            : 'Arraste um arquivo XLSX ou clique para selecionar'}
        </p>
      </div>

      {previewData.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Preview dos dados</h3>
            <Button onClick={handleImport}>Importar Dados</Button>
          </div>
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted">
                  {Object.keys(previewData[0]).map((header) => (
                    <th key={header} className="p-2 text-left font-medium">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.slice(0, 5).map((row, index) => (
                  <tr key={index} className="border-t">
                    {Object.values(row).map((value, i) => (
                      <td key={i} className="p-2">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {previewData.length > 5 && (
              <div className="p-2 text-center text-muted-foreground text-sm">
                Mostrando 5 de {previewData.length} linhas
              </div>
            )}
          </div>
        </div>
      )}

      {uploadHistory.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Histórico de Uploads</h3>
          <div className="space-y-2">
            {uploadHistory.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center space-x-4 p-3 border rounded-lg"
              >
                <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{entry.fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(entry.uploadDate).toLocaleString()}
                  </p>
                </div>
                {entry.status === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
