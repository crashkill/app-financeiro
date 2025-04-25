import { useState, useCallback } from 'react'
import { Card, Alert, Table, Button, Modal } from 'react-bootstrap'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'
import { db, importarProfissionais } from '../../db/database'

interface FileData {
  name: string
  size: number
  type: string
  lastModified: number
  preview?: any[]
  data?: any[]
}

interface ProfissionalData {
  nome: string
  tipo: string
  custo: number
  projeto: string
}

interface UploadProfissionaisProps {
  show: boolean
  onHide: () => void
  onSuccess: () => void
}

const UploadProfissionais: React.FC<UploadProfissionaisProps> = ({ show, onHide, onSuccess }) => {
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

      reader.onabort = () => setError('A leitura do arquivo foi abortada')
      reader.onerror = () => setError('Ocorreu um erro na leitura do arquivo')

      reader.onload = (e) => {
        try {
          if (!e.target || !e.target.result) {
            throw new Error('Erro ao ler conteúdo do arquivo')
          }

          const data = e.target.result
          const workbook = XLSX.read(data, { type: 'array' })
          
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            throw new Error('Planilha vazia ou inválida')
          }

          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]

          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            defval: null,
            raw: false
          })
          
          if (!jsonData || jsonData.length === 0) {
            throw new Error('Não foram encontrados dados na planilha')
          }

          console.log('[UploadProfissionais.tsx] Primeira linha lida:', jsonData[0])
          console.log('[UploadProfissionais.tsx] Campos disponíveis:', jsonData[0] ? Object.keys(jsonData[0] as Record<string, unknown>) : [])

          const previewData = jsonData.slice(0, 5)

          setFiles([{
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            preview: previewData,
            data: jsonData
          }])

          setPreview(previewData)
        } catch (err) {
          console.error('Erro ao processar arquivo:', err)
          setError(`Erro ao processar o arquivo: ${err instanceof Error ? err.message : String(err)}. Verifique o formato.`)
        }
      }

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
    if (files.length === 0 || !files[0].data) {
      setError('Nenhum arquivo para importar')
      return
    }

    try {
      setIsImporting(true)
      setError('')
      
      // Usar a função importarProfissionais do banco de dados
      const result = await importarProfissionais(files[0].data)
      
      setSuccess(`${result.count} profissionais importados com sucesso!`)
      
      // Limpar o formulário após importação bem-sucedida
      setFiles([])
      setPreview([])
      
      // Notificar o componente pai para atualizar os dados
      setTimeout(() => {
        onSuccess()
        onHide()
      }, 2000)
    } catch (err) {
      console.error('Erro na importação:', err)
      setError(`Erro ao importar os dados: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsImporting(false)
    }
  }

  const handleDownloadModelo = () => {
    // Criar estrutura do modelo
    const modeloData = [
      {
        'Nome do Profissional': 'João Silva',
        'Tipo de Contratação': 'CLT',
        'Custo Total': 10000,
        'Projeto': 'Projeto A'
      },
      {
        'Nome do Profissional': 'Maria Santos',
        'Tipo de Contratação': 'PJ',
        'Custo Total': 15000,
        'Projeto': 'Projeto B'
      }
    ]

    // Criar planilha
    const worksheet = XLSX.utils.json_to_sheet(modeloData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Profissionais')

    // Gerar arquivo e fazer download
    XLSX.writeFile(workbook, 'modelo-importacao-profissionais.xlsx')
  }

  const handleClose = () => {
    setFiles([])
    setPreview([])
    setError('')
    setSuccess('')
    onHide()
  }

  return (
    <Modal 
      show={show} 
      onHide={handleClose}
      size="lg"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Upload de Profissionais</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" onClose={() => setSuccess('')} dismissible>
            {success}
          </Alert>
        )}

        <Card className="mb-4">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Arquivo para Importação</h5>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleDownloadModelo}
              >
                <i className="bi bi-download me-1"></i>
                Baixar Modelo
              </Button>
            </div>
            
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
                <p>Solte o arquivo aqui ...</p>
              ) : (
                <p>
                  Arraste e solte um arquivo Excel aqui, ou clique para
                  selecionar
                </p>
              )}
              <small className="text-muted d-block mt-2">
                O arquivo deve conter as colunas: Nome do Profissional, Tipo de Contratação (CLT ou PJ), 
                Custo Total e Projeto
              </small>
            </div>
          </Card.Body>
        </Card>

        {files.length > 0 && preview.length > 0 && (
          <>
            <h5>Preview dos Dados</h5>
            <p className="text-muted">
              Mostrando as primeiras 5 linhas do arquivo
            </p>

            <div className="table-responsive">
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    {Object.keys(preview[0]).map((header) => (
                      <th key={header}>{header}</th>
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
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleImportData}
          disabled={isImporting || files.length === 0}
        >
          {isImporting ? 'Importando...' : 'Importar Dados'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default UploadProfissionais 