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

          // Log para debug
          console.log('Primeira linha do Excel:', data[0])
          console.log('Campos disponíveis:', data[0] ? Object.keys(data[0] as Record<string, unknown>) : [])

          // Mostrar apenas as 5 primeiras linhas no preview
          const previewData = data.slice(0, 5)

          setFiles([{
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            preview: previewData,
            data: data // Guardar todos os dados
          }])

          setPreview(previewData)
        } catch (err) {
          console.error('Erro ao ler arquivo:', err)
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
      await importarDados(files[0].data)
      setSuccess(`${files[0].data.length} registros importados com sucesso!`)
      
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
                  <p>Arraste e solte um arquivo aqui, ou clique para selecionar</p>
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
          )}

          <Row>
            <Col className="text-center">
              <Button
                variant="primary"
                onClick={handleImportData}
                disabled={isImporting}
              >
                {isImporting ? 'Importando...' : 'Importar Dados'}
              </Button>
            </Col>
          </Row>
        </>
      )}
    </Container>
  )
}

export default Upload
