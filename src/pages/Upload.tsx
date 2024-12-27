import { useState, useCallback } from 'react'
import { Container, Row, Col, Card, Alert, Table, Button } from 'react-bootstrap'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'
import { importarDados } from '../db/database'
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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError('')
    setSuccess('')

    acceptedFiles.forEach((file) => {
      const reader = new FileReader()

      reader.onload = () => {
        try {
          const workbook = XLSX.read(reader.result, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const data = XLSX.utils.sheet_to_json(worksheet)

          // Mostrar apenas as 5 primeiras linhas no preview
          const previewData = data.slice(0, 5)

          setFiles(prev => [{
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            preview: previewData,
            data: data // Guardar todos os dados
          }])

          setPreview(previewData)
        } catch (err) {
          setError('Erro ao ler o arquivo. Certifique-se de que é uma planilha válida.')
        }
      }

      reader.readAsBinaryString(file)
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
    if (files.length === 0 || !files[0].data) {
      setError('Nenhum arquivo para importar')
      return
    }

    try {
      setIsImporting(true)
      setError('')
      const result = await importarDados(files[0].data)
      setSuccess(`${result.count} registros importados com sucesso!`)
      
      // Limpar o formulário após importação bem-sucedida
      setFiles([])
      setPreview([])
      
      // Redirecionar para o dashboard após 2 segundos
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (err) {
      setError('Erro ao importar os dados. Verifique o formato do arquivo.')
    } finally {
      setIsImporting(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1>Upload de Arquivos</h1>
          <p className="text-muted">Importe seus dados financeiros</p>
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
                className={`text-center p-5 border-2 border-dashed rounded-3 ${
                  isDragActive ? 'bg-light border-primary' : 'border-secondary'
                }`}
                style={{ cursor: 'pointer' }}
              >
                <input {...getInputProps()} />
                {isDragActive ? (
                  <p className="mb-0">Solte o arquivo aqui...</p>
                ) : (
                  <>
                    <p className="mb-0">
                      Arraste e solte um arquivo aqui, ou clique para selecionar
                    </p>
                    <p className="text-muted small mb-0">
                      (Aceita arquivos .xlsx, .xls e .csv)
                    </p>
                  </>
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
              <h5>Arquivos Carregados</h5>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Tamanho</th>
                    <th>Tipo</th>
                    <th>Data de Modificação</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file, index) => (
                    <tr key={index}>
                      <td>{file.name}</td>
                      <td>{formatFileSize(file.size)}</td>
                      <td>{file.type || 'N/A'}</td>
                      <td>
                        {new Date(file.lastModified).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Col>
          </Row>

          {preview.length > 0 && (
            <>
              <Row className="mb-4">
                <Col>
                  <h5>Preview dos Dados</h5>
                  <Card>
                    <Card.Body>
                      <div className="table-responsive">
                        <Table hover>
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
                                  <td key={i}>{value}</td>
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

              <Row className="mb-4">
                <Col className="text-center">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleImportData}
                    disabled={isImporting}
                  >
                    {isImporting ? 'Importando...' : 'Inserir Dados'}
                  </Button>
                </Col>
              </Row>
            </>
          )}
        </>
      )}
    </Container>
  )
}

export default Upload
