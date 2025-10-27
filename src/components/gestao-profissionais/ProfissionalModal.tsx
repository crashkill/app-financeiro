import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert, Spinner, Badge } from 'react-bootstrap';
import { Profissional } from '../../services/profissionaisService';
import { projetosService, Projeto } from '../../services/projetosService';
import { db } from '../../db/database';

interface ProfissionalModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (profissional: Partial<Profissional>) => Promise<void>;
  isLoading: boolean;
}

// Lista de tecnologias disponíveis
const TECNOLOGIAS_DISPONIVEIS = [
  'React',
  'Angular',
  'Vue.js',
  'Node.js',
  'Express.js',
  'Python',
  'Django',
  'Flask',
  'Java',
  'Spring Boot',
  'C#',
  '.NET',
  'PHP',
  'Laravel',
  'JavaScript',
  'TypeScript',
  'HTML',
  'CSS',
  'SASS',
  'Bootstrap',
  'Tailwind CSS',
  'MySQL',
  'PostgreSQL',
  'MongoDB',
  'Redis',
  'Docker',
  'Kubernetes',
  'AWS',
  'Azure',
  'Google Cloud',
  'Git',
  'Jenkins',
  'CI/CD',
  'Scrum',
  'Kanban',
  'REST API',
  'GraphQL',
  'Microservices',
  'DevOps',
  'Linux',
  'Windows Server'
];

