import React from 'react';
import { Button } from '../components/common';
import { Download, Plus, Save } from 'lucide-react';

const ButtonExample: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Exemplos de Botões</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Variantes</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">Primário</Button>
          <Button variant="secondary">Secundário</Button>
          <Button variant="danger">Perigo</Button>
          <Button variant="success">Sucesso</Button>
          <Button variant="outline">Contorno</Button>
          <Button variant="ghost">Fantasma</Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Tamanhos</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="sm">Pequeno</Button>
          <Button size="md">Médio</Button>
          <Button size="lg">Grande</Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Estados</h2>
        <div className="flex flex-wrap gap-4">
          <Button>Normal</Button>
          <Button disabled>Desabilitado</Button>
          <Button loading>Carregando</Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Com Ícones</h2>
        <div className="flex flex-wrap gap-4">
          <Button icon={<Plus size={16} />}>Adicionar</Button>
          <Button icon={<Save size={16} />} variant="success">Salvar</Button>
          <Button icon={<Download size={16} />} variant="outline">Baixar</Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Largura Total</h2>
        <div className="space-y-2">
          <Button fullWidth>Botão de Largura Total</Button>
          <Button fullWidth variant="secondary">Botão de Largura Total</Button>
        </div>
      </div>
    </div>
  );
};

export default ButtonExample;