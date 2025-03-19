import { useState, useCallback, useEffect } from 'react'
import { Container, Row, Col, Card, Alert, Table, Button } from 'react-bootstrap'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'
import { importarDados, db } from '../db/database'
import { useNavigate } from 'react-router-dom'

interface FileData {
  name: string
  size: number
  type: string
  lastModified: number
  preview?: any[]
  data?: any[]
}

const Upload = () => {
  const navigate = useNavigate()
  const [files, setFiles] = useState<FileData[]>([])
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [preview, setPreview] = useState<any[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [savedData, setSavedData] = useState<any[]>([])

  // Adiciona função para verificar dados salvos no IndexedDB
  const verificarDadosSalvos = async () => {
    try {
      const transacoes = await db.transacoes.toArray();
      console.log("Dados salvos no IndexedDB:", transacoes);
      
      // Verificar anos e projetos distintos para debug
      const anosDistintos = new Set();
      const projetosDistintos = new Set();
      const periodsDistintos = new Set();
      
      transacoes.forEach(t => {
        if (t.periodo) {
          periodsDistintos.add(t.periodo);
          const [, ano] = t.periodo.split("/");
          if (ano) anosDistintos.add(ano);
        }
        if (t.projeto) projetosDistintos.add(t.projeto);
      });
      
      console.log("Anos distintos:", Array.from(anosDistintos));
      console.log("Períodos distintos:", Array.from(periodsDistintos));
      console.log("Projetos distintos:", Array.from(projetosDistintos));
      
      setSavedData(transacoes.slice(0, 5));
    } catch (error) {
      console.error("Erro ao verificar dados salvos:", error);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError('')
    setSuccess('')

    acceptedFiles.forEach((file) => {
      const reader = new FileReader()

      reader.onabort = () => setError('A leitura do arquivo foi abortada')
      reader.onerror = () => setError('Ocorreu um erro na leitura do arquivo')
      
      reader.onload = (e) => {
        try {
          if (!e.target || !e.target.result) {
            throw new Error('Erro ao ler conteúdo do arquivo')
          }

          // Converte o resultado para ArrayBuffer que é mais confiável para o XLSX
          const data = e.target.result
          const workbook = XLSX.read(data, { type: 'array' })
          
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error('Planilha vazia ou inválida')
          }
          
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          
          // Adiciona opções para melhor processamento de células vazias ou tipos incorretos
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            defval: null,  // valor padrão para células vazias
            raw: false     // converte valores para tipos apropriados
          })

          if (!jsonData || jsonData.length === 0) {
            throw new Error('Não foram encontrados dados na planilha')
          }

          // Log para debug
          console.log('Primeira linha do Excel:', jsonData[0])
          console.log('Campos disponíveis:', jsonData[0] ? Object.keys(jsonData[0] as Record<string, unknown>) : [])

          // Mostrar apenas as 5 primeiras linhas no preview
          const previewData = jsonData.slice(0, 5)

          setFiles([{
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            preview: previewData,
            data: jsonData // Guardar todos os dados
          }])

          setPreview(previewData)
        } catch (err) {
          console.error('Erro ao processar arquivo:', err)
          setError('Erro ao ler o arquivo. Certifique-se de que é uma planilha válida com dados no formato correto.')
        }
      }

      // Lendo como ArrayBuffer em vez de BinaryString para melhor compatibilidade
      reader.readAsArrayBuffer(file)
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  })

  const handleImportData = async () => {
    if (files.length === 0 || !files[0].data || files[0].data.length === 0) {
      setError('Nenhum dado válido para importar')
      return
    }

    try {
      setIsImporting(true)
      setError('')
      
      const result = await importarDados(files[0].data)
      setSuccess(`${result?.count || files[0].data.length} registros importados com sucesso!`)
      
      // Verificar dados salvos
      await verificarDadosSalvos();
      
      // Limpar o formulário após importação bem-sucedida
      setFiles([])
      setPreview([])
      
      // Redirecionar para o dashboard após 2 segundos
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (err) {
      console.error('Erro na importação:', err)
      setError('Erro ao importar os dados. Verifique o formato do arquivo e se os campos necessários estão presentes.')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Container fluid className="py-3">
      <Row className="mb-4">
        <Col>
          <h2>Upload de Dados</h2>
        </Col>
      </Row>

      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger">{error}</Alert>
          </Col>
        </Row>
      )}

      {success && (
        <Row className="mb-4">
          <Col>
            <Alert variant="success">{success}</Alert>
          </Col>
        </Row>
      )}

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <div
                {...getRootProps()}
                className={`dropzone ${isDragActive ? 'active' : ''}`}
                style={{
                  border: '2px dashed #ccc',
                  borderRadius: '4px',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                <input {...getInputProps()} />
                {isDragActive ? (
                  <p>Solte o arquivo aqui...</p>
                ) : (
                  <p>Arraste e solte um arquivo Excel aqui, ou clique para selecionar</p>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {files.length > 0 && (
        <>
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Body>
                  <h5>Arquivo Selecionado:</h5>
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Tamanho</th>
                        <th>Tipo</th>
                        <th>Última Modificação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((file, index) => (
                        <tr key={index}>
                          <td>{file.name}</td>
                          <td>{Math.round(file.size / 1024)} KB</td>
                          <td>{file.type}</td>
                          <td>{new Date(file.lastModified).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {preview.length > 0 && (
            <Row className="mb-4">
              <Col>
                <Card>
                  <Card.Body>
                    <h5>Preview dos Dados:</h5>
                    <div className="table-responsive">
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            {Object.keys(preview[0]).map((key) => (
                              <th key={key}>{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.map((row, index) => (
                            <tr key={index}>
                              {Object.values(row).map((value: any, i) => (
                                <td key={i}>{value !== null ? value : ''}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          <Row>
            <Col className="text-center">
              <Button
                variant="primary"
                onClick={handleImportData}
                disabled={isImporting}
                className="me-2"
              >
                {isImporting ? 'Importando...' : 'Importar Dados'}
              </Button>
              
              <Button 
                variant="secondary" 
                onClick={verificarDadosSalvos}
              >
                Verificar Dados Salvos
              </Button>
            </Col>
          </Row>
        </>
      )}
      
      {savedData.length > 0 && (
        <Row className="mt-4">
          <Col>
            <Card>
              <Card.Body>
                <h5>Dados Salvos no Banco (Primeiros 5):</h5>
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Projeto</th>
                        <th>Período</th>
                        <th>Tipo</th>
                        <th>Natureza</th>
                        <th>Descrição</th>
                        <th>Valor</th>
                        <th>Conta Resumo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedData.map((item: any) => (
                        <tr key={item.id}>
                          <td>{item.id}</td>
                          <td>{item.projeto}</td>
                          <td>{item.periodo}</td>
                          <td>{item.tipo}</td>
                          <td>{item.natureza}</td>
                          <td>{item.descricao}</td>
                          <td>{item.valor}</td>
                          <td>{item.contaResumo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  )
}

export default Upload
