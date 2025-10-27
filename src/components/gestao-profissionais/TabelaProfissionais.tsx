import React, { useState, useMemo } from 'react';
import { Table, Button, Badge, Form, Row, Col, Card, Alert, Spinner, ButtonGroup, Dropdown, Pagination } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaFilter, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { Profissional } from '../../services/profissionaisService';
import { projetosService, Projeto } from '../../services/projetosService';
import { db } from '../../db/database';

interface TabelaProfissionaisProps {
  profissionais: Profissional[];
  isLoading: boolean;
  error: string | null;
  onEdit: (profissional: Profissional) => void;
  onDelete: (profissional: Profissional) => void;
  onAdd: () => void;
}

type SortField = 'nome' | 'regime' | 'local_alocacao' | 'proficiencia_cargo' | 'data_criacao';
type SortDirection = 'asc' | 'desc';

const TabelaProfissionais: React.FC<TabelaProfissionaisProps> = ({
  profissionais,
  isLoading,
  error,
  onEdit,
  onDelete,
  onAdd
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [regimeFilter, setRegimeFilter] = useState<'all' | 'CLT' | 'PJ'>('all');
  const [proficienciaFilter, setProficienciaFilter] = useState<string>('all');
  const [compartilhamentoFilter, setCompartilhamentoFilter] = useState<'all' | 'sim' | 'nao'>('all');
  const [projetoFilter, setProjetoFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Estados para projetos
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loadingProjetos, setLoadingProjetos] = useState(false);

  // Carregar projetos para o filtro
  React.useEffect(() => {
    const carregarProjetos = async () => {
      setLoadingProjetos(true);
      try {
        console.log('🔍 [TabelaProfissionais] Carregando projetos das transações...');
        
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
        console.log(`✅ [TabelaProfissionais] ${projetosFormatados.length} projetos carregados das transações:`, projetosFormatados.map(p => p.nome));
        
      } catch (error) {
        console.error('❌ [TabelaProfissionais] Erro ao carregar projetos das transações:', error);
      } finally {
        setLoadingProjetos(false);
      }
    };

    carregarProjetos();
  }, []);

  // Função para capitalizar nomes
  const capitalizeName = (name: string): string => {
    if (!name) return '';
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Filtrar e ordenar profissionais
  const profissionaisFiltrados = useMemo(() => {
    let filtered = profissionais.filter(prof => {
      const matchesSearch = prof.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           prof.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           prof.tecnologias?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRegime = regimeFilter === 'all' || prof.regime === regimeFilter;
      
      const matchesProficiencia = proficienciaFilter === 'all' || prof.proficiencia_cargo === proficienciaFilter;
      
      const matchesCompartilhamento = compartilhamentoFilter === 'all' ||
                                    (compartilhamentoFilter === 'sim' && prof.disponivel_compartilhamento) ||
                                    (compartilhamentoFilter === 'nao' && !prof.disponivel_compartilhamento);

      const matchesProjeto = projetoFilter === 'all' || 
                            prof.projeto_nome === projetoFilter ||
                            prof.projeto_id?.toString() === projetoFilter;

      return matchesSearch && matchesRegime && matchesProficiencia && matchesCompartilhamento && matchesProjeto;
    });

    // Ordenar
    filtered.sort((a, b) => {
      let aValue = a[sortField] || '';
      let bValue = b[sortField] || '';

      if (sortField === 'data_criacao') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else {
        aValue = aValue.toString().toLowerCase();
        bValue = bValue.toString().toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [profissionais, searchTerm, regimeFilter, proficienciaFilter, compartilhamentoFilter, projetoFilter, sortField, sortDirection]);

  // Calcular dados da paginação
  const totalPages = Math.ceil(profissionaisFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const profissionaisPaginados = profissionaisFiltrados.slice(startIndex, endIndex);

  // Reset página quando filtros mudarem
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, regimeFilter, proficienciaFilter, compartilhamentoFilter, projetoFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <FaSort className="text-muted" />;
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const getBadgeVariant = (regime: string) => {
    return regime === 'CLT' ? 'primary' : 'success';
  };

  const getProficienciaBadge = (proficiencia_cargo: string) => {
    // Cargos técnicos: fundo azul
    const cargosTecnicos = ['Junior', 'Pleno', 'Senior', 'Especialista', 'Arquiteto', 'Tech Lead'];
    // Cargos de gestão: fundo verde
    const cargosGestao = ['Gerente'];
    
    if (cargosTecnicos.includes(proficiencia_cargo)) {
      return 'primary'; // Azul
    } else if (cargosGestao.includes(proficiencia_cargo)) {
      return 'success'; // Verde
    }
    
    return 'secondary'; // Cor padrão para outros casos
  };

  const proficienciasUnicas = useMemo(() => {
    const proficiencias = profissionais
      .map(p => p.proficiencia_cargo)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
    return proficiencias.sort();
  }, [profissionais]);

  const clearFilters = () => {
    setSearchTerm('');
    setRegimeFilter('all');
    setProficienciaFilter('all');
    setCompartilhamentoFilter('all');
    setProjetoFilter('all');
    setCurrentPage(1);
  };

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Erro ao carregar profissionais</Alert.Heading>
        <p>{error}</p>
      </Alert>
    );
  }

  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Gestão de Profissionais</h5>
        <Button variant="primary" onClick={onAdd} disabled={isLoading}>
          <FaPlus className="me-2" />
          Novo Profissional
        </Button>
      </Card.Header>

      <Card.Body>
        {/* Filtros */}
        <Row className="mb-3">
          <Col md={3}>
            <Form.Group>
              <Form.Label>
                <FaSearch className="me-1" />
                Buscar
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Nome, email ou tecnologias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading}
              />
            </Form.Group>
          </Col>

          <Col md={2}>
            <Form.Group>
              <Form.Label>Regime</Form.Label>
              <Form.Select
                value={regimeFilter}
                onChange={(e) => setRegimeFilter(e.target.value as 'all' | 'CLT' | 'PJ')}
                disabled={isLoading}
              >
                <option value="all">Todos</option>
                <option value="CLT">CLT</option>
                <option value="PJ">PJ</option>
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={2}>
            <Form.Group>
              <Form.Label>Proficiência</Form.Label>
              <Form.Select
                value={proficienciaFilter}
                onChange={(e) => setProficienciaFilter(e.target.value)}
                disabled={isLoading}
              >
                <option value="all">Todas</option>
                {proficienciasUnicas.map(prof => (
                  <option key={prof} value={prof}>{prof}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={2}>
            <Form.Group>
              <Form.Label>Projeto</Form.Label>
              <Form.Select
                value={projetoFilter}
                onChange={(e) => setProjetoFilter(e.target.value)}
                disabled={isLoading || loadingProjetos}
              >
                <option value="all">Todos</option>
                {projetos.map(projeto => (
                  <option key={projeto.id} value={projeto.id}>
                    {projeto.nome}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={1} className="d-flex align-items-end">
            <Button
              variant="outline-secondary"
              onClick={clearFilters}
              disabled={isLoading}
              className="w-100"
              title="Limpar filtros"
            >
              <FaFilter />
            </Button>
          </Col>
        </Row>

        {/* Estatísticas */}
        <Row className="mb-3">
          <Col>
            <small className="text-muted">
              Mostrando {startIndex + 1}-{Math.min(endIndex, profissionaisFiltrados.length)} de {profissionaisFiltrados.length} profissionais
              {searchTerm && ` • Filtro: "${searchTerm}"`}
            </small>
          </Col>
        </Row>

        {/* Tabela */}
        {isLoading ? (
          <div className="text-center py-4">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Carregando...</span>
            </Spinner>
            <p className="mt-2 text-muted">Carregando profissionais...</p>
          </div>
        ) : profissionaisFiltrados.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted mb-3">
              {profissionais.length === 0 
                ? 'Nenhum profissional cadastrado' 
                : 'Nenhum profissional encontrado com os filtros aplicados'
              }
            </p>
            {profissionais.length === 0 && (
              <Button variant="primary" onClick={onAdd}>
                <FaPlus className="me-2" />
                Cadastrar Primeiro Profissional
              </Button>
            )}
          </div>
        ) : (
          <>
            <Table striped hover>
              <thead>
                <tr>
                  <th 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSort('nome')}
                  >
                    Nome {getSortIcon('nome')}
                  </th>
                  <th>Email</th>
                  <th 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSort('regime')}
                  >
                    Regime {getSortIcon('regime')}
                  </th>
                  <th 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSort('local_alocacao')}
                  >
                    Local {getSortIcon('local_alocacao')}
                  </th>
                  <th 
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSort('proficiencia_cargo')}
                  >
                    Proficiência {getSortIcon('proficiencia_cargo')}
                  </th>
                  <th>Projeto</th>
                  <th>Compartilhamento</th>
                  <th width="120">Ações</th>
                </tr>
              </thead>
              <tbody>
                {profissionaisPaginados.map((profissional) => (
                  <tr key={`${profissional.origem}-${profissional.id}`}>
                    <td>
                      <strong>{capitalizeName(profissional.nome || '')}</strong>
                      {profissional.origem === 'colaboradores' && (
                        <Badge bg="info" className="ms-2" size="sm">DRE</Badge>
                      )}
                    </td>
                    <td>
                      <small className="text-muted">{profissional.email}</small>
                    </td>
                    <td>
                      <Badge bg={getBadgeVariant(profissional.regime || '')}>
                        {profissional.regime}
                      </Badge>
                    </td>
                    <td>
                      <small>{profissional.local_alocacao || '-'}</small>
                    </td>
                    <td>
                      {profissional.proficiencia_cargo && (
                        <Badge bg={getProficienciaBadge(profissional.proficiencia_cargo)}>
                          {profissional.proficiencia_cargo}
                        </Badge>
                      )}
                    </td>
                    <td>
                      {profissional.projeto_nome ? (
                        <small className="text-primary">
                          {profissional.projeto_nome}
                        </small>
                      ) : (
                        <small className="text-muted">-</small>
                      )}
                    </td>
                    <td>
                      <Badge bg={profissional.disponivel_compartilhamento ? 'success' : 'secondary'}>
                        {profissional.disponivel_compartilhamento ? 'Sim' : 'Não'}
                      </Badge>
                    </td>
                    <td>
                      <ButtonGroup size="sm">
                        <Button
                          variant="outline-primary"
                          onClick={() => onEdit(profissional)}
                          title="Editar"
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          onClick={() => onDelete(profissional)}
                          title="Excluir"
                        >
                          <FaTrash />
                        </Button>
                      </ButtonGroup>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-3">
                <Pagination>
                  <Pagination.First 
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  />
                  <Pagination.Prev 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  />
                  
                  {/* Páginas */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <Pagination.Item
                        key={pageNumber}
                        active={pageNumber === currentPage}
                        onClick={() => setCurrentPage(pageNumber)}
                      >
                        {pageNumber}
                      </Pagination.Item>
                    );
                  })}
                  
                  <Pagination.Next 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  />
                  <Pagination.Last 
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              </div>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default TabelaProfissionais;