const ProfissionalModal: React.FC<ProfissionalModalProps> = ({
  show,
  onHide,
  profissional,
  onSave,
  isLoading
}) => {
  const [formData, setFormData] = useState<Partial<Profissional>>({
    nome: '',
    email: '',
    regime: 'CLT',
    local_alocacao: '',
    proficiencia_cargo: '',
    tecnologias: [],
    projeto_id: null,
    disponivel_compartilhamento: false,
    percentual_compartilhamento: 0,
    data_inicio: '',
    data_fim: '',
    valor_hora: 0,
    valor_mensal: 0,
    observacoes: ''
  });

  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loadingProjetos, setLoadingProjetos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tecnologiasSelecionadas, setTecnologiasSelecionadas] = useState<string[]>([]);

  // Carregar projetos
  useEffect(() => {
    const carregarProjetos = async () => {
      if (!show) return; // Só carregar quando o modal estiver aberto
      
      setLoadingProjetos(true);
      try {
        console.log('🔍 [ProfissionalModal] Carregando projetos das transações...');
        
        // Usar a mesma fonte que o Dashboard: extrair projetos das transações
        const transacoes = await db.transacoes.toArray();
        const projetosUnicos = Array.from(new Set(transacoes.map(t => t.descricao || 'Sem Projeto'))) as string[];
        
        // Converter para o formato esperado pelo componente
        const projetosFormatados = projetosUnicos.map((nome, index) => ({
          id: index + 1,
          nome: nome,
          status: 'ativo'
        }));
        
        setProjetos(projetosFormatados);
        console.log(`✅ [ProfissionalModal] ${projetosFormatados.length} projetos carregados das transações:`, projetosFormatados.map(p => p.nome));
        
      } catch (error) {
        console.error('❌ [ProfissionalModal] Erro ao carregar projetos das transações:', error);
        setProjetos([]);
      } finally {
        setLoadingProjetos(false);
      }
    };

    carregarProjetos();
  }, [show]);

  // Preencher formulário quando profissional mudar
  useEffect(() => {
    if (profissional) {
      console.log('🔍 [ProfissionalModal] Processando profissional:', profissional.nome);
      console.log('🔍 [ProfissionalModal] Tecnologias recebidas:', profissional.tecnologias);
      console.log('🔍 [ProfissionalModal] Tipo das tecnologias:', typeof profissional.tecnologias);
      
      setFormData({
        ...profissional,
        tecnologias: profissional.tecnologias || []
      });
      
      // Processar tecnologias
      let techs: string[] = [];
      if (profissional.tecnologias) {
        if (typeof profissional.tecnologias === 'string') {
          console.log('📝 [ProfissionalModal] Tecnologias são string, tentando parse...');
          // Se for string, tentar fazer parse ou dividir por vírgula
          try {
            techs = JSON.parse(profissional.tecnologias);
            console.log('✅ [ProfissionalModal] Parse JSON bem-sucedido:', techs);
          } catch {
            console.log('⚠️ [ProfissionalModal] Parse JSON falhou, dividindo por vírgula...');
            techs = profissional.tecnologias.split(',').map(t => t.trim()).filter(Boolean);
            console.log('✅ [ProfissionalModal] Divisão por vírgula:', techs);
          }
        } else if (Array.isArray(profissional.tecnologias)) {
          console.log('📝 [ProfissionalModal] Tecnologias são array:', profissional.tecnologias);
          techs = profissional.tecnologias;
        } else if (typeof profissional.tecnologias === 'object') {
          console.log('📝 [ProfissionalModal] Tecnologias são objeto:', profissional.tecnologias);
          // Se for objeto, pode ser um JSONB do Supabase
          if (profissional.tecnologias && Object.keys(profissional.tecnologias).length > 0) {
            // Se o objeto tem propriedades, pode ser um array serializado ou objeto com chaves
            if (Array.isArray(Object.values(profissional.tecnologias)[0])) {
              // Se o primeiro valor é um array, usar esse array
              techs = Object.values(profissional.tecnologias)[0] as string[];
            } else {
              // Se são chaves do objeto, usar as chaves como tecnologias
              techs = Object.keys(profissional.tecnologias);
            }
          }
          console.log('✅ [ProfissionalModal] Tecnologias processadas do objeto:', techs);
        }
      }
      
      console.log('🎯 [ProfissionalModal] Tecnologias finais selecionadas:', techs);
      setTecnologiasSelecionadas(techs);
    } else {
      setFormData({
        nome: '',
        email: '',
        regime: 'CLT',
        local_alocacao: '',
        proficiencia_cargo: '',
        tecnologias: [],
        projeto_id: null,
        disponivel_compartilhamento: false,
        percentual_compartilhamento: 0,
        data_inicio: '',
        data_fim: '',
        valor_hora: 0,
        valor_mensal: 0,
        observacoes: ''
      });
      setTecnologiasSelecionadas([]);
    }
    setError(null);
  }, [profissional]);

  const handleInputChange = (field: keyof Profissional, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTecnologiaToggle = (tecnologia: string) => {
    setTecnologiasSelecionadas(prev => {
      const novaLista = prev.includes(tecnologia)
        ? prev.filter(t => t !== tecnologia)
        : [...prev, tecnologia];
      
      // Atualizar formData também
      setFormData(prevForm => ({
        ...prevForm,
        tecnologias: novaLista
      }));
      
      return novaLista;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const dadosParaSalvar = {
        ...formData,
        tecnologias: tecnologiasSelecionadas
      };
      
      await onSave(dadosParaSalvar);
      onHide();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao salvar profissional');
    }
  };

  const isEditing = !!profissional;

  return (
    <Modal show={show} onHide={onHide} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          {isEditing ? 'Editar Profissional' : 'Novo Profissional'}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}

          {/* Dados Básicos */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Nome *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.nome || ''}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Email *</Form.Label>
                <Form.Control
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Regime e Local */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Regime de Contratação *</Form.Label>
                <Form.Select
                  value={formData.regime || 'CLT'}
                  onChange={(e) => handleInputChange('regime', e.target.value)}
                  required
                  disabled={isLoading}
                >
                  <option value="CLT">CLT</option>
                  <option value="PJ">PJ</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Local de Alocação</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.local_alocacao || ''}
                  onChange={(e) => handleInputChange('local_alocacao', e.target.value)}
                  disabled={isLoading}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Proficiência */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Proficiência/Cargo</Form.Label>
                <Form.Select
                  value={formData.proficiencia_cargo || ''}
                  onChange={(e) => handleInputChange('proficiencia_cargo', e.target.value)}
                  disabled={isLoading}
                >
                  <option value="">Selecione...</option>
                  <option value="Junior">Junior</option>
                  <option value="Pleno">Pleno</option>
                  <option value="Senior">Senior</option>
                  <option value="Especialista">Especialista</option>
                  <option value="Arquiteto">Arquiteto</option>
                  <option value="Tech Lead">Tech Lead</option>
                  <option value="Gerente">Gerente</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {/* Tecnologias - Múltipla Seleção */}
          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Tecnologias</Form.Label>
                <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <Row>
                    {TECNOLOGIAS_DISPONIVEIS.map((tecnologia) => (
                      <Col md={4} key={tecnologia} className="mb-2">
                        <Form.Check
                          type="checkbox"
                          id={`tech-${tecnologia}`}
                          label={tecnologia}
                          checked={tecnologiasSelecionadas.includes(tecnologia)}
                          onChange={() => handleTecnologiaToggle(tecnologia)}
                          disabled={isLoading}
                        />
                      </Col>
                    ))}
                  </Row>
                </div>
                {tecnologiasSelecionadas.length > 0 && (
                  <div className="mt-2">
                    <small className="text-muted">Selecionadas:</small>
                    <div className="mt-1">
                      {tecnologiasSelecionadas.map((tech) => (
                        <Badge 
                          key={tech} 
                          bg="primary" 
                          className="me-1 mb-1"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleTecnologiaToggle(tech)}
                        >
                          {tech} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Form.Group>
            </Col>
          </Row>

          {/* Projeto Vinculado */}
          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Projeto Vinculado</Form.Label>
                <Form.Select
                  value={formData.projeto_id || ''}
                  onChange={(e) => handleInputChange('projeto_id', e.target.value ? parseInt(e.target.value) : null)}
                  disabled={isLoading || loadingProjetos}
                >
                  <option value="">
                    {loadingProjetos 
                      ? 'Carregando projetos...' 
                      : projetos.length === 0 
                        ? 'Nenhum projeto ativo encontrado' 
                        : 'Selecione um projeto'
                    }
                  </option>
                  {projetos.map((projeto) => (
                    <option key={projeto.id} value={projeto.id}>
                      {projeto.nome}
                    </option>
                  ))}
                </Form.Select>
                {loadingProjetos && (
                  <small className="text-muted d-flex align-items-center">
                    <Spinner animation="border" size="sm" className="me-2" />
                    Carregando projetos...
                  </small>
                )}
                {!loadingProjetos && projetos.length === 0 && (
                  <small className="text-warning">
                    ⚠️ Nenhum projeto ativo encontrado. Verifique se há projetos cadastrados no sistema.
                  </small>
                )}
              </Form.Group>
            </Col>
          </Row>

          {/* Datas do Projeto - Movidas para abaixo do Projeto Vinculado */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Data de Início</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.data_inicio || ''}
                  onChange={(e) => handleInputChange('data_inicio', e.target.value)}
                  disabled={isLoading}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Data de Fim</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.data_fim || ''}
                  onChange={(e) => handleInputChange('data_fim', e.target.value)}
                  disabled={isLoading}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Compartilhamento */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Check
                  type="checkbox"
                  label="Disponível para Compartilhamento"
                  checked={formData.disponivel_compartilhamento || false}
                  onChange={(e) => handleInputChange('disponivel_compartilhamento', e.target.checked)}
                  disabled={isLoading}
                />
              </Form.Group>
            </Col>
            {formData.disponivel_compartilhamento && (
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Percentual de Compartilhamento (%)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max="100"
                    value={formData.percentual_compartilhamento || 0}
                    onChange={(e) => handleInputChange('percentual_compartilhamento', parseInt(e.target.value) || 0)}
                    disabled={isLoading}
                  />
                </Form.Group>
              </Col>
            )}
          </Row>

          {/* Valores (apenas para PJ) */}
          {formData.regime === 'PJ' && (
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Valor por Hora (R$)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor_hora || 0}
                    onChange={(e) => handleInputChange('valor_hora', parseFloat(e.target.value) || 0)}
                    disabled={isLoading}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Valor Mensal (R$)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valor_mensal || 0}
                    onChange={(e) => handleInputChange('valor_mensal', parseFloat(e.target.value) || 0)}
                    disabled={isLoading}
                  />
                </Form.Group>
              </Col>
            </Row>
          )}

          {/* Observações */}
          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>Observações</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.observacoes || ''}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  disabled={isLoading}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                {isEditing ? 'Atualizando...' : 'Salvando...'}
              </>
            ) : (
              isEditing ? 'Atualizar' : 'Salvar'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ProfissionalModal;