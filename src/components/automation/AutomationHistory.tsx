import React, { useState, useEffect } from 'react'
import { Table, Badge, Button, Form, Row, Col, Collapse, Alert, Spinner, Pagination } from 'react-bootstrap'
import { FaChevronDown, FaChevronUp, FaFilter, FaDownload, FaEye } from 'react-icons/fa'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface ExecutionRecord {
  id: string
  execution_id: string
  success: boolean
  file_downloaded: boolean
  file_name: string | null
  file_size: number | null
  records_processed: number
  records_imported: number
  execution_time: number | null
  errors: any
  timestamp: string
  logs?: LogRecord[]
}

interface LogRecord {
  id: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  context: any
  timestamp: string
}

const AutomationHistory: React.FC = () => {
  const [executions, setExecutions] = useState<ExecutionRecord[]>([])
  const [filteredExecutions, setFilteredExecutions] = useState<ExecutionRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState({
    status: 'all',
    dateFrom: '',
    dateTo: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    fetchExecutions()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [executions, filters])

  const fetchExecutions = async () => {
    try {
      // Verificar conectividade
      if (!navigator.onLine) {
        console.warn('Sem conexão com a internet')
        // Tentar carregar dados do cache
        const cachedData = localStorage.getItem('executions_cache')
        if (cachedData) {
          const parsed = JSON.parse(cachedData)
          setExecutions(parsed)
          console.info('Dados de execuções carregados do cache offline')
        }
        setIsLoading(false)
        return
      }

      // Timeout para a requisição
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout
      
      const { data, error } = await supabase
        .from('hitss_automation_executions')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100)
        .abortSignal(controller.signal)
      
      clearTimeout(timeoutId)

      if (error) {
        // Fallback para cache em caso de erro
        const cachedData = localStorage.getItem('executions_cache')
        if (cachedData) {
          const parsed = JSON.parse(cachedData)
          setExecutions(parsed)
          console.info('Dados carregados do cache devido a erro na API')
        }
        return
      }

      const executions = data || []
      setExecutions(executions)
      
      // Cache dos dados para uso offline
      localStorage.setItem('executions_cache', JSON.stringify(executions))
    } catch (error: any) {
      console.error('Erro ao buscar execuções:', error)
      
      // Tratamento específico para diferentes tipos de erro
      if (error.name === 'AbortError') {
        console.warn('Requisição de execuções cancelada por timeout')
      } else if (error.message?.includes('Failed to fetch')) {
        console.warn('Problema de conectividade ao buscar execuções')
      }
      
      // Tentar carregar dados do cache
      const cachedData = localStorage.getItem('executions_cache')
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData)
          setExecutions(parsed)
          console.info('Dados de execuções carregados do cache offline')
        } catch (cacheError) {
          console.error('Erro ao carregar cache de execuções:', cacheError)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const fetchLogs = async (executionId: string) => {
    try {
      // Verificar conectividade
      if (!navigator.onLine) {
        console.warn('Sem conexão para buscar logs')
        return []
      }

      // Timeout para logs
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
      
      const { data, error } = await supabase
        .from('hitss_automation_logs')
        .select('*')
        .eq('execution_id', executionId)
        .order('timestamp', { ascending: true })
        .abortSignal(controller.signal)
      
      clearTimeout(timeoutId)

      if (error) {
        console.error('Erro ao buscar logs:', error)
        return []
      }

      return data || []
    } catch (error: any) {
      console.error('Erro ao buscar logs:', error)
      
      if (error.name === 'AbortError') {
        console.warn('Requisição de logs cancelada por timeout')
      } else if (error.message?.includes('Failed to fetch')) {
        console.warn('Problema de conectividade ao buscar logs')
      }
      
      return []
    }
  }

  const toggleRowExpansion = async (executionId: string) => {
    const newExpandedRows = new Set(expandedRows)
    
    if (expandedRows.has(executionId)) {
      newExpandedRows.delete(executionId)
    } else {
      newExpandedRows.add(executionId)
      
      // Buscar logs se ainda não foram carregados
      const execution = executions.find(e => e.execution_id === executionId)
      if (execution && !execution.logs) {
        const logs = await fetchLogs(executionId)
        const updatedExecutions = executions.map(e => 
          e.execution_id === executionId ? { ...e, logs } : e
        )
        setExecutions(updatedExecutions)
      }
    }
    
    setExpandedRows(newExpandedRows)
  }

  const applyFilters = () => {
    let filtered = [...executions]

    // Filtro por status
    if (filters.status !== 'all') {
      filtered = filtered.filter(execution => {
        if (filters.status === 'success') return execution.success
        if (filters.status === 'error') return !execution.success
        return true
      })
    }

    // Filtro por data
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      filtered = filtered.filter(execution => 
        new Date(execution.timestamp) >= fromDate
      )
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter(execution => 
        new Date(execution.timestamp) <= toDate
      )
    }

    setFilteredExecutions(filtered)
    setCurrentPage(1)
  }

  const getStatusBadge = (success: boolean) => {
    return success ? 
      <Badge bg="success">Sucesso</Badge> : 
      <Badge bg="danger">Erro</Badge>
  }

  const getLogLevelBadge = (level: string) => {
    const variants: { [key: string]: string } = {
      debug: 'secondary',
      info: 'info',
      warn: 'warning',
      error: 'danger'
    }
    return <Badge bg={variants[level] || 'secondary'}>{level.toUpperCase()}</Badge>
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const formatExecutionTime = (time: number | null) => {
    if (!time) return 'N/A'
    if (time < 1000) return `${time}ms`
    return `${(time / 1000).toFixed(1)}s`
  }

  // Paginação
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredExecutions.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredExecutions.length / itemsPerPage)

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" />
        <p className="mt-2">Carregando histórico...</p>
      </div>
    )
  }

  return (
    <div>
      {/* Filtros */}
      <Row className="mb-3">
        <Col md={3}>
          <Form.Group>
            <Form.Label><FaFilter className="me-1" />Status</Form.Label>
            <Form.Select 
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">Todos</option>
              <option value="success">Sucesso</option>
              <option value="error">Erro</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label>Data Inicial</Form.Label>
            <Form.Control 
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label>Data Final</Form.Label>
            <Form.Control 
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </Form.Group>
        </Col>
        <Col md={3} className="d-flex align-items-end">
          <Button 
            variant="outline-secondary" 
            onClick={() => setFilters({ status: 'all', dateFrom: '', dateTo: '' })}
          >
            Limpar Filtros
          </Button>
        </Col>
      </Row>

      {/* Tabela */}
      <Table responsive striped hover>
        <thead>
          <tr>
            <th>Data/Hora</th>
            <th>Status</th>
            <th>Arquivo</th>
            <th>Registros</th>
            <th>Tempo</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((execution) => (
            <React.Fragment key={execution.id}>
              <tr>
                <td>{formatDateTime(execution.timestamp)}</td>
                <td>{getStatusBadge(execution.success)}</td>
                <td>
                  {execution.file_downloaded ? (
                    <div>
                      <div className="fw-bold">{execution.file_name}</div>
                      <small className="text-muted">
                        {formatFileSize(execution.file_size)}
                      </small>
                    </div>
                  ) : (
                    <span className="text-muted">Não baixado</span>
                  )}
                </td>
                <td>
                  <div>
                    <span className="fw-bold">{execution.records_imported}</span>
                    <span className="text-muted"> / {execution.records_processed}</span>
                  </div>
                  <small className="text-muted">importados / processados</small>
                </td>
                <td>{formatExecutionTime(execution.execution_time)}</td>
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => toggleRowExpansion(execution.execution_id)}
                  >
                    <FaEye className="me-1" />
                    {expandedRows.has(execution.execution_id) ? 
                      <FaChevronUp /> : <FaChevronDown />
                    }
                  </Button>
                </td>
              </tr>
              
              {/* Detalhes expandidos */}
              <tr>
                <td colSpan={6} className="p-0">
                  <Collapse in={expandedRows.has(execution.execution_id)}>
                    <div className="p-3 bg-light">
                      <Row>
                        <Col md={6}>
                          <h6>Detalhes da Execução</h6>
                          <ul className="list-unstyled">
                            <li><strong>ID:</strong> {execution.execution_id}</li>
                            <li><strong>Arquivo baixado:</strong> {execution.file_downloaded ? 'Sim' : 'Não'}</li>
                            <li><strong>Registros processados:</strong> {execution.records_processed}</li>
                            <li><strong>Registros importados:</strong> {execution.records_imported}</li>
                          </ul>
                          
                          {execution.errors && (
                            <Alert variant="danger">
                              <strong>Erros:</strong>
                              <pre className="mt-2 mb-0">
                                {typeof execution.errors === 'string' ? execution.errors : JSON.stringify(execution.errors, null, 2)}
                              </pre>
                            </Alert>
                          )}
                        </Col>
                        
                        <Col md={6}>
                          <h6>Logs da Execução</h6>
                          {execution.logs && execution.logs.length > 0 ? (
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                              {execution.logs.map((log) => (
                                <div key={log.id} className="mb-2 p-2 border rounded">
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div className="flex-grow-1">
                                      <div className="d-flex align-items-center mb-1">
                                        {getLogLevelBadge(log.level)}
                                        <small className="text-muted ms-2">
                                          {formatDateTime(log.timestamp)}
                                        </small>
                                      </div>
                                      <div>{log.message}</div>
                                      {log.context && (
                                        <small className="text-muted">
                                          <pre className="mt-1 mb-0">
                                            {typeof log.context === 'string' ? log.context : JSON.stringify(log.context, null, 2)}
                                          </pre>
                                        </small>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted">Nenhum log disponível</p>
                          )}
                        </Col>
                      </Row>
                    </div>
                  </Collapse>
                </td>
              </tr>
            </React.Fragment>
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
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            />
            
            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 2 && page <= currentPage + 2)
              ) {
                return (
                  <Pagination.Item
                    key={page}
                    active={page === currentPage}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Pagination.Item>
                )
              } else if (
                page === currentPage - 3 ||
                page === currentPage + 3
              ) {
                return <Pagination.Ellipsis key={page} />
              }
              return null
            })}
            
            <Pagination.Next 
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            />
            <Pagination.Last 
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            />
          </Pagination>
        </div>
      )}

      {filteredExecutions.length === 0 && (
        <div className="text-center py-4">
          <p className="text-muted">Nenhuma execução encontrada com os filtros aplicados.</p>
        </div>
      )}
    </div>
  )
}

export default AutomationHistory