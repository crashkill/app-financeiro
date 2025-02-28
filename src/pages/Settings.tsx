import FileUpload from '../components/FileUpload';
import { Button } from '../components/ui/button';
import { storageService } from '../services/storageService';
import { useToast } from '../components/ui/use-toast';

const Settings = () => {
  const { toast } = useToast();

  const handleClearData = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os dados?')) {
      storageService.clearFinancialData();
      toast({
        title: 'Dados limpos com sucesso',
        description: 'Todos os dados financeiros foram removidos.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">
          Gerencie suas configurações e importe dados
        </p>
      </div>

      <div className="grid gap-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-medium">Importar Dados</h3>
            <p className="text-sm text-muted-foreground">
              Faça upload de arquivos XLSX para importar dados financeiros
            </p>
          </div>
          <FileUpload />
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-medium">Gerenciamento de Dados</h3>
            <p className="text-sm text-muted-foreground">
              Opções para gerenciar seus dados financeiros
            </p>
          </div>
          <div className="flex space-x-4">
            <Button variant="destructive" onClick={handleClearData}>
              Limpar Todos os Dados
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
